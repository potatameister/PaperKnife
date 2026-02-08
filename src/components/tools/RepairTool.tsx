import { useState, useRef, useEffect } from 'react'
import { Loader2, ShieldAlert, Upload, X, FileCheck } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'

import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

export default function RepairTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [customFileName, setCustomFileName] = useState('')

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setOriginalFile(file)
    setCustomFileName(`repaired-${file.name.replace('.pdf', '')}`)
    setDownloadUrl(null)
  }

  const startRepair = async () => {
    if (!originalFile) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await originalFile.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { 
        ignoreEncryption: true, 
        throwOnInvalidObject: false 
      } as any)
      
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Repair', size: blob.size, resultUrl: url })
      toast.success('PDF rebuilt successfully!')
    } catch (error: any) { 
      toast.error(`Repair failed: ${error.message}`) 
    } finally { 
      setIsProcessing(false) 
    }
  }

  const ActionButton = () => (
    <button onClick={startRepair} disabled={isProcessing} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20">
      {isProcessing ? <Loader2 className="animate-spin" /> : <FileCheck size={20} />} Attempt Repair
    </button>
  )

  return (
    <NativeToolLayout title="Repair PDF" description="Fix corrupted or unreadable PDF files by rebuilding structure." actions={originalFile && !downloadUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {!originalFile ? (
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Upload size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select Corrupted PDF</h3>
          <p className="text-sm text-gray-400">Tap to browse local files</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0"><ShieldAlert size={24} /></div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-bold text-sm truncate dark:text-white">{originalFile.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black">{(originalFile.size / (1024*1024)).toFixed(2)} MB</p>
            </div>
            <button onClick={() => setOriginalFile(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
            {!downloadUrl ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Output Filename</label>
                  <input 
                    type="text" 
                    value={customFileName} 
                    onChange={(e) => setCustomFileName(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" 
                  />
                </div>
              </div>
            ) : (
              <SuccessState message="Reconstruction Complete!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setDownloadUrl(null); setOriginalFile(null); }} showPreview={true} />
            )}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-white/5 flex items-start gap-4">
        <ShieldAlert className="text-amber-500 shrink-0" size={20} />
        <div className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed text-left">
          <p className="font-black mb-1 uppercase tracking-widest text-[10px]">Technical Protocol:</p>
          PaperKnife rebuilds the internal cross-reference table and regenerates the file structure from scratch. This can restore access to many files that "cannot be opened."
        </div>
      </div>
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
