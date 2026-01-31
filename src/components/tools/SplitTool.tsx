import { useState, useRef } from 'react'
import { ArrowLeft, Download, Loader2, CheckCircle2, Moon, Sun, Edit2, Scissors, Heart, Check, Plus, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

import { Theme } from '../../types'
import { generateThumbnail, getPdfMetaData } from '../../utils/pdfHelpers'
import { PaperKnifeLogo } from '../Logo'

type SplitPdfFile = {
  file: File
  pageCount: number
  isLocked: boolean
  thumbnails: string[]
}

export default function SplitTool({ theme, toggleTheme }: { theme: Theme, toggleTheme: () => void }) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfData, setPdfData] = useState<SplitPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingMeta, setIsLoadingMeta] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [customFileName, setCustomFileName] = useState('paperknife-split')
  const [rangeInput, setRangeInput] = useState('')
  const [splitMode, setSplitMode] = useState<'single' | 'individual'>('single')

  // Handle File Selection
  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsLoadingMeta(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) {
        setPdfData({ file, pageCount: 0, isLocked: true, thumbnails: [] })
      } else {
        // Load first batch of thumbnails (e.g., first 12 for speed)
        const thumbs: string[] = []
        for (let i = 1; i <= Math.min(meta.pageCount, 12); i++) {
          thumbs.push(await generateThumbnail(file, i))
        }
        setPdfData({
          file,
          pageCount: meta.pageCount,
          isLocked: false,
          thumbnails: thumbs
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
      setDownloadUrl(null)
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
    setDownloadUrl(null)
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
    setDownloadUrl(null)
  }

  const splitPDF = async () => {
    if (!pdfData || selectedPages.size === 0) return
    setIsProcessing(true)
    try {
      const originalBuffer = await pdfData.file.arrayBuffer()
      const originalPdf = await PDFDocument.load(originalBuffer)
      
      if (splitMode === 'single') {
        const newPdf = await PDFDocument.create()
        const sortedIndices = Array.from(selectedPages).sort((a, b) => a - b).map(p => p - 1)
        const copiedPages = await newPdf.copyPages(originalPdf, sortedIndices)
        copiedPages.forEach(page => newPdf.addPage(page))

        const pdfBytes = await newPdf.save()
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
        setDownloadUrl(URL.createObjectURL(blob))
      } else {
        const zip = new JSZip()
        const sortedPages = Array.from(selectedPages).sort((a, b) => a - b)
        
        for (const pageNum of sortedPages) {
          const newPdf = await PDFDocument.create()
          const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1])
          newPdf.addPage(copiedPage)
          const pdfBytes = await newPdf.save()
          zip.file(`${customFileName || 'page'}-${pageNum}.pdf`, pdfBytes)
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        setDownloadUrl(URL.createObjectURL(zipBlob))
      }
    } catch (error: any) {
      alert(error.message || 'Error splitting PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-gray-900 dark:text-zinc-100 font-sans animate-slide-in relative transition-colors duration-300 ease-out">
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-500 hover:text-rose-500 mr-1"><ArrowLeft size={20} /></button>
            <PaperKnifeLogo size={28} />
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white hidden sm:block">PaperKnife</h1>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="font-black text-sm uppercase tracking-widest text-rose-500 hidden md:block">Split PDF</h1>
            <button onClick={toggleTheme} className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:border-rose-500 transition-all active:scale-95">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 dark:text-white">Visual <span className="text-rose-500">Splitter.</span></h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400">Select pages visually or by range to extract them. <br className="hidden md:block"/>Everything stays on your device.</p>
        </div>

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
                        {pdfData.thumbnails[i] ? (
                          <img src={pdfData.thumbnails[i]} className="w-full h-full object-cover" alt={`Page ${pageNum}`} />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-400">Page {pageNum}</div>
                        )}
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
                        onClick={() => { setSplitMode('single'); setDownloadUrl(null); }}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${splitMode === 'single' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-gray-400'}`}
                      >
                        Single File
                      </button>
                      <button 
                        onClick={() => { setSplitMode('individual'); setDownloadUrl(null); }}
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

                    {!downloadUrl ? (
                      <button 
                        onClick={splitPDF}
                        disabled={isProcessing || selectedPages.size === 0}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl shadow-xl shadow-rose-200 dark:shadow-none font-black tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {isProcessing ? <><Loader2 className="animate-spin" /> Splitting...</> : 'Extract Selection'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                         <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs border border-green-100 dark:border-green-900/30">
                            <CheckCircle2 size={16} /> Ready for Download
                         </div>

                         {splitMode === 'single' && (
                           <button 
                             onClick={() => window.open(downloadUrl, '_blank')}
                             className="w-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all active:scale-95"
                           >
                             <Eye size={20} /> Preview PDF
                           </button>
                         )}

                         <a 
                          href={downloadUrl} 
                          download={`${customFileName || 'split'}.${splitMode === 'single' ? 'pdf' : 'zip'}`}
                          className="w-full bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                         >
                          <Download size={20} /> Download {splitMode === 'single' ? 'PDF' : 'ZIP'}
                        </a>
                        <button onClick={() => setDownloadUrl(null)} className="w-full py-2 text-xs font-black uppercase text-gray-400 hover:text-rose-500">Edit Selection</button>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors tracking-[0.2em]">Close File</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-gray-100 dark:border-zinc-900 mt-20">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-600">
          <p>© 2026 PaperKnife</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/sponsors/potatameister" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-colors">
              <Heart size={12} fill="currentColor" /> Sponsor
            </a>
            <span className="hidden md:block text-gray-200 dark:text-zinc-800">|</span>
            <p>Built with ❤️ by <a href="https://github.com/potatameister" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">potatameister</a></p>
            <span className="hidden md:block text-gray-200 dark:text-zinc-800">|</span>
            <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}