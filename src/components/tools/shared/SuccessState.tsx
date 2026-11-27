import { Download, Eye, CheckCircle2, Share2, RotateCcw, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { downloadFile, shareFile } from '../../../utils/pdfHelpers'
import { updateActivityName } from '../../../utils/recentActivity'
import { Capacitor } from '@capacitor/core'
import { hapticSuccess } from '../../../utils/haptics'
import PdfPreview from '../../PdfPreview'
import { t } from '../../../i18n'

interface SuccessStateProps {
  message: string
  downloadUrl: string
  fileName: string
  onStartOver: () => void
  showPreview?: boolean
}

export default function SuccessState({ message, downloadUrl, fileName, onStartOver, showPreview = true }: SuccessStateProps) {
  const [internalPreviewFile, setInternalPreviewFile] = useState<File | null>(null)
  const [name, setName] = useState(fileName)
  const autoFired = useRef<string | null>(null)
  const isNative = Capacitor.isNativePlatform()
  const ext = fileName.endsWith('.zip') ? '.zip' : '.pdf'
  const mimeType = ext === '.zip' ? 'application/zip' : 'application/pdf'

  const withExt = (v: string) => {
    const base = v.trim().replace(/\.(pdf|zip)$/i, '') || fileName.replace(/\.(pdf|zip)$/i, '')
    return base + ext
  }

  const commitRename = async (raw: string) => {
    const final = withExt(raw)
    setName(final)
    if (final === fileName) return
    try {
      await updateActivityName(downloadUrl, final)
    } catch {
      toast.error(t("Could not update history name"))
    }
  }

  useEffect(() => {
    hapticSuccess()
    if (autoFired.current === downloadUrl) return
    autoFired.current = downloadUrl
    
    // Auto-Download Logic (fires once with the as-run name)
    const shouldAutoDownload = localStorage.getItem('autoDownload') === 'true'
    if (shouldAutoDownload) {
      const triggerAutoDownload = async () => {
        try {
          const response = await fetch(downloadUrl)
          const blob = await response.blob()
          const buffer = await blob.arrayBuffer()
          await downloadFile(new Uint8Array(buffer), fileName, mimeType)
          toast.success(t("Auto-saved as {0}", fileName))
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
      toast.loading(t("Saving {0}...", name), { id: 'save-action' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      
      await downloadFile(new Uint8Array(buffer), name, mimeType)
      toast.success(t("Saved to Documents as {0}", name), { id: 'save-action' })
    } catch (err) {
      toast.error(t("Failed to save file"), { id: 'save-action' })
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      toast.loading(t("Preparing to share..."), { id: 'share-action' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      
      await shareFile(new Uint8Array(buffer), name, mimeType)
      toast.dismiss('share-action')
    } catch (err) {
      toast.error(t("Failed to share file"), { id: 'share-action' })
    }
  }

  const handlePreview = async () => {
    try {
      toast.loading(t("Loading preview..."), { id: 'preview-load' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const file = new File([blob], name, { type: mimeType })
      setInternalPreviewFile(file)
      toast.dismiss('preview-load')
    } catch (e) {
      toast.error(t("Failed to open preview"))
    }
  }

  return (
    <div className="animate-in slide-in-from-bottom duration-500 fade-in space-y-6">
      {internalPreviewFile && (
        <PdfPreview 
          file={internalPreviewFile} 
          onClose={() => setInternalPreviewFile(null)} 
          onProcess={() => {
            const file = internalPreviewFile;
            setInternalPreviewFile(null);
            // Handoff to global Quick Drop selector after unmounting internal preview
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('open-quick-drop', { 
                detail: { file } 
              }))
            }, 100);
          }} 
        />
      )}

      <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 md:p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm border border-green-100 dark:border-green-900/30">
        <CheckCircle2 size={16} /> {message}
      </div>

      <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-4 py-3 rounded-2xl shadow-sm">
        <Pencil size={16} className="text-gray-400 shrink-0" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={(e) => commitRename(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          aria-label={t("Output filename")}
          className="flex-1 min-w-0 bg-transparent outline-none font-bold text-sm dark:text-white truncate"
        />
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {showPreview && (
            <button 
              onClick={handlePreview}
              className="flex-1 min-w-0 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 px-3 py-4 rounded-2xl md:rounded-3xl shadow-sm font-black text-sm tracking-tight transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-2"
            >
              <Eye size={18} /> {t("Preview")}
            </button>
          )}
          
          <button 
            onClick={handleShare}
            className="flex-1 min-w-0 bg-rose-50 dark:bg-rose-900/20 text-rose-500 border border-rose-100 dark:border-rose-900/30 px-3 py-4 rounded-2xl md:rounded-3xl shadow-sm font-black text-sm tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Share2 size={18} /> {t("Share")}
          </button>
        </div>
        
        <button 
          onClick={handleDownload}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-black p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl font-black text-lg md:text-xl tracking-tight transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
        >
          <Download size={24} /> {isNative ? t("Save to Device") : t("Download")}
        </button>
      </div>

      <button 
        onClick={onStartOver}
        className="w-full mt-6 py-4 bg-gray-50 dark:bg-zinc-900 text-gray-400 hover:text-rose-500 dark:hover:text-rose-500 rounded-2xl border border-gray-100 dark:border-white/5 font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
      >
        <RotateCcw size={14} /> {t("Start New Session")}
      </button>
    </div>
  )
}