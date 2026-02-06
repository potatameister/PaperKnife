import { PDFDocument, degrees } from 'pdf-lib'

// We use self.onmessage because this is a Web Worker
self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data

  try {
    if (type === 'MERGE_PDFS') {
      const { files } = payload
      const mergedPdf = await PDFDocument.create()

      for (let i = 0; i < files.length; i++) {
        const { buffer, rotation, password } = files[i]
        
        const pdf = await PDFDocument.load(buffer, { 
          password: password || undefined,
          ignoreEncryption: true 
        } as any)
        
        const pageIndices = pdf.getPageIndices()
        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices)
        
        copiedPages.forEach((page) => {
          const currentRotation = page.getRotation().angle
          page.setRotation(degrees((currentRotation + rotation) % 360))
          mergedPdf.addPage(page)
        })

        self.postMessage({ type: 'PROGRESS', payload: Math.round(((i + 1) / files.length) * 100) })
      }

      const mergedPdfBytes = await mergedPdf.save()
      self.postMessage({ type: 'SUCCESS', payload: mergedPdfBytes }, [mergedPdfBytes.buffer] as any)
    } 
    
    else if (type === 'SPLIT_PDF') {
      const { buffer, password, selectedPages, mode, customFileName } = payload
      const originalPdf = await PDFDocument.load(buffer, { 
        password: password || undefined,
        ignoreEncryption: true
      } as any)

      if (mode === 'single') {
        const newPdf = await PDFDocument.create()
        const sortedIndices = Array.from(selectedPages as number[]).sort((a, b) => a - b).map(p => p - 1)
        const copiedPages = await newPdf.copyPages(originalPdf, sortedIndices)
        copiedPages.forEach(page => newPdf.addPage(page))

        const pdfBytes = await newPdf.save()
        self.postMessage({ type: 'SUCCESS', payload: pdfBytes }, [pdfBytes.buffer] as any)
      } else {
        // ZIP mode is better handled on main thread because of JSZip dependency 
        // and worker complexity, but we can return the individual PDF buffers
        const resultBuffers: { name: string, buffer: Uint8Array }[] = []
        const sortedPages = Array.from(selectedPages as number[]).sort((a, b) => a - b)
        
        for (let i = 0; i < sortedPages.length; i++) {
          const pageNum = sortedPages[i]
          const newPdf = await PDFDocument.create()
          const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1])
          newPdf.addPage(copiedPage)
          const pdfBytes = await newPdf.save()
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