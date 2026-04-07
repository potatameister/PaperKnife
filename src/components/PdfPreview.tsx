/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 */

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Share2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { App } from '@capacitor/app'
import { loadPdfDocument, renderPdfPage, shareFile } from '../utils/pdfHelpers'
import { PaperKnifeLogo } from './Logo'

interface PdfPreviewProps {
  file: File
  onClose: () => void
  onProcess: () => void
}

interface PdfPageProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  isActive: boolean;
}

const PdfPage: React.FC<PdfPageProps> = ({ pdfDoc, pageNum, scale, isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedRef = useRef<string>('')

  useEffect(() => {
    if (!pdfDoc || !containerRef.current || !isActive) return

    const key = `${pageNum}-${scale}`
    if (renderedRef.current === key) return

    renderedRef.current = key

    const render = async () => {
      try {
        await renderPdfPage(pdfDoc, pageNum, containerRef.current!, {
          scale,
          enableAnnotationLayer: true
        })
      } catch (err) {
        console.error('Render error:', err)
      }
    }

    render()
  }, [pdfDoc, pageNum, scale, isActive])

  return (
    <div 
      ref={containerRef}
      data-page-num={pageNum}
      className="flex justify-center py-4"
    />
  )
}

export default function PdfPreview({ file, onClose, onProcess }: PdfPreviewProps) {
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(0.7)
  const [pageInput, setPageInput] = useState('1')
  
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const doc = await loadPdfDocument(file)
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
      } catch (err: any) {
        console.error('Preview load error:', err)
        toast.error('Failed to load document')
      } finally {
        setIsLoading(false)
      }
    }
    load()

    const backListener = App.addListener('backButton', () => {
      onClose()
    })

    return () => {
      backListener.then(l => l.remove())
    }
  }, [file, onClose])

  // Sync pageInput when currentPage changes (e.g., from scroll)
  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const pages = e.currentTarget.querySelectorAll('[data-page-num]')
    const containerTop = e.currentTarget.getBoundingClientRect().top
    const containerCenter = containerTop + e.currentTarget.clientHeight / 2

    let closestPage = currentPage
    let closestDistance = Infinity

    pages.forEach(page => {
      const rect = page.getBoundingClientRect()
      const pageCenter = rect.top + rect.height / 2
      const distance = Math.abs(pageCenter - containerCenter)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestPage = Number(page.getAttribute('data-page-num'))
      }
    })

    if (closestPage !== currentPage) {
      setCurrentPage(closestPage)
      setPageInput(String(closestPage))
    }
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setPageInput(String(page))
    const element = document.querySelector(`[data-page-num="${page}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Don't set currentPage here - let scroll handler detect it
    }
  }

  const handleShare = async () => {
    const buffer = await file.arrayBuffer()
    await shareFile(new Uint8Array(buffer), file.name, file.type)
  }

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3.0))
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5))

  return createPortal(
    <div className="fixed inset-0 z-[500] bg-zinc-950 flex flex-col animate-in fade-in duration-300 overflow-hidden overscroll-none">
      
      {/* Fixed Header */}
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
             <div className="hidden sm:block min-w-0">
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
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center bg-white/5 text-zinc-300 rounded-2xl active:bg-white/10 transition-all border border-white/5"
          >
            <Share2 size={18} strokeWidth={2.5} />
          </button>

          <button 
            onClick={onProcess}
            className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 active:bg-rose-600 transition-all border border-rose-400/20"
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main 
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-zinc-950 scrollbar-hide overscroll-none pt-20 pb-32"
      >
        <div className="min-h-full flex flex-col items-center">
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-40">
              <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Decoding Layers...</p>
            </div>
          )}

          <div className="w-full">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <PdfPage 
                key={idx} 
                pdfDoc={pdfDoc} 
                pageNum={idx + 1}
                scale={scale}
                isActive={Math.abs(idx + 1 - currentPage) <= 1}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Controls */}
      <footer className="fixed bottom-0 inset-x-0 px-4 py-3 bg-zinc-900/95 backdrop-blur-xl border-t border-white/5 z-50 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" onClick={(e) => e.stopPropagation()}>
        
        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <button 
            onClick={zoomOut}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-full active:bg-white/20 transition-all disabled:opacity-30"
          >
            <ZoomOut size={18} strokeWidth={2.5} />
          </button>
          
          <span className="text-sm font-bold text-white min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button 
            onClick={zoomIn}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-full active:bg-white/20 transition-all disabled:opacity-30"
          >
            <ZoomIn size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="w-10 h-10 flex items-center justify-center bg-white/5 text-zinc-400 rounded-xl active:bg-white/10 transition-all disabled:opacity-30"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => {
                setPageInput(e.target.value)
              }}
              onBlur={() => {
                const page = parseInt(pageInput, 10)
                if (page >= 1 && page <= totalPages) {
                  goToPage(page)
                } else {
                  setPageInput(String(currentPage))
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt(pageInput, 10)
                  if (page >= 1 && page <= totalPages) {
                    goToPage(page)
                  } else {
                    setPageInput(String(currentPage))
                  }
                  e.currentTarget.blur()
                }
              }}
              disabled={isLoading}
              className="w-14 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-center text-white font-bold text-sm outline-none focus:border-rose-500 disabled:opacity-30"
            />
            <span className="text-zinc-500 text-sm font-medium">/ {totalPages}</span>
          </div>
          
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="w-10 h-10 flex items-center justify-center bg-white/5 text-zinc-400 rounded-xl active:bg-white/10 transition-all disabled:opacity-30"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </footer>
    </div>,
    document.body
  )
}