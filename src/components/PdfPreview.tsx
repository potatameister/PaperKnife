import { useState, useEffect } from 'react'
import { X, Plus, Loader2, FileText, Share2, Download } from 'lucide-react'
import { loadPdfDocument, renderPageThumbnail, shareFile, downloadFile } from '../utils/pdfHelpers'
import { PaperKnifeLogo } from './Logo'
import { Capacitor } from '@capacitor/core'

interface PdfPreviewProps {
  file: File
  onClose: () => void
  onProcess: () => void
}

export default function PdfPreview({ file, onClose, onProcess }: PdfPreviewProps) {
  const [pdf, setPdf] = useState<any>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pages, setPages] = useState<string[]>([])
  const [isLocked, setIsLocked] = useState(false)
  
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const doc = await loadPdfDocument(file)
        setPdf(doc)
        const count = doc.numPages
        setTotalPages(count)
        
        // Load first few pages initially for responsiveness
        const loadedPages: string[] = []
        for (let i = 1; i <= Math.min(count, 5); i++) {
          const img = await renderPageThumbnail(doc, i, 1.5)
          loadedPages.push(img)
        }
        setPages(loadedPages)

        // Background load remaining pages if any
        if (count > 5) {
          for (let i = 6; i <= count; i++) {
            const img = await renderPageThumbnail(doc, i, 1.5)
            setPages(prev => [...prev, img])
          }
        }
      } catch (err: any) {
        if (err.name === 'PasswordException') {
          setIsLocked(true)
        }
        console.error('Preview load error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [file])

  const handleShare = async () => {
    const buffer = await file.arrayBuffer()
    await shareFile(new Uint8Array(buffer), file.name, file.type)
  }

  const handleDownload = async () => {
    const buffer = await file.arrayBuffer()
    await downloadFile(new Uint8Array(buffer), file.name, file.type)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <header className="px-6 pt-safe pb-4 bg-zinc-900/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between h-20 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors active:scale-90">
            <X size={24} />
          </button>
          <div className="flex items-center gap-2.5">
             {/* Dynamic Icon Logic: Dark Mode -> White BG, Pink/Black Icon */}
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <PaperKnifeLogo size={18} iconColor="#F43F5E" className="brightness-0" />
             </div>
             <div className="min-w-0">
                <h2 className="text-sm font-black text-white truncate max-w-[120px] leading-tight">{file.name}</h2>
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Inspection Node</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isNative ? (
            <button onClick={handleShare} className="p-2.5 bg-white/5 text-zinc-400 rounded-xl active:bg-rose-500 active:text-white transition-all">
              <Share2 size={20} />
            </button>
          ) : (
            <button onClick={handleDownload} className="p-2.5 bg-white/5 text-zinc-400 rounded-xl active:bg-rose-500 active:text-white transition-all">
              <Download size={20} />
            </button>
          )}
          <button 
            onClick={onProcess}
            className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            Process
          </button>
        </div>
      </header>

      {/* Main Content - Scrollable List of Pages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-950 scrollbar-hide">
        {isLoading && pages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          </div>
        )}

        {isLocked ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-black text-white">Document Protected</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">This file is encrypted. Access tools directly to unlock and process.</p>
            <button onClick={onProcess} className="px-8 py-3 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-500/20 active:scale-95">Tool Selection</button>
          </div>
        ) : (
          <>
            {pages.map((img, idx) => (
              <div key={idx} className="relative flex flex-col items-center gap-3 animate-in slide-in-from-bottom-10 duration-500">
                <div className="bg-white p-1 shadow-2xl rounded-sm max-w-full">
                  <img 
                    src={img} 
                    alt={`Page ${idx + 1}`} 
                    className="max-w-full h-auto object-contain" 
                  />
                </div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Page {idx + 1} of {totalPages}</span>
              </div>
            ))}
            
            {pages.length < totalPages && !isLoading && (
               <div className="py-10 flex flex-col items-center gap-4">
                  <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Loading remaining pages...</p>
               </div>
            )}
          </>
        )}
      </main>

      {/* Static Footer */}
      <footer className="px-6 py-4 bg-zinc-900/90 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 shrink-0">
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Isolated Environment
         </div>
         <div>
            {(file.size / (1024*1024)).toFixed(2)} MB • {totalPages} Pages
         </div>
      </footer>
    </div>
  )
}