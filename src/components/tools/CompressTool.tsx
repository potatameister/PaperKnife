import React, { useState, useRef, useEffect } from 'react'
import { Zap, Loader2, Plus, X, FileIcon, Download, ChevronLeft, ChevronRight, Maximize2, ArrowRight } from 'lucide-react'
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
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  pdfDoc?: any
  password?: string
  unlockedBuffer?: Uint8Array
  resultSize?: number
}

type CompressionQuality = 'low' | 'medium' | 'high'

export default function CompressTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile, setPipelineFile, lastPipelinedFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [pdfData, setPdfData] = useState<CompressPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [quality, setQuality] = useState<CompressionQuality>('medium')
  const [unlockPassword, setUnlockPassword] = useState('')
  const isNative = Capacitor.isNativePlatform()

  const [isLoadingFile, setIsLoadingFile] = useState(false)

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsLoadingFile(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 50))
      const meta = await getPdfMetaData(file)
      setPdfData({ file, thumbnail: meta.thumbnail, pageCount: meta.pageCount, isLocked: meta.isLocked })
      clearUrls()
    } catch (e) {
      console.error('Error reading PDF:', e)
      toast.error('Failed to read PDF file.')
    } finally {
      setIsLoadingFile(false)
    }
  }

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsLoadingFile(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({ 
        ...pdfData, 
        isLocked: false, 
        pageCount: result.pageCount, 
        pdfDoc: result.pdfDoc, 
        thumbnail: result.thumbnail, 
        password: unlockPassword,
        unlockedBuffer: result.pdfData
      })
    } else { 
      toast.error('Incorrect password') 
    }
    setIsLoadingFile(false)
  }

  const compressPDF = async () => {
    if (!pdfData || isProcessing) return
    setIsProcessing(true)
    setProgress(0)
    
    try {
      const originalBuffer = pdfData.unlockedBuffer || new Uint8Array(await pdfData.file.arrayBuffer())
      const originalSize = originalBuffer.byteLength
      
      // Step 1: Smart Compression (Vector-preserving)
      const worker = new Worker(new URL('../../utils/pdfWorker.ts', import.meta.url), { type: 'module' })
      worker.postMessage({ 
        type: 'COMPRESS_PDF_SAFE', 
        payload: { 
          buffer: originalBuffer, 
          password: pdfData.password,
          quality 
        } 
      })
      
      const compressedResult = await new Promise<{ buffer: Uint8Array, size: number, method: string }>((resolve, reject) => {
        worker.onmessage = async (e) => {
          if (e.data.type === 'PROGRESS') {
            setProgress(10 + Math.round(e.data.payload * 0.4))
          } else if (e.data.type === 'SUCCESS') {
            const buffer = e.data.payload
            worker.terminate()
            
            if (buffer.byteLength < originalSize) {
              resolve({ buffer, size: buffer.byteLength, method: 'smart' })
            } else {
              // Fallback to rasterization if smart didn't help enough
              resolve(performRasterization(pdfData, quality, originalBuffer, originalSize))
            }
          } else if (e.data.type === 'ERROR') {
            worker.terminate()
            resolve(performRasterization(pdfData, quality, originalBuffer, originalSize))
          }
        }
      })

      const blob = new Blob([compressedResult.buffer], { type: 'application/pdf' })
      const url = createUrl(blob)
      const fileName = pdfData.file.name.replace('.pdf', '-compressed.pdf')
      
      setPdfData({ ...pdfData, resultSize: compressedResult.size })
      
      setPipelineFile({ 
        buffer: compressedResult.buffer, 
        name: fileName, 
        type: 'application/pdf',
        originalBuffer: originalBuffer 
      })
      
      addActivity({ name: fileName, tool: 'Compress', size: compressedResult.size, resultUrl: url, buffer: compressedResult.buffer })
      
      if (compressedResult.method === 'original') {
        toast.info('This PDF is already optimized.')
      } else {
        toast.success('PDF compressed successfully!')
      }
    } catch (error: any) {
      toast.error('Compression failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  const performRasterization = async (item: CompressPdfFile, q: CompressionQuality, originalBuffer: Uint8Array, originalSize: number): Promise<{ buffer: Uint8Array, size: number, method: string }> => {
    let pdfDoc = item.pdfDoc || await loadPdfDocument(item.file)
    const scaleMap = { high: 2.0, medium: 1.5, low: 1.0 }
    const qualityMap = { high: 0.85, medium: 0.6, low: 0.35 }
    const scale = scaleMap[q]
    const jpegQuality = qualityMap[q]
    
    const pagesData = []
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
      const base64 = imgData.split(',')[1]
      const binaryString = window.atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j)
      pagesData.push({ imageBytes: bytes, width: viewport.width, height: viewport.height })
      
      setProgress(50 + Math.round((i / item.pageCount) * 40))
      canvas.width = 0; canvas.height = 0
    }

    return new Promise((resolve) => {
      const worker = new Worker(new URL('../../utils/pdfWorker.ts', import.meta.url), { type: 'module' })
      worker.postMessage({ type: 'COMPRESS_PDF_ASSEMBLY', payload: { pages: pagesData, quality: q } })
      
      worker.onmessage = (e) => {
        if (e.data.type === 'SUCCESS') {
          worker.terminate()
          const buffer = e.data.payload
          if (buffer.byteLength >= originalSize) {
            resolve({ buffer: originalBuffer, size: originalSize, method: 'original' })
          } else {
            resolve({ buffer, size: buffer.byteLength, method: 'rasterize' })
          }
        }
      }
    })
  }

  const ActionButton = () => (
    <button 
      onClick={compressPDF}
      disabled={isProcessing || !pdfData || pdfData.isLocked}
      className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl`}
    >
      {isProcessing ? <><Loader2 className="animate-spin" /> {progress}%</> : <>Compress PDF <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="Compress PDF" description="Reduce file size while maintaining quality. Everything stays on your device." actions={pdfData && !pdfData.isLocked && !objectUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {isLoadingFile ? (
        <div className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
          <h3 className="text-xl font-bold dark:text-white mb-2">Reading PDF...</h3>
          <p className="text-sm text-gray-400">This might take a moment</p>
        </div>
      ) : !pdfData ? (
        <button 
          onClick={() => !isProcessing && fileInputRef.current?.click()} 
          className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner"><Zap size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400 font-medium">Tap to start compression</p>
        </button>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileIcon size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Protected File</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">This document is encrypted. Enter the password to compress it.</p>
            <input 
              type="password" 
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              placeholder="Current Password"
              className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4 dark:text-white"
              autoFocus
            />
            <button 
              onClick={handleUnlock}
              disabled={!unlockPassword || isLoadingFile}
              className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              {isLoadingFile ? '...' : 'Unlock & Proceed'}
            </button>
          </div>
        </div>
      ) : !objectUrl ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">
              {pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <FileIcon size={24} />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                {(pdfData.file.size / (1024*1024)).toFixed(2)} MB • {pdfData.pageCount} Pages
              </p>
            </div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest px-1">Compression Strategy</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'high', label: 'High Quality', desc: '100% Clarity' },
                { id: 'medium', label: 'Standard', desc: 'Recommended' },
                { id: 'low', label: 'Smallest', desc: 'Max Save' }
              ].map((lvl) => (
                <button 
                  key={lvl.id} 
                  onClick={() => setQuality(lvl.id as CompressionQuality)} 
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${quality === lvl.id ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10 shadow-sm' : 'border-gray-50 dark:border-white/5'}`}
                >
                  <span className={`font-black uppercase text-[9px] text-center leading-tight ${quality === lvl.id ? 'text-rose-500' : 'text-gray-400'}`}>{lvl.label}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">{lvl.desc}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-6 bg-gray-50 dark:bg-black rounded-2xl border border-gray-50 dark:border-white/5 text-left">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center"><Zap size={16} /></div>
                 <h5 className="text-xs font-black uppercase tracking-widest dark:text-white">Strategy Details</h5>
               </div>
               <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
                 {quality === 'high' ? 'High Quality: Retains maximum text clarity. Best for official documents. (10-30% saving)' : 
                  quality === 'medium' ? 'Standard: Balanced optimization for everyday sharing. Perfect middle ground. (40-60% saving)' : 
                  'Smallest Size: Aggressive compression for max space saving. (70-90% saving)'}
               </p>
            </div>

            {isProcessing && (
              <div className="mt-8 space-y-3">
                <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden shadow-inner">
                   <div className="bg-rose-500 h-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[10px] text-center font-black uppercase text-gray-400 tracking-widest animate-pulse">Processing on Device...</p>
              </div>
            )}
            
            {!isProcessing && isNative && <div className="mt-8"><ActionButton /></div>}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in zoom-in duration-300">
          <div className="space-y-8">
            {lastPipelinedFile?.originalBuffer && lastPipelinedFile?.buffer && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
                <QualityCompare originalBuffer={lastPipelinedFile.originalBuffer} compressedBuffer={lastPipelinedFile.buffer} />
              </div>
            )}
            <SuccessState 
              message={`Reduced by ${Math.max(0, ((1 - (pdfData.resultSize || 0) / pdfData.file.size) * 100)).toFixed(0)}%`}
              downloadUrl={objectUrl} 
              fileName={pdfData.file.name.replace('.pdf', '-compressed.pdf')} 
              onStartOver={() => { setPdfData(null); clearUrls(); setIsProcessing(false); setUnlockPassword(''); }} 
            />
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
