import { useState, useRef, useEffect } from 'react'
import { Zap, Loader2, Plus, X, FileIcon, Download, ChevronLeft, ChevronRight, Maximize2, ArrowRight, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf, downloadFile } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

// Compare Slider Component (Optimized)
const QualityCompare = ({ originalBuffer, compressedBuffer }: { originalBuffer: Uint8Array, compressedBuffer: Uint8Array }) => {
  const [originalThumb, setOriginalThumb] = useState<string>('')
  const [compressedThumb, setCompressedThumb] = useState<string>('')
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadThumbs = async () => {
      try {
        const origPdf = await loadPdfDocument(new File([originalBuffer as any], 'orig.pdf', { type: 'application/pdf' }))
        const compPdf = await loadPdfDocument(new File([compressedBuffer as any], 'comp.pdf', { type: 'application/pdf' }))
        const t1 = await renderPageThumbnail(origPdf, 1, 2.0)
        const t2 = await renderPageThumbnail(compPdf, 1, 2.0)
        setOriginalThumb(t1); setCompressedThumb(t2)
      } catch (e) { console.error(e) }
    }
    loadThumbs()
  }, [originalBuffer, compressedBuffer])

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const position = ((x - rect.left) / rect.width) * 100
    setSliderPos(Math.max(0, Math.min(100, position)))
  }

  if (!originalThumb || !compressedThumb) return (
    <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-[2rem] animate-pulse">
       <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-[10px] font-black uppercase text-gray-400">Comparing Quality...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h4 className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Maximize2 size={12} /> Quality Inspection</h4>
      </div>
      <div ref={containerRef} className="relative h-80 md:h-[400px] rounded-[2rem] overflow-hidden cursor-ew-resize select-none border border-gray-100 dark:border-white/5" onMouseMove={handleMove} onTouchMove={handleMove}>
        <img src={compressedThumb} className="absolute inset-0 w-full h-full object-contain bg-white" alt="Compressed" />
        <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={originalThumb} className="absolute inset-0 w-full h-full object-contain bg-white" alt="Original" />
        </div>
        <div className="absolute top-0 bottom-0 w-1 bg-white shadow-xl z-10" style={{ left: `${sliderPos}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-zinc-900 rounded-full shadow-2xl border border-gray-100 dark:border-white/5 flex items-center justify-center text-rose-500">
             <ChevronLeft size={14} /><ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}

type CompressPdfFile = {
  id: string
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  pdfDoc?: any
  password?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  resultUrl?: string
  resultSize?: number
}

type CompressionQuality = 'low' | 'medium' | 'high'

export default function CompressTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile, setPipelineFile, lastPipelinedFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [files, setFiles] = useState<CompressPdfFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [quality, setQuality] = useState<CompressionQuality>('medium')
  const [showSuccess, setShowSuccess] = useState(false)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      if (pipelined.type && pipelined.type !== 'application/pdf') {
        toast.error('The file from the previous tool is not a PDF and cannot be used here.')
        return
      }
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFiles([file])
    }
  }, [])

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf').map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file, pageCount: 0, isLocked: false, status: 'pending' as const
    }))
    setFiles(prev => [...prev, ...newFiles]); setShowSuccess(false); clearUrls()
    for (const f of newFiles) {
      getPdfMetaData(f.file).then(meta => {
        setFiles(prev => prev.map(item => item.id === f.id ? { ...item, pageCount: meta.pageCount, isLocked: meta.isLocked, thumbnail: meta.thumbnail } : item))
      })
    }
  }

  const handleUnlock = async (id: string, password: string) => {
    const item = files.find(f => f.id === id)
    if (!item) return
    const result = await unlockPdf(item.file, password)
    if (result.success) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, thumbnail: result.thumbnail, password } : f))
    } else { toast.error('Incorrect password') }
  }

  const compressSingleFile = async (item: CompressPdfFile, quality: CompressionQuality): Promise<{ url: string, size: number, buffer: Uint8Array }> => {
    let pdfDoc = item.pdfDoc || await loadPdfDocument(item.file)
    const scaleMap = { high: 1.0, medium: 1.5, low: 2.0 }; const qualityMap = { high: 0.3, medium: 0.5, low: 0.7 }
    const scale = scaleMap[quality]; const jpegQuality = qualityMap[quality]
    const pagesData: { imageBytes: Uint8Array, width: number, height: number }[] = []
    for (let i = 1; i <= item.pageCount; i++) {
      const page = await pdfDoc.getPage(i); const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas'); const context = canvas.getContext('2d')
      if (!context) continue
      canvas.height = viewport.height; canvas.width = viewport.width
      await page.render({ canvasContext: context, viewport }).promise
      const imgData = canvas.toDataURL('image/jpeg', jpegQuality)
      const base64 = imgData.split(',')[1]; const binaryString = window.atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j)
      pagesData.push({ imageBytes: bytes, width: viewport.width, height: viewport.height })
      canvas.width = 0; canvas.height = 0
    }
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(new URL('../../utils/pdfWorker.ts', import.meta.url), { type: 'module' })
        worker.postMessage({ type: 'COMPRESS_PDF_ASSEMBLY', payload: { pages: pagesData, quality } }, pagesData.map(p => p.imageBytes.buffer) as any)
        
        worker.onmessage = (e) => {
          if (e.data.type === 'SUCCESS') {
            const blob = new Blob([e.data.payload], { type: 'application/pdf' })
            resolve({ url: createUrl(blob), size: blob.size, buffer: e.data.payload }); worker.terminate()
          } else if (e.data.type === 'ERROR') {
            reject(new Error(e.data.payload)); worker.terminate()
          }
        }

        worker.onerror = (err) => {
          reject(new Error('Worker failed to start or execution error.')); worker.terminate()
        }
      } catch (e: any) {
        reject(new Error(`Failed to start worker: ${e.message}`))
      }
    })
  }

  const startBatchCompression = async () => {
    const pendingFiles = files.filter(f => !f.isLocked && f.status === 'pending')
    if (pendingFiles.length === 0) return
    setIsProcessing(true); setGlobalProgress(0)
    const results = []
    for (let i = 0; i < pendingFiles.length; i++) {
      const item = pendingFiles[i]
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f))
      try {
        const { url, size, buffer } = await compressSingleFile(item, quality)
        results.push({ name: item.file.name.replace('.pdf', '-compressed.pdf'), buffer })
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'completed', resultUrl: url, resultSize: size } : f))
        addActivity({ name: item.file.name.replace('.pdf', '-compressed.pdf'), tool: 'Compress', size, resultUrl: url })
        if (pendingFiles.length === 1) {
           const originalBuffer = await pendingFiles[0].file.arrayBuffer()
           setPipelineFile({ 
             buffer, 
             name: item.file.name.replace('.pdf', '-compressed.pdf'), 
             type: 'application/pdf',
             originalBuffer: new Uint8Array(originalBuffer) 
           })
        }
      } catch { setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f)) }
      setGlobalProgress(Math.round(((i + 1) / pendingFiles.length) * 100))
    }
    if (results.length > 1) {
      const zip = new JSZip(); results.forEach(res => zip.file(res.name, res.buffer))
      const zipBlob = await zip.generateAsync({ type: 'blob' }); createUrl(zipBlob)
    }
    setIsProcessing(false); setShowSuccess(true)
  }

  const handleDownloadBatch = async () => {
    if (objectUrl && files.length > 1) {
        const zip = new JSZip()
        for (const f of files) {
            if (f.resultUrl) {
                const res = await fetch(f.resultUrl)
                zip.file(f.file.name.replace('.pdf', '-compressed.pdf'), await res.arrayBuffer())
            }
        }
        const blob = await zip.generateAsync({ type: 'blob' })
        await downloadFile(new Uint8Array(await blob.arrayBuffer()), 'paperknife-compressed.zip', 'application/zip')
    }
  }

  const ActionButton = () => (
    <button 
      onClick={startBatchCompression}
      disabled={isProcessing || files.filter(f => !f.isLocked).length === 0}
      className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl`}
    >
      {isProcessing ? <><Loader2 className="animate-spin" /> {globalProgress}%</> : <>Compress {files.length > 1 ? `${files.length} Files` : 'PDF'} <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="Compress PDF" description="Reduce file size while maintaining quality. Everything stays on your device." actions={files.length > 0 && !showSuccess && <ActionButton />}>
      <input type="file" multiple accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      
      {files.length === 0 ? (
        <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner"><Zap size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDFs</h3>
          <p className="text-sm text-gray-400 font-medium">Tap to start batch compression</p>
        </div>
      ) : !showSuccess ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map(f => (
              <div key={f.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 flex items-center gap-4 relative group shadow-sm">
                <div className="w-12 h-16 bg-gray-50 dark:bg-black rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800">
                  {f.thumbnail ? <img src={f.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileIcon className="text-gray-300" size={16} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate dark:text-white">{f.file.name}</p>
                  {f.isLocked ? (
                    <div className="flex gap-1 mt-1">
                       <input type="password" placeholder="Locked..." className="flex-1 bg-gray-50 dark:bg-black text-[10px] p-1.5 rounded-lg outline-none w-full border border-gray-100 dark:border-zinc-800 focus:border-rose-500" onKeyDown={(e) => { if(e.key === 'Enter') handleUnlock(f.id, e.currentTarget.value) }} />
                    </div>
                  ) : <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{(f.file.size / (1024*1024)).toFixed(2)} MB • {f.pageCount} Pages</p>}
                </div>
                <button onClick={() => setFiles(prev => prev.filter(item => item.id !== f.id))} className="p-2 text-gray-300 hover:text-rose-500 transition-colors"><X size={16} /></button>
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-[1.5rem] p-4 text-gray-400 flex flex-col items-center justify-center gap-1 hover:border-rose-500 hover:text-rose-500 transition-all">
              <Plus size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Add More</span>
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest px-1">Compression Strategy</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'high', label: 'Pro', desc: 'Sharpest' },
                { id: 'medium', label: 'Balanced', desc: 'Standard' },
                { id: 'low', label: 'Extreme', desc: 'Smallest' }
              ].map((lvl) => (
                <button key={lvl.id} onClick={() => setQuality(lvl.id as CompressionQuality)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${quality === lvl.id ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'}`}>
                  <span className={`font-black uppercase text-[10px] ${quality === lvl.id ? 'text-rose-500' : 'text-gray-400'}`}>{lvl.label}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">{lvl.desc}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-6 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-white/5">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                   <Zap size={16} />
                 </div>
                 <h5 className="text-xs font-black uppercase tracking-widest dark:text-white">Strategy Details</h5>
               </div>
               <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                 {quality === 'high' && (
                   <>
                     <strong>Pro Mode:</strong> Retains maximum text clarity and image resolution (1.0x scale). 
                     Best for official documents, portfolios, and high-fidelity reports. 
                     Expected reduction: <span className="text-rose-500 font-bold">10-30%</span>.
                   </>
                 )}
                 {quality === 'medium' && (
                   <>
                     <strong>Balanced:</strong> Downsamples images to 150DPI (1.5x scale) with optimized JPEG compression. 
                     The perfect middle ground for everyday sharing and email attachments. 
                     Expected reduction: <span className="text-rose-500 font-bold">40-60%</span>.
                   </>
                 )}
                 {quality === 'low' && (
                   <>
                     <strong>Extreme:</strong> Aggressive downsampling (2.0x scale) and high compression. 
                     Ideal for quick mobile viewing or meeting strict 2MB upload limits. 
                     Expected reduction: <span className="text-rose-500 font-bold">70-90%</span>.
                   </>
                 )}
               </p>
            </div>

            {isProcessing && (
              <div className="mt-8 space-y-3">
                <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden shadow-inner">
                   <div className="bg-rose-500 h-full transition-all" style={{ width: `${globalProgress}%` }} />
                </div>
                <p className="text-[10px] text-center font-black uppercase text-gray-400 tracking-widest animate-pulse">Rasterizing Document...</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in zoom-in duration-300">
          {objectUrl && files.length > 1 && (
            <button onClick={handleDownloadBatch} className="block w-full bg-zinc-900 dark:bg-white text-white dark:text-black p-10 rounded-[2.5rem] text-center shadow-2xl transition-all group active:scale-[0.98]">
              <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg"><Download className="text-white" size={32} /></div>
              <h3 className="text-2xl font-black tracking-tight mb-1">{isNative ? 'Save ZIP Archive' : 'Download ZIP Archive'}</h3>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{files.length} Optimized PDFs</p>
            </button>
          )}
          {objectUrl && files.length === 1 && (
            <div className="space-y-8">
              {lastPipelinedFile?.originalBuffer && lastPipelinedFile?.buffer && <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm"><QualityCompare originalBuffer={lastPipelinedFile.originalBuffer} compressedBuffer={lastPipelinedFile.buffer} /></div>}
              <SuccessState message={`Reduced by ${((1 - (files[0].resultSize || 0) / files[0].file.size) * 100).toFixed(0)}%`} downloadUrl={objectUrl} fileName={files[0].file.name.replace('.pdf', '-compressed.pdf')} onStartOver={() => { setFiles([]); setShowSuccess(false); clearUrls(); }} />
            </div>
          )}
          <button onClick={() => { setFiles([]); setShowSuccess(false); clearUrls(); }} className="w-full py-4 text-gray-400 hover:text-rose-500 font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-2">
            <RefreshCcw size={14}/> Start New Session
          </button>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
