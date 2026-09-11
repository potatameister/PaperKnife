/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { PDFDocument, degrees } from 'pdf-lib'

// We use self.onmessage because this is a Web Worker
self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data

  try {
    if (type === 'MERGE_PDFS') {
      const { files } = payload
      if (!files || files.length === 0) throw new Error('No files received')
      const mergedPdf = await PDFDocument.create()
      let totalPages = 0

      for (let i = 0; i < files.length; i++) {
        const { buffer, rotation, password, name } = files[i]
        const label = name || `File ${i + 1}`
        if (!buffer || (buffer as Uint8Array).byteLength === 0) throw new Error(`"${label}" is empty or unreadable`)

        let pdf
        try {
          pdf = await PDFDocument.load(buffer, {
            password: password || undefined,
            ignoreEncryption: true, throwOnInvalidObject: false
          } as any)
        } catch (e: any) {
          throw new Error(`"${label}" could not be opened (${e?.message || 'corrupt or unsupported file'})`)
        }

        let pageIndices: number[]
        try {
          pageIndices = pdf.getPageIndices()
        } catch {
          throw new Error(`"${label}" pages could not be read (password-protected or corrupt?)`)
        }
        if (pageIndices.length === 0) throw new Error(`"${label}" has no pages`)

        let copiedPages
        try {
          copiedPages = await mergedPdf.copyPages(pdf, pageIndices)
        } catch {
          throw new Error(`"${label}" pages could not be copied (password-protected or restricted?)`)
        }

        const rot = Number.isFinite(rotation) ? rotation : 0
        copiedPages.forEach((page) => {
          const currentRotation = page.getRotation().angle
          page.setRotation(degrees((currentRotation + rot) % 360))
          mergedPdf.addPage(page)
        })
        totalPages += copiedPages.length

        self.postMessage({ type: 'PROGRESS', payload: Math.round(((i + 1) / files.length) * 100) })
      }

      if (totalPages === 0) throw new Error('No pages to merge')
      let mergedPdfBytes
      try {
        mergedPdfBytes = await mergedPdf.save()
      } catch {
        throw new Error('Merged result could not be saved (damaged content in one of the files?)')
      }
      self.postMessage({ type: 'SUCCESS', payload: mergedPdfBytes }, [mergedPdfBytes.buffer] as any)
    } 
    
    else if (type === 'SPLIT_PDF') {
      const { buffer, password, selectedPages, mode, customFileName, name } = payload
      const label = name || 'File'
      if (!buffer || (buffer as Uint8Array).byteLength === 0) throw new Error(`"${label}" is empty or unreadable`)
      const picked = Array.from(selectedPages as number[]).sort((a, b) => a - b)
      if (picked.length === 0) throw new Error('No pages selected')

      let originalPdf
      try {
        originalPdf = await PDFDocument.load(buffer, {
          password: password || undefined,
          ignoreEncryption: true, throwOnInvalidObject: false
        } as any)
      } catch (e: any) {
        throw new Error(`"${label}" could not be opened (${e?.message || 'corrupt or unsupported file'})`)
      }
      let pageCount: number | null = null
      try {
        pageCount = originalPdf.getPageCount()
      } catch {
        throw new Error(`"${label}" page index is damaged (file may be corrupt)`)
      }
      const bad = picked.filter(p => p < 1 || p > (pageCount as number))
      if (bad.length > 0) throw new Error(`Pages ${bad.join(', ')} are out of range (file has ${pageCount} pages)`)

      if (mode === 'single') {
        const newPdf = await PDFDocument.create()
        const sortedIndices = picked.map(p => p - 1)
        let copiedPages
        try {
          copiedPages = await newPdf.copyPages(originalPdf, sortedIndices)
        } catch {
          throw new Error(`Selected pages could not be copied (password-protected or restricted?)`)
        }
        copiedPages.forEach(page => newPdf.addPage(page))
        let pdfBytes
        try {
          pdfBytes = await newPdf.save()
        } catch {
          throw new Error(`Split result could not be saved (damaged content in selected pages?)`)
        }
        self.postMessage({ type: 'SUCCESS', payload: pdfBytes }, [pdfBytes.buffer] as any)
      } else {
        // ZIP mode is better handled on main thread because of JSZip dependency 
        // and worker complexity, but we can return the individual PDF buffers
        const resultBuffers: { name: string, buffer: Uint8Array }[] = []
        const sortedPages = Array.from(selectedPages as number[]).sort((a, b) => a - b)
        
        for (let i = 0; i < sortedPages.length; i++) {
          const pageNum = sortedPages[i]
          const newPdf = await PDFDocument.create()
          let copiedPage
          try {
            [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1])
          } catch {
            throw new Error(`Page ${pageNum} could not be copied (password-protected or restricted?)`)
          }
          newPdf.addPage(copiedPage)
          let pdfBytes
          try {
            pdfBytes = await newPdf.save()
          } catch {
            throw new Error(`Page ${pageNum} result could not be saved (damaged content?)`)
          }
          resultBuffers.push({ 
            name: `${customFileName || 'page'}-${pageNum}.pdf`, 
            buffer: pdfBytes 
          })
          self.postMessage({ type: 'PROGRESS', payload: Math.round(((i + 1) / sortedPages.length) * 100) })
        }
        
        const transferables = resultBuffers.map(r => r.buffer.buffer)
        self.postMessage({ type: 'SUCCESS_BATCH', payload: resultBuffers }, transferables as any)
      }
    }

    else if (type === 'COMPRESS_PDF_ASSEMBLY') {
      // Receives pre-processed image bytes for each page to avoid Canvas in worker
      const { pages } = payload // pages: { imageBytes: Uint8Array, width: number, height: number }[]
      const newPdf = await PDFDocument.create()

      for (let i = 0; i < pages.length; i++) {
        const { imageBytes, width, height } = pages[i]
        const pdfImg = await newPdf.embedJpg(imageBytes)
        const pdfPage = newPdf.addPage([width, height])
        pdfPage.drawImage(pdfImg, { x: 0, y: 0, width, height })
        
        self.postMessage({ type: 'PROGRESS', payload: Math.round(((i + 1) / pages.length) * 100) })
      }

      const pdfBytes = await newPdf.save()
      self.postMessage({ type: 'SUCCESS', payload: pdfBytes }, [pdfBytes.buffer] as any)
    }

  } catch (error: any) {
    self.postMessage({ type: 'ERROR', payload: error.message || 'Worker Error' })
  }
}