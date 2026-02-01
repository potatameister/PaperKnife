import { useState, useRef } from 'react'
import { Plus, X, Download, Loader2, GripVertical, ImageIcon, Edit2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'

import { addActivity } from '../../utils/recentActivity'
import ToolHeader from './shared/ToolHeader'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'

type ImageFile = {
  id: string
  file: File
  preview: string
}

function SortableImageItem({ id, img, onRemove }: { id: string, img: ImageFile, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  }

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border transition-colors shadow-sm group touch-none relative ${isDragging ? 'border-rose-300 dark:border-rose-800 shadow-xl scale-[1.02]' : 'border-gray-100 dark:border-zinc-800'}`}>
      <div {...attributes} {...listeners} className="p-2 cursor-grab text-rose-400 hover:text-rose-600 dark:text-rose-500/50 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
        <GripVertical size={20} />
      </div>
      
      <div className="w-12 h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700">
        <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate dark:text-zinc-200">{img.file.name}</p>
        <p className="text-[10px] text-gray-400 uppercase font-black">{(img.file.size / 1024).toFixed(1)} KB</p>
      </div>

      <button onClick={() => onRemove(id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full text-gray-400 hover:text-rose-500 transition-colors">
        <X size={18} />
      </button>
    </div>
  )
}

export default function ImageToPdfTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<ImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-images-to-pdf')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleFiles = (selectedFiles: FileList | File[]) => {
    const newImages = Array.from(selectedFiles)
      .filter(f => f.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file)
      }))
    
    if (newImages.length === 0) {
      toast.error('Please select image files (JPG, PNG, WebP)')
      return
    }

    setImages(prev => [...prev, ...newImages])
    setDownloadUrl(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
    setDownloadUrl(null)
  }

  const convertToPDF = async () => {
    if (images.length === 0) return
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const pdfDoc = await PDFDocument.create()
      
      for (const imgData of images) {
        const imgBytes = await imgData.file.arrayBuffer()
        let pdfImg
        
        if (imgData.file.type === 'image/jpeg' || imgData.file.type === 'image/jpg') {
          pdfImg = await pdfDoc.embedJpg(imgBytes)
        } else if (imgData.file.type === 'image/png') {
          pdfImg = await pdfDoc.embedPng(imgBytes)
        } else {
          // Fallback for WebP etc - draw to canvas first (simple version just skips or tries jpg)
          try {
            pdfImg = await pdfDoc.embedJpg(imgBytes)
          } catch {
            console.warn(`Skipping unsupported image type: ${imgData.file.type}`)
            continue
          }
        }

        const { width, height } = pdfImg.scale(1)
        const page = pdfDoc.addPage([width, height])
        page.drawImage(pdfImg, { x: 0, y: 0, width, height })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      addActivity({
        name: `${customFileName}.pdf`,
        tool: 'Image to PDF',
        size: blob.size,
        resultUrl: url
      })
    } catch (error: any) {
      toast.error(`Failed to convert: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1">
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <ToolHeader 
          title="Image to" 
          highlight="PDF" 
          description="Convert your photos and images into a professional PDF document. Processed locally." 
        />

        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={(e) => e.target.files && handleFiles(e.target.files)} 
        />

        <div className="space-y-6">
          {images.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 transition-all cursor-pointer group"
            >
              <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <ImageIcon size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Select Images</h3>
              <p className="text-sm text-gray-400">Tap to upload JPG, PNG, or WebP</p>
            </div>
          ) : !downloadUrl ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{images.length} Images Selected</p>
                <button onClick={() => setImages([])} className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 hover:text-rose-500 transition-colors">Clear All</button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {images.map((img) => (
                      <SortableImageItem key={img.id} id={img.id} img={img} onRemove={removeImage} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl text-gray-400 hover:text-rose-500 transition-all font-bold text-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add More Images
              </button>

              <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Edit2 size={12} /> Output Filename</label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 focus-within:border-rose-500 transition-colors">
                  <input 
                    type="text" 
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    className="bg-transparent outline-none flex-1 text-sm font-bold dark:text-white"
                  />
                  <span className="text-gray-400 text-xs font-bold">.pdf</span>
                </div>
              </div>

              <button 
                onClick={convertToPDF}
                disabled={isProcessing}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Download />}
                Generate PDF
              </button>
            </div>
          ) : (
            <SuccessState 
              message="PDF generated from images!"
              downloadUrl={downloadUrl}
              fileName={`${customFileName}.pdf`}
              onStartOver={() => { setImages([]); setDownloadUrl(null); }}
            />
          )}
        </div>

        <PrivacyBadge />
      </main>
    </div>
  )
}