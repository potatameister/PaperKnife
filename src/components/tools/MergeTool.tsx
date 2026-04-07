import React, { useState, useRef, useEffect } from 'react'
import { Plus, X, Loader2, GripVertical, RotateCw, Upload, RefreshCw, ArrowRight, FileUp } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import { saveWorkspace, getWorkspace, clearWorkspace } from '../../utils/workspacePersistence'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { SecurePDFGate } from '../shared/SecurePDFGate'

// File Item Type
type PdfFile = {
  id: string
  file: File
  decryptedBuffer: Uint8Array
  thumbnail?: string
  pageCount: number
  rotation: number
}

// Format File Size helper
const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

interface SortableItemProps {
  id: string;
  file: PdfFile;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
}

// Draggable Item Component
const SortableItem: React.FC<SortableItemProps> = ({ id, file, onRemove, onRotate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border transition-all shadow-sm group touch-none relative ${isDragging ? 'border-rose-300 dark:border-rose-800 shadow-xl scale-[1.02] ring-4 ring-rose-500/10' : 'border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/30'}`}>
      <div {...attributes} {...listeners} className="p-2 cursor-grab text-rose-400 hover:text-rose-600 dark:text-rose-500/50 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors active:scale-90">
        <GripVertical size={20} />
      </div>
      
      <div className="w-12 h-16 bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 relative group-hover:shadow-md transition-shadow">
        {file.thumbnail ? (
          <img 
            src={file.thumbnail} 
            alt="Preview" 
            className="w-full h-full object-cover transition-transform duration-500" 
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
          <p className="font-bold text-sm truncate text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors">{file.file.name}</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span>{formatSize(file.file.size)}</span>
          {file.pageCount > 0 && (
            <>
              <span>•</span>
              <span>{file.pageCount} pages</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => onRotate(id)}
          className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full text-gray-400 hover:text-rose-500 transition-all hover:rotate-90 active:scale-90"
          title="Rotate 90°"
        >
          <RotateCw size={18} />
        </button>
        <button onClick={() => onRemove(id)} className="p-2 hover:bg-rose-500/10 rounded-full text-gray-400 hover:text-rose-500 transition-all hover:scale-110 active:scale-90">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default function MergeTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setPipelineFile, consumePipelineFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [files, setFiles] = useState<PdfFile[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [customFileName, setCustomFileName] = useState('paperknife-merged')
  const [progress, setProgress] = useState(0)
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)
  const [hasRestorableWorkspace, setHasRestorableWorkspace] = useState(false)
  const isNative = Capacitor.isNativePlatform()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      if (pipelined.type && pipelined.type !== 'application/pdf') {
        toast.error('The file from the previous tool is not a PDF and cannot be used here.')
        return
      }
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFiles([file])
      toast.success(`Imported ${file.name} from pipeline`)
    }
  }, [])

  useEffect(() => {
    getWorkspace('merge').then(ws => {
      if (ws && ws.files.length > 0 && files.length === 0) {
        setHasRestorableWorkspace(true)
      }
    })
  }, [])

  useEffect(() => {
    if (files.length > 0) {
      const save = async () => {
        const fileDatas = await Promise.all(files.map(async f => ({
          name: f.file.name,
          buffer: f.decryptedBuffer,
          settings: { rotation: f.rotation }
        })))
        saveWorkspace('merge', fileDatas)
      }
      save()
    } else if (files.length === 0 && !hasRestorableWorkspace) {
      clearWorkspace('merge')
    }
  }, [files])

  const restoreWorkspace = async () => {
    const ws = await getWorkspace('merge')
    if (!ws) return

    const restoredFiles = ws.files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: new File([f.buffer as any], f.name, { type: 'application/pdf' }),
      decryptedBuffer: f.buffer,
      thumbnail: undefined,
      pageCount: 0,
      rotation: f.settings.rotation || 0
    }))

    setFiles(restoredFiles)
    setHasRestorableWorkspace(false)
    toast.success('Workspace restored successfully!')

    for (const pdfFile of restoredFiles) {
      loadPdfDocument(pdfFile.decryptedBuffer).then(pdfDoc => {
         return getPdfMetaData(pdfFile.file).then(meta => ({ pdfDoc, meta }));
      }).then(({ pdfDoc, meta }) => {
        setFiles(prev => prev.map(f => f.id === pdfFile.id ? { 
          ...f, 
          thumbnail: meta.thumbnail,
          pageCount: meta.pageCount
        } : f))
      })
    }
  }

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    const validFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf')
    if (validFiles.length === 0) return
    setPendingFiles(prev => [...prev, ...validFiles])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUnlocked = async (decryptedBuffer: Uint8Array, file: File) => {
    const newFile: PdfFile = {
      id: Math.random().toString(36).substr(2, 9),
      file,
      decryptedBuffer,
      thumbnail: undefined,
      pageCount: 0,
      rotation: 0
    }
    
    setFiles(prev => [...prev, newFile])
    setPendingFiles(prev => prev.filter(f => f !== file))
    clearUrls()

    try {
      const meta = await getPdfMetaData(file)
      setFiles(prev => prev.map(f => f.id === newFile.id ? { 
        ...f, 
        thumbnail: meta.thumbnail,
        pageCount: meta.pageCount
      } : f))
    } catch (e) { console.error(e) }
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
    if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
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
    clearUrls()
  }

  const rotateFile = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f))
    clearUrls()
  }

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0)
  const canMerge = files.length >= 2

  const mergePDFs = async () => {
    if (!canMerge) return

    setIsProcessing(true)
    setProgress(0)
    
    try {
      const worker = new Worker(new URL('../../utils/pdfWorker.ts', import.meta.url), { type: 'module' })
      const fileDatas = []
      for (const f of files) {
        fileDatas.push({
          buffer: f.decryptedBuffer,
          rotation: f.rotation
        })
      }

      worker.postMessage({ type: 'MERGE_PDFS', payload: { files: fileDatas } })

      worker.onmessage = (e) => {
        const { type, payload } = e.data
        if (type === 'PROGRESS') {
          setProgress(payload)
        } else if (type === 'SUCCESS') {
          const blob = new Blob([payload], { type: 'application/pdf' })
          const url = createUrl(blob)
          const fileName = `${customFileName || 'merged'}.pdf`
          
          setPipelineFile({
            buffer: payload,
            name: fileName,
            type: 'application/pdf'
          })
          
          addActivity({
            name: fileName,
            tool: 'Merge',
            size: blob.size,
            resultUrl: url,
            buffer: payload
          })
          
          setIsProcessing(false)
          worker.terminate()
          clearWorkspace('merge')
          toast.success('PDFs merged successfully!')
        } else if (type === 'ERROR') {
          toast.error(payload)
          setIsProcessing(false)
          worker.terminate()
        }
      }
    } catch (error: any) {
      toast.error('An error occurred.')
      setIsProcessing(false)
    }
  }

  const ActionButton = () => (
    <button 
      onClick={mergePDFs}
      disabled={isProcessing || !canMerge}
      className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}
    >
      {isProcessing ? <><Loader2 className="animate-spin" /> {progress}%</> : <>Merge PDFs <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document. Processed entirely on your device."
      actions={files.length > 0 && !objectUrl && <ActionButton />}
    >
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1"
      >
        {pendingFiles.length > 0 && (
          <div className="fixed inset-0 z-[200] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <SecurePDFGate 
                file={pendingFiles[0]} 
                onUnlocked={handleUnlocked}
                onCancel={() => setPendingFiles(prev => prev.slice(1))}
              />
            </div>
          </div>
        )}

        {isDraggingGlobal && (
          <div className="fixed inset-0 z-[100] bg-rose-500/90 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-300">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8 animate-bounce">
              <Plus size={64} strokeWidth={3} />
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-4 text-center">Drop to Add</h2>
          </div>
        )}

        {hasRestorableWorkspace && (
          <div className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500 shadow-sm">
             <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                   <RefreshCw size={24} className="animate-spin-slow" />
                </div>
                <div>
                   <h4 className="font-black text-sm dark:text-white uppercase tracking-tight">Unfinished Work Found</h4>
                   <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">We saved your previous file list. Want to restore it?</p>
                </div>
             </div>
             <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={restoreWorkspace}
                  className="flex-1 md:flex-none px-6 py-3 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  Restore
                </button>
                <button 
                  onClick={() => { clearWorkspace('merge'); setHasRestorableWorkspace(false); }}
                  className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-zinc-800 text-gray-400 hover:text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
                >
                  Discard
                </button>
             </div>
          </div>
        )}

        <div className="space-y-6">
          {files.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {files.length} Files • {totalPages} Pages
                </p>
                <button onClick={() => { setFiles([]); clearUrls(); clearWorkspace('merge'); }} className="text-[10px] font-black uppercase text-rose-500/60 hover:text-rose-500 transition-colors font-bold">Clear All</button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <SortableItem key={file.id} id={file.id} file={file} onRemove={removeFile} onRotate={rotateFile} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:border-rose-500 hover:text-rose-500 transition-all"
              >
                <Plus size={16} /> Add More Files
              </button>

              {!objectUrl && (
                <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Output Filename</label>
                   <input 
                      type="text" 
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 outline-none font-bold text-sm border border-transparent focus:border-rose-500 transition-colors dark:text-white"
                   />
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
            >
               <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
                  <Upload size={32} />
               </div>
               <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF Files</h3>
               <p className="text-sm text-gray-400 font-medium">Tap to browse or drag and drop here</p>
            </button>
          )}

          {files.length > 0 && !objectUrl && !isNative && (
             <div className="mt-8">
                <ActionButton />
             </div>
          )}

          {isProcessing && !isNative && (
             <div className="mt-8 space-y-4">
                <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                   <div className="bg-rose-500 h-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Processing on Device...</p>
             </div>
          )}

          {objectUrl && (
            <div className="animate-in zoom-in duration-300">
              <SuccessState 
                message="PDFs Merged Successfully!"
                downloadUrl={objectUrl}
                fileName={`${customFileName || 'merged'}.pdf`}
                onStartOver={() => { setFiles([]); clearUrls(); clearWorkspace('merge'); setIsProcessing(false); }}
              />
            </div>
          )}
        </div>

        <input type="file" multiple accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
        <PrivacyBadge />
      </div>
    </NativeToolLayout>
  )
}
