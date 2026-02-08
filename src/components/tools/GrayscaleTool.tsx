import { useState, useRef } from 'react'
import { Palette, Lock, Loader2, ArrowRight, X } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type PdfData = { file: File, thumbnail?: string, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string }

export default function GrayscaleTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfData, setPdfData] = useState<PdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-grayscale')
  const [unlockPassword, setUnlockPassword] = useState('')
  const isNative = Capacitor.isNativePlatform()

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, thumbnail: result.thumbnail, password: unlockPassword })
      setCustomFileName(`${pdfData.file.name.replace('.pdf', '')}-grayscale`)
    } else { toast.error('Incorrect password') }
    setIsProcessing(false)
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) { setPdfData({ file, pageCount: 0, isLocked: true }) }
      else {
        const pdfDoc = await loadPdfDocument(file)
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc, thumbnail: meta.thumbnail })
        setCustomFileName(`${file.name.replace('.pdf', '')}-grayscale`)
      }
    } catch (err) { console.error(err) } finally { setIsProcessing(false); setDownloadUrl(null) }
  }

  const convertToGrayscale = async () => {
    if (!pdfData || !pdfData.pdfDoc) return
    setIsProcessing(true); setProgress(0); await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      const outPdf = await PDFDocument.create()
      const scale = 1.5 // Good balance for reading/size
      
      for (let i = 1; i <= pdfData.pageCount; i++) {
        const page = await pdfData.pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale })
        
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) continue
        
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        // Render page
        await page.render({ canvasContext: ctx, viewport }).promise
        
        // Apply Grayscale Filter
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let j = 0; j < data.length; j += 4) {
          const avg = (data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114)
          data[j] = avg     // R
          data[j + 1] = avg // G
          data[j + 2] = avg // B
        }
        ctx.putImageData(imageData, 0, 0)
        
        // Convert to JPG (smaller than PNG for documents)
        const imgData = canvas.toDataURL('image/jpeg', 0.75)
        const img = await outPdf.embedJpg(imgData)
        
        const newPage = outPdf.addPage([viewport.width, viewport.height])
        newPage.drawImage(img, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        })
        
        setProgress(Math.round((i / pdfData.pageCount) * 100))
      }
      
      const pdfBytes = await outPdf.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Grayscale', size: blob.size, resultUrl: url })
    } catch (error: any) { 
      toast.error(`Error: ${error.message}`) 
    } finally { 
      setIsProcessing(false) 
    }
  }

  const ActionButton = () => (
    <button onClick={convertToGrayscale} disabled={isProcessing} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <><Loader2 className="animate-spin" /> {progress}%</> : <><Palette size={18} /> Convert to Grayscale <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="PDF to Grayscale" description="Remove colors from your PDF to save ink and storage." actions={pdfData && !pdfData.isLocked && !downloadUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {!pdfData ? (
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Palette size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400">Tap to start desaturating</p>
        </div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Protected File</h3>
            <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4" />
            <button onClick={handleUnlock} disabled={!unlockPassword || isProcessing} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase text-xs">Unlock</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500">{pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <Palette size={20} />}</div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3><p className="text-[10px] text-gray-400 uppercase font-black">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p></div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-8">
            {!downloadUrl ? (
              <>
                <div className="text-center py-4">
                   <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
                     This tool converts all document pages to black-and-white. 
                     <br/>Best for printing and reducing file size.
                   </p>
                </div>
                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Output Filename</label><input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm" /></div>
                {!isNative && <ActionButton />}
              </>
            ) : (
              <SuccessState message="Grayscale Conversion Complete!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setDownloadUrl(null); setProgress(0); }} />
            )}
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
