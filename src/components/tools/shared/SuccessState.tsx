import { Download, Eye, CheckCircle2, ArrowRight, Zap, Shield, Scissors, Tags, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { usePipeline } from '../../../utils/pipelineContext'
import { toast } from 'sonner'
import { downloadFile, shareFile } from '../../../utils/pdfHelpers'
import { Capacitor } from '@capacitor/core'
import { hapticSuccess } from '../../../utils/haptics'

interface SuccessStateProps {
  message: string
  downloadUrl: string
  fileName: string
  onStartOver: () => void
  showPreview?: boolean
}

export default function SuccessState({ message, downloadUrl, fileName, onStartOver, showPreview = true }: SuccessStateProps) {
  const navigate = useNavigate()
  const { setPipelineFile } = usePipeline()
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    hapticSuccess()
  }, [])

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      toast.loading('Saving file...', { id: 'save-action' })
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      
      await downloadFile(new Uint8Array(buffer), fileName, 'application/pdf')
      toast.success(isNative ? 'File saved to Documents' : 'Download started', { id: 'save-action' })
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

  const pipelineActions = [
    { name: 'Compress', icon: Zap, path: '/compress', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Protect', icon: Shield, path: '/protect', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Split', icon: Scissors, path: '/split', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { name: 'Metadata', icon: Tags, path: '/metadata', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ]

  const handlePipelineClick = async (action: typeof pipelineActions[0]) => {
    try {
      toast.loading(`Preparing ${fileName} for ${action.name}...`, { id: 'pipeline-load' })
      
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      
      setPipelineFile({
        buffer: new Uint8Array(buffer),
        name: fileName
      })
      
      toast.success(`Sent to ${action.name}`, { id: 'pipeline-load' })
      navigate(action.path)
    } catch (error) {
      console.error('Pipeline error:', error)
      toast.error('Failed to pipeline file.', { id: 'pipeline-load' })
    }
  }

  return (
    <div className="animate-in slide-in-from-bottom duration-500 fade-in space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 md:p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm border border-green-100 dark:border-green-900/30">
        <CheckCircle2 size={16} /> {message}
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {showPreview && (
            <button 
              onClick={() => window.open(downloadUrl, '_blank')}
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

      <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
          <ArrowRight size={12} /> Next Step (Pipeline)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pipelineActions.map((action) => (
            <button
              key={action.name}
              onClick={() => handlePipelineClick(action)}
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-rose-500 transition-all group"
            >
              <div className={`p-2 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter dark:text-zinc-300">{action.name}</span>
            </button>
          ))}
        </div>
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
