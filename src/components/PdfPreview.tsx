/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useEffect } from 'react'
import { X, Plus, ChevronLeft, ChevronRight, Loader2, FileText, Share2, Download } from 'lucide-react'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pageImage, setPageImage] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const doc = await loadPdfDocument(file)
        setPdf(doc)
        setTotalPages(doc.numPages)
        const firstPage = await renderPageThumbnail(doc, 1, 1.5)
        setPageImage(firstPage)
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

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || !pdf) return
    setIsLoading(true)
    setCurrentPage(newPage)
    const image = await renderPageThumbnail(pdf, newPage, 1.5)
    setPageImage(image)
    setIsLoading(false)
  }

  const handleShare = async () => {
    const buffer = await file.arrayBuffer()
    await shareFile(new Uint8Array(buffer), file.name, file.type)
  }

  const handleDownload = async () => {
    const buffer = await file.arrayBuffer()
    await downloadFile(new Uint8Array(buffer), file.name, file.type)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <header className="px-6 pt-safe pb-4 bg-zinc-900/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between h-20 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors active:scale-90">
            <X size={24} />
          </button>
          <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg shadow-rose-500/20">
                <PaperKnifeLogo size={18} iconColor="#FFFFFF" />
             </div>
             <div className="min-w-0">
                <h2 className="text-sm font-black text-white truncate max-w-[150px] leading-tight">{file.name}</h2>
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Preview Mode</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isNative && (
            <button onClick={handleShare} className="p-2.5 bg-white/5 text-zinc-400 rounded-xl active:bg-rose-500 active:text-white transition-all">
              <Share2 size={20} />
            </button>
          )}
          {!isNative && (
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

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col items-center justify-center p-4 relative bg-zinc-950">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          </div>
        )}

        {isLocked ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-black text-white">Document Protected</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">This file is encrypted. You can still process it using the Tools menu.</p>
            <button onClick={onProcess} className="px-8 py-3 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Go to Tools</button>
          </div>
        ) : pageImage ? (
          <div className="w-full h-full flex items-center justify-center">
             <img 
               src={pageImage} 
               alt={`Page ${currentPage}`} 
               className="max-w-full max-h-full object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300" 
             />
          </div>
        ) : (
          <div className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Loading Core Engine...</div>
        )}

        {/* Floating Navigation */}
        {totalPages > 1 && !isLocked && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
            <button 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1 text-zinc-400 disabled:opacity-20 active:scale-90 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-xs font-black text-white">{currentPage} / {totalPages}</span>
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Pages</span>
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1 text-zinc-400 disabled:opacity-20 active:scale-90 transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="px-6 py-4 bg-zinc-900/90 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Local Sandbox
         </div>
         <div>
            {(file.size / (1024*1024)).toFixed(2)} MB
         </div>
      </footer>
    </div>
  )
}
