import React, { useState, useRef, useEffect } from 'react'
import { Loader2, Grid, Move, RefreshCcw, X, FileUp } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { DndContext, closestCenter, KeyboardSensor, useSensor, useSensors, DragEndEvent, TouchSensor, MouseSensor } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'

import { getPdfMetaData, loadPdfDocument, renderGridThumbnail } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { SecurePDFGate } from '../shared/SecurePDFGate'

type RearrangePdfData = { 
  file: File, 
  decryptedBuffer: Uint8Array,
  pageCount: number,
  pdfDoc?: any,
  thumbnail?: string,
}

const LazyThumbnail = ({ pdfDoc, pageNum }: { pdfDoc: any, pageNum: number }) => {
  const [src, setSrc] = useState<string | null>(null); const imgRef = useRef<HTMLDivElement>(null)

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
    }, { rootMargin: '200px' })
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [pdfDoc, pageNum, src])

  if (src && src !== 'error') return <img src={src} className="w-full h-full object-contain bg-white pointer-events-none" alt={`P${pageNum}`} />
  if (src === 'error') return <div className="w-full h-full bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center text-[8px] font-bold text-rose-500 uppercase">Error</div>
  return <div ref={imgRef} className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /></div>
}

interface SortablePageProps {
  id: string;
  pageNum: number;
  pdfDoc: any;
}

const SortablePage: React.FC<SortablePageProps> = ({ id, pageNum, pdfDoc }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 0, position: 'relative' as const }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`relative group cursor-grab active:cursor-grabbing aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all bg-gray-50 dark:bg-black touch-none ${isDragging ? 'border-rose-500 shadow-2xl scale-105 opacity-90' : 'border-transparent hover:border-rose-500 shadow-sm'}`}>
      <div className="w-full h-full p-2"><LazyThumbnail pdfDoc={pdfDoc} pageNum={pageNum} /></div>
      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md rounded-lg p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"><Move size={14} /></div>
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[9px] font-black text-white">PAGE {pageNum}</div>
    </div>
  )
}

export default function RearrangeTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [pdfData, setPdfData] = useState<RearrangePdfData | null>(null)
  const [pageOrder, setPageOrder] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-rearranged')

  const [isLoadingFile, setIsLoadingFile] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      setSourceFile(file)
    }
  }, [])

  const handleUnlocked = async (decryptedBuffer: Uint8Array, file: File) => {
    setIsLoadingFile(true)
    try {
      const meta = await getPdfMetaData(file)
      const pdfDoc = await loadPdfDocument(decryptedBuffer)
      setPdfData({ file, decryptedBuffer, pageCount: meta.pageCount, pdfDoc, thumbnail: meta.thumbnail })
      setPageOrder(Array.from({ length: meta.pageCount }, (_, i) => (i + 1).toString()))
      setCustomFileName(`${file.name.replace('.pdf', '')}-rearranged`)
    } catch (err) { 
      console.error(err) 
      toast.error('Failed to load document structure')
    } finally { 
      setIsLoadingFile(false); 
      setDownloadUrl(null) 
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setPageOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over?.id as string)
        return arrayMove(items, oldIndex, newIndex)
      }); setDownloadUrl(null)
    }
  }

  const savePDF = async () => {
    if (!pdfData) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const pdfDoc = await PDFDocument.load(pdfData.decryptedBuffer)
      const newPdf = await PDFDocument.create()
      const indices = pageOrder.map(id => parseInt(id) - 1)
      const copiedPages = await newPdf.copyPages(pdfDoc, indices)
      copiedPages.forEach(page => newPdf.addPage(page))
      const pdfBytes = await newPdf.save(); const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob); setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Rearrange', size: blob.size, resultUrl: url, buffer: pdfBytes })
    } catch (error: any) { toast.error(`Error: ${error.message}`) } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={savePDF} disabled={isProcessing} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <RefreshCcw size={20} />} Save New Order
    </button>
  )
return (
  <NativeToolLayout title="Rearrange PDF" description="Drag and drop to reorder pages visually." actions={pdfData && !downloadUrl && <ActionButton />}>
    <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && setSourceFile(e.target.files[0])} />

    {!pdfData ? (
      <SecurePDFGate 
        file={sourceFile} 
        onUnlocked={handleUnlocked} 
        onCancel={() => setSourceFile(null)}
      >
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><FileUp size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400 font-medium">Tap to start reordering</p>
        </div>
      </SecurePDFGate>
    ) : (
      <div className="space-y-6">
...
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-12 h-16 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">{pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <Grid size={24} />}</div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p>
            </div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-6 px-2">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400">Hold & drag pages</h4>
              <button onClick={() => setPageOrder(Array.from({ length: pdfData.pageCount }, (_, i) => (i + 1).toString()))} className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 hover:text-rose-500 transition-colors font-bold"><RefreshCcw size={12}/> Reset</button>
            </div>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pageOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
                  {pageOrder.map((id) => ( <SortablePage key={id} id={id} pageNum={parseInt(id)} pdfDoc={pdfData.pdfDoc} /> ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
            {!downloadUrl ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Output Filename</label>
                  <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                </div>
              </div>
            ) : (
              <SuccessState message="Rearranged Successfully!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setDownloadUrl(null); setPdfData(null); }} />
            )}
            <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
