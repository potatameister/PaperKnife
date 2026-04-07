import React, { useState, useRef, useEffect } from 'react'
import { Loader2, Scissors, Check, Plus, ArrowRight, X, Zap, FileUp } from 'lucide-react'
import JSZip from 'jszip'
import { toast } from 'sonner'

import { getPdfMetaData, loadPdfDocument, renderGridThumbnail } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { SecurePDFGate } from '../shared/SecurePDFGate'

type SplitPdfFile = {
  file: File
  decryptedBuffer: Uint8Array
  pageCount: number
  pdfDoc?: any
  thumbnail?: string
}

const LazyThumbnail = ({ pdfDoc, pageNum }: { pdfDoc: any, pageNum: number }) => {
  const [src, setSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSrc(null)
  }, [pdfDoc])

  useEffect(() => {
    if (!pdfDoc || src !== null) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        renderGridThumbnail(pdfDoc, pageNum).then(res => setSrc(res || 'error')).catch(() => setSrc('error'))
        observer.disconnect()
      }
    }, { rootMargin: '400px' }) 
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [pdfDoc, pageNum, src])

  if (src && src !== 'error') return <img src={src} className="w-full h-full object-cover animate-in fade-in duration-300" alt={`Page ${pageNum}`} />
  if (src === 'error') return <div className="w-full h-full bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center text-[8px] font-bold text-rose-500 uppercase">Error</div>
  return (
    <div ref={imgRef} className="w-full h-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-xs font-bold text-gray-400">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent dark:border-zinc-700 rounded-full animate-spin" />
    </div>
  )
}

