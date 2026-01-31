import { useState, useRef } from 'react'
import { Plus, X, Download, Loader2, CheckCircle2, GripVertical, Lock, Eye, Edit2, RotateCw, Upload } from 'lucide-react'
import { PDFDocument, degrees } from 'pdf-lib'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'

// File Item Type
type PdfFile = {
  id: string
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  rotation: number
  password?: string
}

// Format File Size helper
const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Draggable Item Component
function SortableItem({ id, file, onRemove, onRotate, onUnlock }: { id: string, file: PdfFile, onRemove: (id: string) => void, onRotate: (id: string) => void, onUnlock: (id: string, pass: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [localPass, setLocalPass] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    position: 'relative' as const,
  }

  const handleUnlockClick = async () => {
    setIsUnlocking(true)
    await onUnlock(id, localPass)
    setIsUnlocking(false)
  }

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border transition-colors shadow-sm group touch-none relative ${isDragging ? 'border-rose-300 dark:border-rose-800 shadow-xl scale-[1.02]' : 'border-gray-100 dark:border-zinc-800'}`}>
      <div {...attributes} {...listeners} className="p-2 cursor-grab text-rose-400 hover:text-rose-600 dark:text-rose-500/50 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
        <GripVertical size={20} />
      </div>
      
      {/* Thumbnail with Rotation */}
      <div className="w-12 h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 relative">
        {file.isLocked ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-zinc-800 text-rose-500">
            <Lock size={16} />
            <span className="text-[8px] font-black uppercase mt-1 text-center px-1">Locked</span>
          </div>
        ) : file.thumbnail ? (
          <img 
            src={file.thumbnail} 
            alt="Preview" 
            className="w-full h-full object-cover transition-transform duration-300" 
            style={{ transform: `rotate(${file.rotation}deg)` }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm truncate dark:text-zinc-200">{file.file.name}</p>
          {file.isLocked && <Lock size={12} className="text-rose-500 shrink-0" />}
        </div>
        
        {file.isLocked ? (
          <div className="flex gap-1 mt-1">
            <input 
              type="password" 
              placeholder="Password" 
              value={localPass}
              onChange={(e) => setLocalPass(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-black border border-gray-100 dark:border-zinc-800 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:border-rose-500"
            />
            <button 
              onClick={handleUnlockClick}
              disabled={!localPass || isUnlocking}
              className="bg-rose-500 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              {isUnlocking ? '...' : 'Unlock'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatSize(file.file.size)}</span>
            {file.pageCount > 0 && (
              <>
                <span>•</span>
                <span>{file.pageCount} pages</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onRotate(id)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-400 hover:text-rose-500 transition-colors"
          title="Rotate 90°"
        >
          <RotateCw size={18} />
        </button>
        <button onClick={() => onRemove(id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full text-gray-400 hover:text-rose-500 transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default function MergeTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<PdfFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-merged')
  const [progress, setProgress] = useState(0)
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    const newFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf').map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      thumbnail: undefined,
      pageCount: 0,
      isLocked: false,
      rotation: 0
    }))
    
    if (newFiles.length === 0) return

    setFiles(prev => [...prev, ...newFiles])
    setDownloadUrl(null)

    for (const pdfFile of newFiles) {
      getPdfMetaData(pdfFile.file).then(meta => {
        setFiles(prev => prev.map(f => f.id === pdfFile.id ? { 
          ...f, 
          thumbnail: meta.thumbnail,
          pageCount: meta.pageCount,
          isLocked: meta.isLocked
        } : f))
      })
    }
  }

  const handleUnlock = async (id: string, pass: string) => {
    const pdfFile = files.find(f => f.id === id)
    if (!pdfFile) return

    const result = await unlockPdf(pdfFile.file, pass)
    if (result.success) {
      setFiles(prev => prev.map(f => f.id === id ? {
        ...f,
        isLocked: false,
        thumbnail: result.thumbnail,
        pageCount: result.pageCount,
        password: pass
      } : f))
    } else {
      alert('Incorrect password for ' + pdfFile.file.name)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingGlobal(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingGlobal(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingGlobal(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
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

  const rotateFile = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f))
    setDownloadUrl(null)
  }

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0)
  const hasLockedFiles = files.some(f => f.isLocked)
  const canMerge = files.length >= 2 && !hasLockedFiles

  const mergePDFs = async () => {
    if (!canMerge) return

    setIsProcessing(true)
    setProgress(0)
    try {
      const mergedPdf = await PDFDocument.create()
      for (let i = 0; i < files.length; i++) {
        const pdfFile = files[i]
        try {
          const fileBuffer = await pdfFile.file.arrayBuffer()
          const pdf = await PDFDocument.load(fileBuffer, { 
            password: pdfFile.password || undefined,
            ignoreEncryption: true 
          } as any)
          const pageIndices = pdf.getPageIndices()
          const copiedPages = await mergedPdf.copyPages(pdf, pageIndices)
          
          copiedPages.forEach((page) => {
            const currentRotation = page.getRotation().angle
            page.setRotation(degrees((currentRotation + pdfFile.rotation) % 360))
            mergedPdf.addPage(page)
          })
        } catch (innerErr: any) {
          console.error(`Error loading ${pdfFile.file.name}:`, innerErr)
          throw new Error(`Could not load "${pdfFile.file.name}". ${innerErr.message || 'It might be encrypted or a newer PDF version than 1.7.'}`)
        }
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      // Add to local activity history
      addActivity({
        name: `${customFileName || 'merged'}.pdf`,
        tool: 'Merge',
        size: blob.size,
        resultUrl: url
      })
    } catch (error: any) {
      console.error('Final Merge Error:', error)
      alert(error.message || 'An unexpected error occurred during merging.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1"
    >
      {/* Global Drop Overlay */}
      {isDraggingGlobal && (
        <div className="fixed inset-0 z-[100] bg-rose-500/90 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-300">
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8 animate-bounce">
            <Plus size={64} strokeWidth={3} />
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4 text-center">Drop to Add</h2>
          <p className="text-lg md:text-xl font-medium opacity-80 text-center">Add more files to your merge queue</p>
        </div>
      )}

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
              <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex flex-col">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">
                    {files.length} Files • {totalPages} Pages
                  </p>
                </div>
                <button 
                  onClick={() => { setFiles([]); setDownloadUrl(null); }}
                  className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:text-rose-500 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <p className="text-[10px] font-bold text-gray-300 dark:text-zinc-600 uppercase tracking-[0.2em] text-center mb-2">
                Drag handles to reorder
              </p>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {files.map((file) => (
                    <SortableItem key={file.id} id={file.id} file={file} onRemove={removeFile} onRotate={rotateFile} onUnlock={handleUnlock} />
                  ))}
                </SortableContext>
              </DndContext>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all font-bold text-sm flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add More Files
              </button>

              {/* Filename Input */}
              {!downloadUrl && (
                <div className="mt-8 p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                    <Edit2 size={12} /> Output Filename
                  </label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 focus-within:border-rose-500 transition-colors">
                    <input 
                      type="text" 
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value.replace(/[^a-z0-9-_]/gi, ''))}
                      className="bg-transparent outline-none flex-1 text-sm font-bold dark:text-white"
                      placeholder="Enter filename..."
                    />
                    <span className="text-gray-400 text-xs font-bold">.pdf</span>
                  </div>
                </div>
              )}
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
              <div className="space-y-4">
                {isProcessing && (
                  <div className="space-y-4">
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700">
                      <div 
                        className="bg-rose-500 h-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(244,63,94,0.5)]" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-center text-gray-400 uppercase font-black tracking-widest animate-pulse">
                      Processing locally on your device. Larger files take more compute power.
                    </p>
                  </div>
                )}
                <button 
                  onClick={mergePDFs}
                  disabled={isProcessing || !canMerge}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-lg md:text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin size={20}" /> {progress}% Merging...
                    </>
                  ) : (
                    <>
                      {files.length < 2 ? 'Select at least 2 files' : hasLockedFiles ? 'Please unlock all files' : `Merge ${files.length} Files (${totalPages} Pages)`}
                    </>
                  )}
                </button>
              </div>
            ) : (
              // Download & Preview State
              <div className="animate-in slide-in-from-bottom duration-500 fade-in space-y-4">
                 <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 md:p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm border border-green-100 dark:border-green-900/30">
                    <CheckCircle2 size={16} /> Success! Your PDF is ready.
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => window.open(downloadUrl, '_blank')}
                      className="flex-1 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm font-black text-lg md:text-xl tracking-tight transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Eye size={24} /> Preview
                    </button>
                    
                    <a 
                      href={downloadUrl}
                      download={`${customFileName || 'merged'}.pdf`}
                      className="flex-[2] bg-gray-900 dark:bg-white text-white dark:text-black p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl font-black text-lg md:text-xl tracking-tight transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Download size={24} /> Download PDF
                    </a>
                 </div>

                <button 
                  onClick={() => { setFiles([]); setDownloadUrl(null); }}
                  className="w-full mt-4 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 font-bold text-xs uppercase tracking-[0.2em]"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>

        {files.some(f => f.password) && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-start gap-3 max-w-lg mx-auto">
            <Lock size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              <strong>Security Note:</strong> One or more files are protected. The merged document will be saved <strong>without</strong> a password.
            </p>
          </div>
        )}

        {/* Privacy Note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          100% Client-Side Processing
        </div>
      </main>
    </div>
  )
}