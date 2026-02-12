/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Loader2, Lock, Share2, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { App } from '@capacitor/app'
import { loadPdfDocument, renderPageThumbnail, shareFile, unlockPdf } from '../utils/pdfHelpers'
import { PaperKnifeLogo } from './Logo'

interface PdfPreviewProps {
  file: File
  onClose: () => void
  onProcess: () => void
}

const LazyPage = ({ pdfDoc, pageNum, totalPages }: { pdfDoc: any, pageNum: number, totalPages: number }) => {
  const [img, setImg] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pdfDoc || img || isRendering) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsRendering(true)
        renderPageThumbnail(pdfDoc, pageNum, 2.0).then(data => {
          setImg(data)
          setIsRendering(false)
        })
        observer.disconnect()
      }
    }, { rootMargin: '600px' })

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [pdfDoc, pageNum, img, isRendering])

  return (
    <div 
      ref={containerRef}
      data-page-num={pageNum}
      className="relative flex flex-col items-center gap-4 animate-in fade-in duration-700 min-h-[400px] justify-center snap-center"
    >
      <div className="bg-white p-1 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.4)] group relative overflow-hidden transition-all duration-500 w-full max-w-[90%] md:max-w-full flex items-center justify-center min-h-[300px]">
        {img ? (
          <img 
            src={img} 
            alt={`Page ${pageNum}`} 
            className="max-w-full h-auto object-contain select-none shadow-sm" 
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-20">
             <Loader2 className="w-6 h-6 text-zinc-800 animate-spin" />
             <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.2em]">Page {pageNum} Loading...</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
         <div className="h-[1px] w-8 bg-zinc-800/50" />
         <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Page {pageNum} / {totalPages}</span>
         <div className="h-[1px] w-8 bg-zinc-800/50" />
      </div>
    </div>
  )
}

export default function PdfPreview({ file, onClose, onProcess }: PdfPreviewProps) {
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [password, setPassword] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const doc = await loadPdfDocument(file)
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
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

    // Handle Hardware Back Button
    const backListener = App.addListener('backButton', () => {
      onClose()
    })

    return () => {
      backListener.then(l => l.remove())
    }
  }, [file, onClose])

  const handleUnlock = async () => {
    if (!password) return
    setIsUnlocking(true)
    try {
      const result = await unlockPdf(file, password)
      if (result.success) {
        setPdfDoc(result.pdfDoc)
        setTotalPages(result.pageCount)
        setIsLocked(false)
        toast.success('Document unlocked')
      } else {
        toast.error('Incorrect password')
      }
    } catch (e) {
      toast.error('Failed to unlock')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    // Update current page based on intersection
    const pages = e.currentTarget.querySelectorAll('[data-page-num]')
    pages.forEach(page => {
      const rect = page.getBoundingClientRect()
      if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
        setCurrentPage(Number(page.getAttribute('data-page-num')))
      }
    })
  }

  const handleShare = async () => {
    const buffer = await file.arrayBuffer()
    await shareFile(new Uint8Array(buffer), file.name, file.type)
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[500] bg-zinc-950 flex flex-col animate-in fade-in duration-300 overflow-hidden overscroll-none"
    >
      
      {/* Fixed Header - Always Visible */}
      <header className="fixed top-0 inset-x-0 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4 bg-zinc-900/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-50 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 active:bg-white/10 active:text-white transition-all"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
             <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-xl shrink-0">
                <PaperKnifeLogo size={20} iconColor="#F43F5E" partColor="#000000" />
             </div>
             <div className="min-w-0">
                <h2 className="text-sm font-black text-white truncate max-w-[140px] leading-tight">{file.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Secure View</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }} 
            className="w-10 h-10 flex items-center justify-center bg-white/5 text-zinc-300 rounded-2xl active:bg-white/10 transition-all border border-white/5"
          >
            <Share2 size={18} strokeWidth={2.5} />
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onProcess();
            }}
            className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 active:bg-rose-600 transition-all border border-rose-400/20"
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </header>

      {/* Main Content - Scrollable List of Pages */}
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 pt-32 space-y-10 bg-zinc-950 scrollbar-hide overscroll-none snap-y"
      >
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Decoding Layers...</p>
          </div>
        )}

        {isLocked ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-rose-500/20">
              <Lock size={32} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tighter mb-3">Layer Protected</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed mb-8">This document is encrypted. Enter the password to view the contents.</p>
            
            <div className="w-full max-w-xs space-y-3 mb-10">
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                 placeholder="Enter Password"
                 className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-center outline-none focus:border-rose-500 transition-all"
                 autoFocus
               />
               <button 
                 onClick={handleUnlock}
                 disabled={!password || isUnlocking}
                 className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {isUnlocking ? <Loader2 className="animate-spin" size={16} /> : <Unlock size={16} />} 
                 Unlock Layer
               </button>
            </div>

            <button 
              onClick={onProcess} 
              className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors"
            >
              Tool Selection
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-12 pb-40">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <LazyPage 
                key={idx} 
                pdfDoc={pdfDoc} 
                pageNum={idx + 1} 
                totalPages={totalPages} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Fixed Status Bar - Always Visible */}
      <footer className="fixed bottom-0 inset-x-0 px-6 py-4 bg-zinc-900/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 z-50 pb-[calc(env(safe-area-inset-bottom)+1rem)]" onClick={(e) => e.stopPropagation()}>
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/20">
               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
               Secure
            </div>
            <span className="opacity-30">|</span>
            <span className="text-zinc-400">{(file.size / (1024*1024)).toFixed(2)} MB</span>
         </div>
         <div className="text-zinc-400 font-bold tracking-[0.1em]">
            {currentPage} / {totalPages} Nodes
         </div>
      </footer>
    </div>,
    document.body
  )
}