export default function SplitTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [pdfData, setPdfData] = useState<SplitPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingMeta, setIsLoadingMeta] = useState(false)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [customFileName, setCustomFileName] = useState('paperknife-split')
  const [rangeInput, setRangeInput] = useState('')
  const [splitMode, setSplitMode] = useState<'single' | 'individual'>('single')

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      setSourceFile(file)
    }
  }, [])

  const handleUnlocked = async (decryptedBuffer: Uint8Array, file: File) => {
    setIsLoadingMeta(true)
    try {
      const meta = await getPdfMetaData(file)
      const pdfDoc = await loadPdfDocument(decryptedBuffer)
      setPdfData({ file, decryptedBuffer, pageCount: meta.pageCount, pdfDoc, thumbnail: meta.thumbnail })
      const all = new Set<number>(); for (let i = 1; i <= meta.pageCount; i++) all.add(i)
      setSelectedPages(all); setRangeInput(`1-${meta.pageCount}`)
      setCustomFileName(`${file.name.replace('.pdf', '')}-split`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load document structure')
    } finally {
      setIsLoadingMeta(false)
      clearUrls()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSourceFile(e.target.files[0])
    if (e.target) e.target.value = ''
  }

  const togglePage = (pageNum: number) => {
    const newSelection = new Set(selectedPages)
    if (newSelection.has(pageNum)) newSelection.delete(pageNum)
    else newSelection.add(pageNum)
    setSelectedPages(newSelection)
    clearUrls()
  }

  const parseRange = (text: string) => {
    if (!pdfData) return
    const pages = new Set<number>()
    const parts = text.split(',').map(p => p.trim())
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number)
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(end, pdfData.pageCount); i++) pages.add(i)
        }
      } else {
        const num = Number(part)
        if (!isNaN(num) && num >= 1 && num <= pdfData.pageCount) pages.add(num)
      }
    })
    setSelectedPages(pages); clearUrls()
  }

  const splitPDF = async () => {
    if (!pdfData || selectedPages.size === 0) return
    setIsProcessing(true)
    try {
      const buffer = pdfData.decryptedBuffer
      const worker = new Worker(new URL('../../utils/pdfWorker.ts', import.meta.url), { type: 'module' })
      worker.postMessage({ type: 'SPLIT_PDF', payload: { buffer, selectedPages: Array.from(selectedPages), mode: splitMode, customFileName } })
      worker.onmessage = async (e) => {
        const { type, payload } = e.data
        if (type === 'SUCCESS') {
          const blob = new Blob([payload], { type: 'application/pdf' })
          const url = createUrl(blob)
          addActivity({ name: `${customFileName || 'split'}.pdf`, tool: 'Split', size: blob.size, resultUrl: url, buffer: payload })
          setIsProcessing(false); worker.terminate()
        } else if (type === 'SUCCESS_BATCH') {
          const zip = new JSZip()
          payload.forEach((res: { name: string, buffer: Uint8Array }) => { zip.file(res.name, res.buffer) })
          const zipBlob = await zip.generateAsync({ type: 'blob' })
          const url = createUrl(zipBlob)
          const zipBuffer = await zipBlob.arrayBuffer()
          addActivity({ name: `${customFileName || 'split'}.zip`, tool: 'Split', size: zipBlob.size, resultUrl: url, buffer: new Uint8Array(zipBuffer) })
          setIsProcessing(false); worker.terminate()
        } else if (type === 'ERROR') {
          toast.error(payload); setIsProcessing(false); worker.terminate()
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error splitting PDF.'); setIsProcessing(false)
    }
  }

  const ActionButton = () => (
    <button 
      onClick={splitPDF}
      disabled={isProcessing || selectedPages.size === 0}
      className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}
    >
      {isProcessing ? <><Loader2 className="animate-spin" /> Working...</> : <>Extract {selectedPages.size} Pages <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout
      title="Split PDF"
      description="Select pages visually or by range to extract them. Everything stays on your device."
      actions={pdfData && !objectUrl && <ActionButton />}
    >
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

      {!pdfData ? (
        <SecurePDFGate 
          file={sourceFile} 
          onUnlocked={handleUnlocked} 
          onCancel={() => setSourceFile(null)}
        >
          <button 
            onClick={() => !isLoadingMeta && fileInputRef.current?.click()} 
            className={`w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group ${isLoadingMeta ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isLoadingMeta ? (
              <div className="flex flex-col items-center">
                <Loader2 size={48} className="text-rose-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold mb-2">Analyzing PDF...</h3>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <FileUp size={32} />
                </div>
                <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF File</h3>
                <p className="text-sm text-gray-400 font-medium">Tap to start splitting</p>
              </>
            )}
          </button>
        </SecurePDFGate>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-12 h-16 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">{pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <Scissors size={24} />}</div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p>
            </div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>

          {pdfData.pageCount > 50 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-2xl flex items-center gap-3 text-amber-600 dark:text-amber-400 animate-in fade-in duration-500">
               <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Zap size={16} />
               </div>
               <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Heavy Document</p>
                  <p className="text-[11px] font-medium leading-tight">Visual selection for large files may be slower. Use range selection for speed.</p>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400 px-2">Page Selection</h4>
                  <div className="flex gap-2">
                    <button onClick={() => { const all = new Set<number>(); for(let i=1;i<=pdfData.pageCount;i++) all.add(i); setSelectedPages(all); }} className="text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1 rounded-lg transition-colors">Select All</button>
                    <button onClick={() => setSelectedPages(new Set())} className="text-[10px] font-black uppercase text-gray-400 px-2 py-1 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1 scrollbar-hide">
                  {Array.from({ length: pdfData.pageCount }).map((_, i) => {
                    const pageNum = i + 1; const isSelected = selectedPages.has(pageNum)
                    return (
                      <div key={pageNum} onClick={() => togglePage(pageNum)} className={`relative group cursor-pointer aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-rose-500 shadow-md scale-[1.02]' : 'border-transparent hover:border-gray-200 dark:hover:border-zinc-800'}`}>
                        <LazyThumbnail pdfDoc={pdfData.pdfDoc} pageNum={pageNum} />
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isSelected ? 'bg-rose-500/10 opacity-100' : 'bg-black/20 opacity-0 group-hover:opacity-100'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform ${isSelected ? 'bg-rose-500 text-white scale-100' : 'bg-white text-gray-400 scale-75'}`}>
                              {isSelected ? <Check size={20} strokeWidth={3} /> : <Plus size={20} />}
                           </div>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[9px] font-black text-white">PAGE {pageNum}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm sticky top-24">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Split Mode</label>
                      <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-black p-1 rounded-2xl">
                        <button onClick={() => { setSplitMode('single'); clearUrls(); }} className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase transition-all ${splitMode === 'single' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-gray-400'}`}>One Document</button>
                        <button onClick={() => { setSplitMode('individual'); clearUrls(); }} className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase transition-all ${splitMode === 'individual' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-gray-400'}`}>Separate Files</button>
                      </div>
                      <p className="text-[8px] text-gray-400 mt-2 px-1 leading-relaxed font-bold uppercase tracking-tight">
                        <b>One Document:</b> Merges selected pages into one PDF.<br/>
                        <b>Separate Files:</b> Each page becomes its own PDF (ZIP).
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Output Filename</label>
                      <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Range Selection</label>
                      <div className="flex gap-2">
                        <input type="text" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)} placeholder="e.g. 1, 3-5" className="flex-1 bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                        <button onClick={() => parseRange(rangeInput)} className="px-4 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase active:scale-95 transition-transform">Apply</button>
                      </div>
                      <p className="text-[8px] text-gray-400 mt-2 px-1">Use commas for separate pages and dashes for ranges.</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                    <div className="flex justify-between items-end mb-4 px-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Selected</span>
                      <span className="text-xl font-black text-rose-500">{selectedPages.size} <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pages</span></span>
                    </div>
                    {objectUrl && (
                      <SuccessState 
                        message="Split Successful!"
                        downloadUrl={objectUrl}
                        fileName={`${customFileName || 'split'}.${splitMode === 'single' ? 'pdf' : 'zip'}`}
                        onStartOver={() => { clearUrls(); setPdfData(null); setIsProcessing(false); }}
                        showPreview={splitMode === 'single'}
                      />
                    )}
                  </div>
                  <button onClick={() => { setPdfData(null); clearUrls(); }} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}