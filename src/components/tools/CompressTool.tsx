import { useState, useRef, useEffect } from 'react'
import { Zap, Loader2, Plus, X, FileIcon, Download } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'
import JSZip from 'jszip'

import { getPdfMetaData, loadPdfDocument, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import ToolHeader from './shared/ToolHeader'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'

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
  const { consumePipelineFile, setPipelineFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [files, setFiles] = useState<CompressPdfFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [quality, setQuality] = useState<CompressionQuality>('medium')
  const [showSuccess, setShowSuccess] = useState(false)

  // Handle Pipeline File
  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      try {
        // Use a Blob first as it's more universally compatible for constructor usage
        const blob = new Blob([pipelined.buffer as any], { type: 'application/pdf' });
        const file = new File([blob], pipelined.name, { type: 'application/pdf' });
        handleFiles([file]);
        toast.info(`Received ${file.name} from pipeline`);
      } catch (e) {
        console.error("Pipeline file conversion failed", e);
        // Use a more robust fallback
        const blob = new Blob([pipelined.buffer as any], { type: 'application/pdf' });
        const file = new File([blob], pipelined.name, { type: 'application/pdf' });
        handleFiles([file]);
      }
    }
  }, [])

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf').map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      pageCount: 0,
      isLocked: false,
      status: 'pending' as const
    }))

    setFiles(prev => [...prev, ...newFiles])
    setShowSuccess(false)
    clearUrls()

    for (const f of newFiles) {
      try {
        const meta = await getPdfMetaData(f.file)
        setFiles(prev => prev.map(item => item.id === f.id ? {
          ...item,
          pageCount: meta.pageCount,
          isLocked: meta.isLocked,
          thumbnail: meta.thumbnail,
          pdfDoc: !meta.isLocked ? null : undefined // Will load doc during compression
        } : item))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleUnlock = async (id: string, password: string) => {
    const item = files.find(f => f.id === id)
    if (!item) return
    
    const result = await unlockPdf(item.file, password)
    if (result.success) {
      setFiles(prev => prev.map(f => f.id === id ? {
        ...f,
        isLocked: false,
        pageCount: result.pageCount,
        pdfDoc: result.pdfDoc,
        thumbnail: result.thumbnail,
        password: password
      } : f))
    } else {
      toast.error(`Incorrect password for ${item.file.name}`)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const compressSingleFile = async (item: CompressPdfFile, quality: CompressionQuality): Promise<{ url: string, size: number, buffer: Uint8Array }> => {
    let pdfDoc = item.pdfDoc
    if (!pdfDoc) {
      pdfDoc = await loadPdfDocument(item.file)
    }

    const newPdf = await PDFDocument.create()
    const scaleMap = { high: 1.0, medium: 1.5, low: 2.0 }
    const qualityMap = { high: 0.3, medium: 0.5, low: 0.7 }
    
    const scale = scaleMap[quality]
    const jpegQuality = qualityMap[quality]

    for (let i = 1; i <= item.pageCount; i++) {
      const page = await pdfDoc.getPage(i)
      const viewport = page.getViewport({ scale })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) continue
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      await page.render({ canvasContext: context, viewport }).promise
      
      const imgData = canvas.toDataURL('image/jpeg', jpegQuality)
      
      // Cleaner way to get buffer from dataURL without fetch
      const base64 = imgData.split(',')[1]
      const binaryString = window.atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let j = 0; j < binaryString.length; j++) {
        bytes[j] = binaryString.charCodeAt(j)
      }
      
      const pdfImg = await newPdf.embedJpg(bytes)
      const pdfPage = newPdf.addPage([viewport.width, viewport.height])
      pdfPage.drawImage(pdfImg, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      })
    }

    const pdfBytes = await newPdf.save()
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
    const url = createUrl(blob)
    return { url, size: blob.size, buffer: pdfBytes }
  }

  const startBatchCompression = async () => {
    const pendingFiles = files.filter(f => !f.isLocked && f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsProcessing(true)
    setGlobalProgress(0)

    const results: { name: string, buffer: Uint8Array }[] = []

    for (let i = 0; i < pendingFiles.length; i++) {
      const item = pendingFiles[i]
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f))
      
      try {
        const { url, size, buffer } = await compressSingleFile(item, quality)
        
        results.push({ name: item.file.name.replace('.pdf', '-compressed.pdf'), buffer })
        
        setFiles(prev => prev.map(f => f.id === item.id ? { 
          ...f, 
          status: 'completed', 
          resultUrl: url, 
          resultSize: size 
        } : f))

        addActivity({
          name: item.file.name.replace('.pdf', '-compressed.pdf'),
          tool: 'Compress',
          size: size,
          resultUrl: url
        })

        if (pendingFiles.length === 1) {
           setPipelineFile({ buffer, name: item.file.name.replace('.pdf', '-compressed.pdf') })
        }

      } catch (err) {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f))
        toast.error(`Failed to compress ${item.file.name}`)
      }
      
      setGlobalProgress(Math.round(((i + 1) / pendingFiles.length) * 100))
    }

    if (results.length > 1) {
      const zip = new JSZip()
      results.forEach(res => zip.file(res.name, res.buffer))
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      createUrl(zipBlob)
    }

    setIsProcessing(false)
    setShowSuccess(true)
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    if (files.length <= 1) setShowSuccess(false)
    clearUrls()
  }

  return (
    <div className="flex-1">
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <ToolHeader 
          title="Batch" 
          highlight="Shrinker" 
          description="Optimize multiple PDFs at once. Everything stays on your device." 
        />

        <input type="file" multiple accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

        {files.length === 0 ? (
          <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-10 md:p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
              <Zap size={32} />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Select PDFs</h3>
            <p className="text-xs md:text-sm text-gray-400 dark:text-zinc-500">Drop files or tap to start batch compression</p>
          </div>
        ) : !showSuccess ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map(f => (
                <div key={f.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4 relative group">
                  <div className="w-12 h-16 bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                    {f.thumbnail ? <img src={f.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileIcon className="text-gray-300" size={16} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate dark:text-white">{f.file.name}</p>
                    {f.isLocked ? (
                      <div className="flex gap-1 mt-1">
                        <input 
                          type="password" 
                          placeholder="Unlock..." 
                          className="bg-gray-50 dark:bg-black text-[8px] p-1 rounded border border-gray-100 dark:border-zinc-800 outline-none w-20"
                          onKeyDown={(e) => { if(e.key === 'Enter') handleUnlock(f.id, e.currentTarget.value) }}
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-bold">{(f.file.size / (1024*1024)).toFixed(2)} MB • {f.pageCount} p</p>
                    )}
                  </div>
                  <button onClick={() => removeFile(f.id)} className="p-1 text-gray-300 hover:text-rose-500"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-2xl p-4 text-gray-400 flex flex-col items-center justify-center gap-1 hover:border-rose-300 transition-all">
                <Plus size={20} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Add More</span>
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><Zap size={12} /> Compression Quality</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['high', 'medium', 'low'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setQuality(lvl)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${quality === lvl ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-800'}`}
                    >
                      <span className={`font-black uppercase text-[10px] ${quality === lvl ? 'text-rose-500' : 'text-gray-400'}`}>{lvl}</span>
                      <span className="text-[8px] text-gray-400 font-bold">{lvl === 'high' ? 'Max' : lvl === 'medium' ? 'Balanced' : 'Best'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-3">
                  <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${globalProgress}%` }} />
                  </div>
                  <p className="text-[10px] text-center font-black uppercase text-gray-400 tracking-widest animate-pulse">Batch Progress: {globalProgress}%</p>
                </div>
              )}

              <button 
                onClick={startBatchCompression}
                disabled={isProcessing || files.filter(f => !f.isLocked).length === 0}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Zap />}
                Compress {files.length} Files
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {objectUrl && files.length > 1 && (
              <a 
                href={objectUrl} 
                download="paperknife-compressed-batch.zip"
                className="block w-full bg-zinc-900 dark:bg-white text-white dark:text-black p-8 rounded-[2.5rem] text-center shadow-2xl transition-all hover:scale-[1.01] active:scale-95 group"
              >
                <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Download className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-1">Download All (ZIP)</h3>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{files.length} Optimized Documents</p>
              </a>
            )}

            {objectUrl && files.length === 1 && (
               <SuccessState 
                message="Success! File compressed."
                downloadUrl={objectUrl}
                fileName={files[0].file.name.replace('.pdf', '-compressed.pdf')}
                onStartOver={() => { setFiles([]); setShowSuccess(false); clearUrls(); }}
               />
            )}

            {objectUrl && files.length > 1 && (
               <button 
                onClick={() => { setFiles([]); setShowSuccess(false); clearUrls(); }}
                className="w-full py-4 text-gray-400 hover:text-rose-500 font-black uppercase tracking-[0.2em] text-xs transition-colors"
               >
                 Start New Batch
               </button>
            )}
          </div>
        )}

        <PrivacyBadge />
      </main>
    </div>
  )
}
