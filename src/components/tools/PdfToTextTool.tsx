import { useState, useRef, useEffect } from 'react'
import { Loader2, Copy, FileText, Lock, Check, Download, Zap, ScanSearch, ArrowRight, X } from 'lucide-react'
import { toast } from 'sonner'
import Tesseract from 'tesseract.js'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, unlockPdf, downloadFile } from '../../utils/pdfHelpers'
import { usePipeline } from '../../utils/pipelineContext'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type PdfToTextData = { file: File, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string }
type ExtractionMode = 'text' | 'ocr'

export default function PdfToTextTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<PdfToTextData | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('text')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [customFileName, setCustomFileName] = useState('paperknife-extracted')
  const [copied, setCopied] = useState(false)
  const isNative = Capacitor.isNativePlatform()

  // F-Droid compliance check
  const isOcrDisabled = import.meta.env.VITE_DISABLE_OCR === 'true'

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) { setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, password: unlockPassword }) }
    else { toast.error('Incorrect password') }
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
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc }) 
        setCustomFileName(`${file.name.replace('.pdf', '')}-extracted`)
      }
      setExtractedText('')
    } catch (err) { console.error(err) } finally { setIsProcessing(false) }
  }

  const handleStartExtraction = async () => {
    if (!pdfData || !pdfData.pdfDoc) return
    setIsProcessing(true); setProgress(0); setExtractedText('')
    try {
      let result = ''
      if (extractionMode === 'text') {
        for (let i = 1; i <= pdfData.pageCount; i++) {
          const page = await pdfData.pdfDoc.getPage(i); const textContent = await page.getTextContent()
          result += `--- Page ${i} ---\n${textContent.items.map((item: any) => item.str).join(' ')}\n\n`
          setProgress(Math.round((i / pdfData.pageCount) * 100))
        }
      } else {
        let currentPageIndex = 1
        const worker = await Tesseract.createWorker('eng', 1, { 
          workerPath: '/tesseract/worker.min.js',
          corePath: '/tesseract/tesseract-core.wasm.js',
          langPath: '/tesseract/',
          gzip: false,
          cacheMethod: 'none',
          logger: (m: any) => { 
            if (m.status === 'recognizing text') { 
              const base = ((currentPageIndex - 1) / pdfData.pageCount) * 100; 
              setProgress(Math.round(base + (m.progress * (100 / pdfData.pageCount)))) 
            } 
          }
        })
        for (let i = 1; i <= pdfData.pageCount; i++) {
          currentPageIndex = i; const page = await pdfData.pdfDoc.getPage(i); const viewport = page.getViewport({ scale: 2.0 })
          const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')
          if (!ctx) continue; canvas.height = viewport.height; canvas.width = viewport.width
          await page.render({ canvasContext: ctx, viewport }).promise
          const { data: { text } } = await worker.recognize(canvas)
          result += `--- Page ${i} (OCR) ---\n${text}\n\n`; canvas.width = 0; canvas.height = 0
        }
        await worker.terminate()
      }
      setExtractedText(result); toast.success('Complete!')
    } catch (err: any) { toast.error(err.message) } finally { setIsProcessing(false) }
  }

  const handleDownload = async () => {
    await downloadFile(extractedText, `${customFileName}.txt`, 'text/plain')
  }

  const ActionButton = () => (
    <button onClick={handleStartExtraction} disabled={isProcessing} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <><Loader2 className="animate-spin" /> {progress}%</> : <>Extract Text <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="PDF to Text" description="Extract text using fast scan or deep local OCR." actions={pdfData && !pdfData.isLocked && !extractedText && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {!pdfData ? (
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><FileText size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400">Tap to browse files</p>
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
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500"><FileText size={24} /></div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3><p className="text-[10px] text-gray-400 uppercase font-black">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p></div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500"><X size={20} /></button>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
            {!extractedText ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setExtractionMode('text')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${extractionMode === 'text' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'}`}><Zap size={20} className={extractionMode === 'text' ? 'text-rose-500' : 'text-gray-400'} /><span className="font-black uppercase text-[10px] mt-1">Fast Scan</span></button>
                  <button 
                    onClick={() => !isOcrDisabled && setExtractionMode('ocr')} 
                    disabled={isOcrDisabled}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${extractionMode === 'ocr' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'} ${isOcrDisabled ? 'opacity-40 grayscale grayscale-mask' : ''}`}
                  >
                    <ScanSearch size={20} className={extractionMode === 'ocr' ? 'text-rose-500' : 'text-gray-400'} />
                    <span className="font-black uppercase text-[10px] mt-1">{isOcrDisabled ? 'No OCR' : 'Deep OCR'}</span>
                  </button>
                </div>
                {isProcessing && (
                  <div className="space-y-2"><div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden shadow-inner"><div className="bg-rose-500 h-full transition-all" style={{ width: `${progress}%` }} /></div><p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse px-1">Scanning Document...</p></div>
                )}
                {!isProcessing && (
                  <div className="space-y-4">
                    {isOcrDisabled && (
                      <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-white/5">
                         <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-center">
                            Deep OCR is disabled in this F-Droid build to comply with non-binary policies. Use 'Fast Scan' or get the full version from GitHub.
                         </p>
                      </div>
                    )}
                    {extractionMode === 'ocr' && !isOcrDisabled && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                         <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest text-center">
                            Note: Deep OCR is CPU-intensive and may take a few minutes depending on your device performance.
                         </p>
                      </div>
                    )}
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/20 text-center">
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest">Select mode and tap Extract</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Output Filename</label>
                      <input 
                        type="text" 
                        value={customFileName} 
                        onChange={(e) => setCustomFileName(e.target.value)} 
                        className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" 
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <textarea readOnly value={extractedText} className="w-full h-80 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl p-4 font-mono text-[10px] resize-none outline-none focus:border-rose-500 dark:text-gray-300 shadow-inner" />
                <div className="flex gap-3">
                  <button onClick={() => { navigator.clipboard.writeText(extractedText); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex-1 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 p-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95">{copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />} Copy</button>
                  <button onClick={handleDownload} className="flex-[2] bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"><Download size={18} /> {isNative ? 'Save .txt' : 'Download'}</button>
                </div>
                <button onClick={() => { setExtractedText(''); setProgress(0); setPdfData(null); }} className="w-full py-2 text-gray-400 uppercase font-black text-[10px] hover:text-rose-500 transition-colors">Close File</button>
              </div>
            )}
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
