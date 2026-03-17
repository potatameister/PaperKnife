import { useState, useRef } from 'react'
import { Plus, X, Loader2, GripVertical, Upload, ArrowRight } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { addActivity } from '../../utils/recentActivity'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type ImageFile = { id: string, file: File, preview: string }

function SortableImageItem({ id, img, onRemove }: { id: string, img: ImageFile, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 0 }
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border transition-colors shadow-sm group touch-none relative ${isDragging ? 'border-rose-500 shadow-xl scale-[1.02]' : 'border-gray-100 dark:border-white/5'}`}>
      <div {...attributes} {...listeners} className="p-2 cursor-grab text-rose-400 hover:text-rose-600 active:scale-90 transition-transform"><GripVertical size={20} /></div>
      <div className="w-12 h-16 bg-gray-100 dark:bg-black rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-800"><img src={img.preview} alt="P" className="w-full h-full object-cover" /></div>
      <div className="flex-1 min-w-0"><p className="font-bold text-sm truncate dark:text-white">{img.file.name}</p></div>
      <button onClick={() => onRemove(id)} className="p-2 text-gray-400 hover:text-rose-500"><X size={18} /></button>
    </div>
  )
}

export default function ImageToPdfTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-images-to-pdf')
  const isNative = Capacitor.isNativePlatform()

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const handleFiles = (selectedFiles: FileList | File[]) => {
    const newImages = Array.from(selectedFiles).filter(f => f.type.startsWith('image/')).map(file => ({ id: Math.random().toString(36).substr(2, 9), file, preview: URL.createObjectURL(file) }))
    if (newImages.length === 0) { toast.error('Select images (JPG, PNG, WebP)'); return }
    setImages(prev => [...prev, ...newImages]); setDownloadUrl(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) { setImages((items) => { const oldIdx = items.findIndex((i) => i.id === active.id); const newIdx = items.findIndex((i) => i.id === over?.id); return arrayMove(items, oldIdx, newIdx) }) }
  }

  const convertToPDF = async () => {
    if (images.length === 0) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const pdfDoc = await PDFDocument.create()
      for (const imgData of images) {
        const imgBytes = await imgData.file.arrayBuffer(); let pdfImg
        if (imgData.file.type.includes('png')) { pdfImg = await pdfDoc.embedPng(imgBytes) } else { pdfImg = await pdfDoc.embedJpg(imgBytes) }
        const { width, height } = pdfImg.scale(1); const page = pdfDoc.addPage([width, height]); page.drawImage(pdfImg, { x: 0, y: 0, width, height })
      }
      const pdfBytes = await pdfDoc.save(); const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob); setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Image to PDF', size: blob.size, resultUrl: url, buffer: pdfBytes })
    } catch (error: any) { toast.error(`Error: ${error.message}`) } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={convertToPDF} disabled={isProcessing || images.length === 0} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <><Loader2 className="animate-spin" /> Working...</> : <>Generate PDF <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="Image to PDF" description="Convert photos and images into a professional PDF." actions={images.length > 0 && !downloadUrl && <ActionButton />}>
      <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      {images.length === 0 ? (
        <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Upload size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select Images</h3>
          <p className="text-sm text-gray-400">JPG, PNG, or WebP</p>
        </div>
      ) : !downloadUrl ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1"><p className="text-[10px] font-black uppercase text-gray-400">{images.length} Images</p><button onClick={() => setImages([])} className="text-[10px] font-black uppercase text-rose-500/60">Clear</button></div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}><SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}><div className="space-y-2">{images.map(img => <SortableImageItem key={img.id} id={img.id} img={img} onRemove={(id) => setImages(prev => prev.filter(i => i.id !== id))} />)}</div></SortableContext></DndContext>
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-rose-500 hover:text-rose-500 transition-all"><Plus size={16} /> Add More</button>
          <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Filename</label><input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm" /></div>
          {!isNative && <ActionButton />}
        </div>
      ) : (
        <SuccessState message="PDF Ready!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setImages([]); setDownloadUrl(null); }} />
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
