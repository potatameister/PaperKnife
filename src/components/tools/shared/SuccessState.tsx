import { Download, Eye, CheckCircle2 } from 'lucide-react'

interface SuccessStateProps {
  message: string
  downloadUrl: string
  fileName: string
  onStartOver: () => void
  showPreview?: boolean
}

export default function SuccessState({ message, downloadUrl, fileName, onStartOver, showPreview = true }: SuccessStateProps) {
  return (
    <div className="animate-in slide-in-from-bottom duration-500 fade-in space-y-4">
      <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 md:p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm border border-green-100 dark:border-green-900/30">
        <CheckCircle2 size={16} /> {message}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {showPreview && (
          <button 
            onClick={() => window.open(downloadUrl, '_blank')}
            className="flex-1 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm font-black text-lg md:text-xl tracking-tight transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-3"
          >
            <Eye size={24} /> Preview
          </button>
        )}
        
        <a 
          href={downloadUrl}
          download={fileName}
          className={`flex-[2] bg-gray-900 dark:bg-white text-white dark:text-black p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl font-black text-lg md:text-xl tracking-tight transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 ${!showPreview ? 'w-full' : ''}`}
        >
          <Download size={24} /> Download
        </a>
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
