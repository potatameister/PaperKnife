import { useState, useRef, useEffect } from 'react'
import { Loader2, Edit2, Scissors, Check, Plus, Lock } from 'lucide-react'
import JSZip from 'jszip'
import { toast } from 'sonner'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { useObjectURL } from '../../utils/useObjectURL'
import ToolHeader from './shared/ToolHeader'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'

type SplitPdfFile = {
  file: File
  pageCount: number
  isLocked: boolean
  pdfDoc?: any
  password?: string
}

// Lazy Thumbnail Component
const LazyThumbnail = ({ pdfDoc, pageNum }: { pdfDoc: any, pageNum: number }) => {
  const [src, setSrc] = useState<string | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pdfDoc || src) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        renderPageThumbnail(pdfDoc, pageNum, 1.0).then(setSrc)
        observer.disconnect()
      }
    }, { rootMargin: '200px' }) // Start loading when 200px away

    if (imgRef.current) observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [pdfDoc, pageNum, src])

  if (src) return <img src={src} className="w-full h-full object-cover animate-in fade-in duration-300" alt={`Page ${pageNum}`} />
  
  return (
    <div ref={imgRef} className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-400">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function SplitTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [pdfData, setPdfData] = useState<SplitPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingMeta, setIsLoadingMeta] = useState(false)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [customFileName, setCustomFileName] = useState('paperknife-split')
  const [rangeInput, setRangeInput] = useState('')
  const [splitMode, setSplitMode] = useState<'single' | 'individual'>('single')
  const [unlockPassword, setUnlockPassword] = useState('')

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsLoadingMeta(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({
        ...pdfData,
        isLocked: false,
        pageCount: result.pageCount,
        pdfDoc: result.pdfDoc,
        password: unlockPassword
      })
      // Select all by default
      const all = new Set<number>()
      for (let i = 1; i <= result.pageCount; i++) all.add(i)
      setSelectedPages(all)
      setRangeInput(`1-${result.pageCount}`)
    } else {
      toast.error('Incorrect password')
    }
    setIsLoadingMeta(false)
  }

  // Handle File Selection
  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsLoadingMeta(true)
    try {
      const meta = await getPdfMetaData(file)
      console.log('File metadata:', meta)
      if (meta.isLocked) {
        setPdfData({ file, pageCount: 0, isLocked: true })
      } else {
        // Load the efficient PDF document proxy once
        const pdfDoc = await loadPdfDocument(file)
        
        setPdfData({
          file,
          pageCount: meta.pageCount,
          isLocked: false,
          pdfDoc
        })
        // Select all by default
        const all = new Set<number>()
        for (let i = 1; i <= meta.pageCount; i++) all.add(i)
        setSelectedPages(all)
        setRangeInput(`1-${meta.pageCount}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingMeta(false)
      clearUrls()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  // Toggle single page selection
  const togglePage = (pageNum: number) => {
    const newSelection = new Set(selectedPages)
    if (newSelection.has(pageNum)) newSelection.delete(pageNum)
    else newSelection.add(pageNum)
    setSelectedPages(newSelection)
    clearUrls()
  }

  // Parse Range Input (e.g. "1, 3-5")
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
    setSelectedPages(pages)
    clearUrls()
  }

  const splitPDF = async () => {
    if (!pdfData || selectedPages.size === 0) return
    setIsProcessing(true)
    
    try {
      const buffer = await pdfData.file.arrayBuffer()
      const worker = new Worker(new URL('../../utils/pdfWorker.ts', import.meta.url), { type: 'module' })
      
      worker.postMessage({
        type: 'SPLIT_PDF',
        payload: {
          buffer,
          password: pdfData.password,
          selectedPages: Array.from(selectedPages),
          mode: splitMode,
          customFileName
        }
      })

      worker.onmessage = async (e) => {
        const { type, payload } = e.data
        if (type === 'SUCCESS') {
          const blob = new Blob([payload], { type: 'application/pdf' })
          const url = createUrl(blob)

          addActivity({
            name: `${customFileName || 'split'}.pdf`,
            tool: 'Split',
            size: blob.size,
            resultUrl: url
          })
          setIsProcessing(false)
          worker.terminate()
        } else if (type === 'SUCCESS_BATCH') {
          const zip = new JSZip()
          payload.forEach((res: { name: string, buffer: Uint8Array }) => {
            zip.file(res.name, res.buffer)
          })
          
          const zipBlob = await zip.generateAsync({ type: 'blob' })
          const url = createUrl(zipBlob)

          addActivity({
            name: `${customFileName || 'split'}.zip`,
            tool: 'Split',
            size: zipBlob.size,
            resultUrl: url
          })
          setIsProcessing(false)
          worker.terminate()
        } else if (type === 'ERROR') {
          toast.error(payload)
          setIsProcessing(false)
          worker.terminate()
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error splitting PDF.')
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1">
      <main className="max-w-6xl mx-auto px-6 py-6 md:py-10">
        <ToolHeader 
          title="Visual" 
          highlight="Splitter" 
          description="Select pages visually or by range to extract them. Everything stays on your device." 
        />

        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

        {!pdfData ? (
          <div onClick={() => !isLoadingMeta && fileInputRef.current?.click()} className={`border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-10 md:p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group ${isLoadingMeta ? 'opacity-50 cursor-wait' : ''}`}>
            {isLoadingMeta ? (
              <div className="flex flex-col items-center">
                <Loader2 size={48} className="text-rose-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold mb-2">Analyzing PDF...</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Processing is 100% local on your device. <br/>
                  Large files may take a moment depending on your hardware.
                </p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Scissors size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Select PDF</h3>
                <p className="text-xs md:text-sm text-gray-400 dark:text-zinc-500">Tap to start splitting</p>
              </>
            )}
          </div>
        ) : pdfData.isLocked ? (
          <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">File is Protected</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">This PDF requires a password to open.</p>
              
              <div className="space-y-4">
                <input 
                  type="password" 
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-center transition-all"
                  autoFocus
                />
                <button 
                  onClick={handleUnlock}
                  disabled={!unlockPassword || isLoadingMeta}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoadingMeta ? 'Unlocking...' : 'Unlock PDF'}
                </button>
                <button 
                  onClick={() => setPdfData(null)}
                  className="w-full py-2 text-xs font-bold text-gray-400 hover:text-rose-500"
                >
                  Choose different file
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Grid (Left/Middle) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black uppercase tracking-widest text-xs text-gray-400">Click to select pages</h4>
                  <div className="flex gap-2">
                    <button onClick={() => { const all = new Set<number>(); for(let i=1;i<=pdfData.pageCount;i++) all.add(i); setSelectedPages(all); }} className="text-[10px] font-black uppercase text-rose-500 hover:underline">Select All</button>
                    <button onClick={() => setSelectedPages(new Set())} className="text-[10px] font-black uppercase text-gray-400 hover:underline">Deselect All</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                  {Array.from({ length: pdfData.pageCount }).map((_, i) => {
                    const pageNum = i + 1
                    const isSelected = selectedPages.has(pageNum)
                    return (
                      <div 
                        key={pageNum}
                        onClick={() => togglePage(pageNum)}
                        className={`relative group cursor-pointer aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-rose-500 shadow-lg scale-[1.02]' : 'border-transparent hover:border-gray-200 dark:hover:border-zinc-700'}`}
                      >
                        <LazyThumbnail pdfDoc={pdfData.pdfDoc} pageNum={pageNum} />
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isSelected ? 'bg-rose-500/10 opacity-100' : 'bg-black/20 opacity-0 group-hover:opacity-100'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform ${isSelected ? 'bg-rose-500 text-white scale-100' : 'bg-white text-gray-400 scale-75'}`}>
                              {isSelected ? <Check size={20} strokeWidth={3} /> : <Plus size={20} />}
                           </div>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-tighter">P. {pageNum}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Controls (Right) */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm sticky top-24">
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-1 dark:text-white truncate">{pdfData.file.name}</h3>
                  <p className="text-xs text-gray-400 uppercase font-black tracking-widest">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Scissors size={12} /> Split Mode</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-black p-1 rounded-2xl border border-gray-100 dark:border-zinc-800">
                      <button 
                        onClick={() => { setSplitMode('single'); clearUrls(); }}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'single' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-gray-400'}`}
                      >
                        Single File
                      </button>
                      <button 
                        onClick={() => { setSplitMode('individual'); clearUrls(); }}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'individual' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-gray-400'}`}
                      >
                        Individual (ZIP)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Edit2 size={12} /> Custom Filename</label>
                    <input 
                      type="text" 
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-gray-100 dark:border-zinc-800 text-sm font-bold outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Scissors size={12} /> Range Selector</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        placeholder="e.g. 1, 3-5"
                        className="flex-1 bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-gray-100 dark:border-zinc-800 text-sm font-bold outline-none focus:border-rose-500"
                      />
                      <button onClick={() => parseRange(rangeInput)} className="px-4 bg-gray-100 dark:bg-zinc-800 rounded-xl font-bold text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">Apply</button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex justify-between items-end mb-4 px-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Selection</span>
                      <span className="text-xl font-black text-rose-500">{selectedPages.size} <span className="text-xs text-gray-400">Pages</span></span>
                    </div>

                    {!objectUrl ? (
                      <button 
                        onClick={splitPDF}
                        disabled={isProcessing || selectedPages.size === 0}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl shadow-xl shadow-rose-200 dark:shadow-none font-black tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isProcessing ? <><Loader2 className="animate-spin" /> Splitting...</> : 'Extract Selection'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <SuccessState 
                          message="Ready for Download"
                          downloadUrl={objectUrl || ''}
                          fileName={`${customFileName || 'split'}.${splitMode === 'single' ? 'pdf' : 'zip'}`}
                          onStartOver={() => clearUrls()}
                          showPreview={splitMode === 'single'}
                        />
                      </div>
                    )}
                  </div>

                  <button onClick={() => { setPdfData(null); clearUrls(); }} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors tracking-[0.2em]">Close File</button>
                </div>

                {pdfData.password && (
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-start gap-3">
                    <Lock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                      <strong>Security Note:</strong> This file was protected. The extracted pages will be saved <strong>without</strong> a password.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <PrivacyBadge />
      </main>
    </div>
  )
}