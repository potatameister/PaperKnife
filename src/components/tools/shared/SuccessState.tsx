import { Download, Eye, CheckCircle2, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { downloadFile, shareFile } from '../../../utils/pdfHelpers'
import { Capacitor } from '@capacitor/core'
import { hapticSuccess } from '../../../utils/haptics'
import PdfPreview from '../../PdfPreview'

interface SuccessStateProps {
  message: string
  downloadUrl: string
  fileName: string
  onStartOver: () => void
  showPreview?: boolean
}

export default function SuccessState({ message, downloadUrl, fileName, onStartOver, showPreview = true }: SuccessStateProps) {
  const [internalPreviewFile, setInternalPreviewFile] = useState<File | null>(null)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    hapticSuccess()
    
    // Auto-Download Logic
    const shouldAutoDownload = localStorage.getItem('autoDownload') === 'true'
    if (shouldAutoDownload) {
      const triggerAutoDownload = async () => {
        try {
          const response = await fetch(downloadUrl)
          const blob = await response.blob()
          const buffer = await blob.arrayBuffer()
          await downloadFile(new Uint8Array(buffer), fileName, 'application/pdf')
          toast.success(`Auto-saved as ${fileName}`)
        } catch (e) {
          console.error('Auto-download failed:', e)
        }
      }
      triggerAutoDownload()
    }
  }, [downloadUrl, fileName])

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      toast.loading(`Saving ${fileName}...`, { id: 'save-action' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      
      await downloadFile(new Uint8Array(buffer), fileName, 'application/pdf')
      toast.success(`Saved to Documents as ${fileName}`, { id: 'save-action' })
    } catch (err) {
      toast.error('Failed to save file', { id: 'save-action' })
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      toast.loading('Preparing to share...', { id: 'share-action' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      
      await shareFile(new Uint8Array(buffer), fileName, 'application/pdf')
      toast.dismiss('share-action')
    } catch (err) {
      toast.error('Failed to share file', { id: 'share-action' })
    }
  }

  const handlePreview = async () => {
    try {
      toast.loading('Loading preview...', { id: 'preview-load' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const file = new File([blob], fileName, { type: 'application/pdf' })
      setInternalPreviewFile(file)
      toast.dismiss('preview-load')
    } catch (e) {
      toast.error('Failed to open preview')
    }
  }

  return (
    <div className="animate-in slide-in-from-bottom duration-500 fade-in space-y-6">
      {internalPreviewFile && (
        <PdfPreview 
          file={internalPreviewFile} 
          onClose={() => setInternalPreviewFile(null)} 
          onProcess={() => setInternalPreviewFile(null)} 
        />
      )}

      <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 md:p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm border border-green-100 dark:border-green-900/30">
        <CheckCircle2 size={16} /> {message}
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {showPreview && (
            <button 
              onClick={handlePreview}
              className="flex-1 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl md:rounded-3xl shadow-sm font-black text-sm md:text-xl tracking-tight transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2"
            >
              <Eye size={20} /> Preview
            </button>
          )}
          
          <button 
            onClick={handleShare}
            className="flex-1 bg-rose-50 dark:bg-rose-900/20 text-rose-500 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl md:rounded-3xl shadow-sm font-black text-sm md:text-xl tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Share2 size={20} /> Share
          </button>
        </div>
        
        <button 
          onClick={handleDownload}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-black p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl font-black text-lg md:text-xl tracking-tight transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
        >
          <Download size={24} /> {isNative ? 'Save to Device' : 'Download'}
        </button>
      </div>

      <button 
        onClick={onStartOver}
        className="w-full mt-4 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 font-bold text-xs uppercase tracking-[0.2em]"
      >
        Start Over
      </button>
    </div>
  )
}