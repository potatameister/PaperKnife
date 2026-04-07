import React, { useState, useRef, useEffect } from 'react'
import { Hash, Loader2, Eye, FileUp } from 'lucide-react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { toast } from 'sonner'

import { getPdfMetaData, loadPdfDocument } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { SecurePDFGate } from '../shared/SecurePDFGate'

type PageNumberPdfData = { 
  file: File, 
  decryptedBuffer: Uint8Array,
  pageCount: number, 
  pdfDoc?: any, 
  thumbnail?: string,
}
type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export default function PageNumberTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [pdfData, setPdfData] = useState<PageNumberPdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-numbered')
  const [format, setFormat] = useState('Page {n} of {total}')
  const [position, setPosition] = useState<Position>('bottom-center')
  const [startFrom] = useState(1)
  const [fontSize] = useState(12)
  const [color] = useState('#6B7280')

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      setSourceFile(file)
    }
  }, [])

  const handleUnlocked = async (decryptedBuffer: Uint8Array, file: File) => {
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      const pdfDoc = await loadPdfDocument(decryptedBuffer)
      setPdfData({ file, decryptedBuffer, pageCount: meta.pageCount, pdfDoc, thumbnail: meta.thumbnail })
      setCustomFileName(`${file.name.replace('.pdf', '')}-numbered`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load document structure')
    } finally {
      setIsProcessing(false)
      setDownloadUrl(null)
    }
  }

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255; const g = parseInt(hex.slice(3, 5), 16) / 255; const b = parseInt(hex.slice(5, 7), 16) / 255
    return rgb(r, g, b)
  }

  const applyPageNumbers = async () => {
    if (!pdfData) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const pdfDoc = await PDFDocument.load(pdfData.decryptedBuffer)
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica); const pages = pdfDoc.getPages(); const textColor = hexToRgb(color)
      pages.forEach((page, idx) => {
        const { width, height } = page.getSize(); const n = idx + startFrom; const total = pages.length + (startFrom - 1)
        const label = format.replace('{n}', n.toString()).replace('{total}', total.toString())
        const textWidth = font.widthOfTextAtSize(label, fontSize); const margin = 30
        let x = width / 2 - textWidth / 2; let y = margin
        if (position.includes('left')) x = margin; if (position.includes('right')) x = width - textWidth - margin
        if (position.includes('top')) y = height - margin - fontSize
        page.drawText(label, { x, y, size: fontSize, font, color: textColor })
      })
      const pdfBytes = await pdfDoc.save(); const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob); setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Page Numbers', size: blob.size, resultUrl: url, buffer: pdfBytes })
    } catch (error: any) { toast.error(`Error: ${error.message}`) } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={applyPageNumbers} disabled={isProcessing} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <Hash size={20} />} Add Page Numbers
    </button>
  )

  const getPreviewStyles = () => {
    const styles: React.CSSProperties = { position: 'absolute', padding: '10px', color: color, fontSize: '8px', fontWeight: 'bold' }
    if (position.includes('top')) styles.top = 0; else styles.bottom = 0
    if (position.includes('left')) styles.left = 0; 
    else if (position.includes('right')) styles.right = 0;
    else { styles.left = '50%'; styles.transform = 'translateX(-50%)' }
    return styles
  }
return (
  <NativeToolLayout title="Page Numbers" description="Add custom numbering to your PDF automatically." actions={pdfData && !downloadUrl && <ActionButton />}>
    <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && setSourceFile(e.target.files[0])} />

    {!pdfData ? (
      <SecurePDFGate 
        file={sourceFile} 
        onUnlocked={handleUnlocked} 
        onCancel={() => setSourceFile(null)}
      >
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><FileUp size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400">Tap to start numbering</p>
        </div>
      </SecurePDFGate>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
...
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col items-center">
               <div className="flex justify-between items-center w-full mb-4 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Eye size={12}/> Live Preview</h4>
               </div>
               <div className="relative aspect-[3/4] w-full max-w-[300px] bg-white border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                  {pdfData.thumbnail ? (
                    <img src={pdfData.thumbnail} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-100"><Hash size={64} /></div>
                  )}
                  <div style={getPreviewStyles()}>
                    {format.replace('{n}', '1').replace('{total}', pdfData.pageCount.toString())}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
              {!downloadUrl ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Label Format</label>
                    <input type="text" value={format} onChange={(e) => setFormat(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" placeholder="Page {n} of {total}" />
                    <p className="text-[8px] text-gray-400 mt-2">Use <b>{'{n}'}</b> for page number and <b>{'{total}'}</b> for total pages.</p>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Position</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position[]).map(pos => (
                        <button key={pos} onClick={() => setPosition(pos)} className={`py-3 px-1 rounded-xl text-[8px] font-black uppercase transition-all border ${position === pos ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-gray-50 dark:bg-black text-gray-400 border-gray-100 dark:border-zinc-800'}`}>
                          {pos.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Output Filename</label>
                    <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                  </div>
                </>
              ) : (
                <SuccessState message="Numbers Applied Successfully!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => setDownloadUrl(null)} />
              )}
              <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
            </div>
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
