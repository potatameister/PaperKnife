import { useState, useRef } from 'react'
import { ArrowLeft, Upload, Plus, X, Download, Loader2, CheckCircle2, GripVertical, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Theme } from '../../types'
import { generateThumbnail } from '../../utils/pdfHelpers'
import { PaperKnifeLogo } from '../Logo'

// File Item Type
type PdfFile = {
  id: string
  file: File
  thumbnail?: string
}

// Draggable Item Component
function SortableItem({ id, file, onRemove }: { id: string, file: PdfFile, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border transition-colors shadow-sm group touch-none relative ${isDragging ? 'border-rose-300 dark:border-rose-800 shadow-xl scale-[1.02]' : 'border-gray-100 dark:border-zinc-800'}`}>
      <div {...attributes} {...listeners} className="p-2 cursor-grab text-rose-400 hover:text-rose-600 dark:text-rose-500/50 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
        <GripVertical size={20} />
      </div>
      
      {/* Thumbnail */}
      <div className="w-12 h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 relative">
        {file.thumbnail ? (
          <img src={file.thumbnail} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">PDF</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate dark:text-zinc-200">{file.file.name}</p>
        <p className="text-xs text-gray-400">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>

      <button onClick={() => onRemove(id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full text-gray-400 hover:text-rose-500 transition-colors">
        <X size={18} />
      </button>
    </div>
  )
}

export default function MergeTool({ theme, toggleTheme }: { theme: Theme, toggleTheme: () => void }) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<PdfFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        thumbnail: undefined
      }))
      
      setFiles(prev => [...prev, ...newFiles])
      setDownloadUrl(null)

      for (const pdfFile of newFiles) {
        generateThumbnail(pdfFile.file).then(thumb => {
          setFiles(prev => prev.map(f => f.id === pdfFile.id ? { ...f, thumbnail: thumb } : f))
        })
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    setDownloadUrl(null)
  }

  const mergePDFs = async () => {
    if (files.length === 0) return
    setIsProcessing(true)
    try {
      const mergedPdf = await PDFDocument.create()
      for (const pdfFile of files) {
        const fileBuffer = await pdfFile.file.arrayBuffer()
        const pdf = await PDFDocument.load(fileBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }
      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
    } catch (error) {
      console.error('Error merging PDFs:', error)
      alert('Failed to merge PDFs.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-gray-900 dark:text-zinc-100 font-sans animate-slide-in">
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-500 hover:text-rose-500 mr-1"
              title="Back to Home"
            >
              <ArrowLeft size={20} />
            </button>
            <PaperKnifeLogo size={28} />
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white hidden sm:block">PaperKnife</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <h1 className="font-black text-sm uppercase tracking-widest text-rose-500 hidden md:block">Merge PDF</h1>
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:border-rose-500 transition-all active:scale-95"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 dark:text-white">
            Combine Your <span className="text-rose-500">Files.</span>
          </h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400">
            Drag and drop multiple PDFs to merge them into one document. <br className="hidden md:block"/>
            Processed entirely on your device.
          </p>
        </div>

        {/* Input (Hidden) */}
        <input 
          type="file" 
          multiple 
          accept=".pdf" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
        />

        {/* Action Area */}
        <div className="space-y-4 md:space-y-6">
          
          {/* File List (Sortable) */}
          {files.length > 0 && (
            <div className="space-y-2 md:space-y-3">
              {files.length > 1 && (
                <p className="text-[10px] md:text-xs font-bold text-rose-500/60 uppercase tracking-widest text-center mb-2">
                  Tap & drag handles to reorder
                </p>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {files.map((file) => (
                    <SortableItem key={file.id} id={file.id} file={file} onRemove={removeFile} />
                  ))}
                </SortableContext>
              </DndContext>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all font-bold text-xs flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add More Files
              </button>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="flex flex-col gap-4">
            {files.length === 0 ? (
              // Empty State (Drop Zone)
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-10 md:p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={32} className="md:w-[40px] md:h-[40px]" strokeWidth={2} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Select PDFs</h3>
                <p className="text-xs md:text-sm text-gray-400 dark:text-zinc-500 mb-6 md:mb-8">Tap to browse files</p>
              </div>
            ) : !downloadUrl ? (
              // Ready to Merge
              <button 
                onClick={mergePDFs}
                disabled={isProcessing}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-lg md:text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin size={20}" /> Merging...
                  </>
                ) : (
                  <>
                    Merge {files.length} Files
                  </>
                )}
              </button>
            ) : (
              // Download State
              <div className="animate-in slide-in-from-bottom duration-500 fade-in">
                 <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 md:p-4 rounded-2xl mb-4 flex items-center justify-center gap-2 font-bold text-xs md:text-sm border border-green-100 dark:border-green-900/30">
                    <CheckCircle2 size={16} /> Success! Files merged.
                 </div>
                 <a 
                  href={downloadUrl}
                  download="paperknife-merged.pdf"
                  className="block w-full bg-gray-900 dark:bg-white text-white dark:text-black p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl font-black text-lg md:text-xl tracking-tight transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
                >
                  <Download size={20} className="md:w-[24px] md:h-[24px]" /> Download PDF
                </a>
                <button 
                  onClick={() => { setFiles([]); setDownloadUrl(null); }}
                  className="w-full mt-4 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 font-bold text-xs"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          100% Client-Side Processing
        </div>
      </main>
    </div>
  )
}