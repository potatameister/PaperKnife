import { PDFDocument, degrees } from 'pdf-lib'

// We use self.onmessage because this is a Web Worker
self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'MERGE_PDFS') {
    try {
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

        // Send progress back to main thread
        self.postMessage({ type: 'PROGRESS', payload: Math.round(((i + 1) / files.length) * 100) })
      }

      const mergedPdfBytes = await mergedPdf.save()
      
      // Transfer the ArrayBuffer back to main thread for performance
      self.postMessage({ type: 'SUCCESS', payload: mergedPdfBytes }, [mergedPdfBytes.buffer] as any)
    } catch (error: any) {
      self.postMessage({ type: 'ERROR', payload: error.message || 'Worker Merge Error' })
    }
  }
}
