import { useState, useRef, useEffect } from 'react'
import { Lock, Unlock, Loader2, X } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type UnlockPdfFile = {
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  password?: string
  pdfDoc?: any
}

export default function UnlockTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [pdfData, setPdfData] = useState<UnlockPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [password, setPassword] = useState('')
  const [customFileName, setCustomFileName] = useState('paperknife-unlocked')

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    const meta = await getPdfMetaData(file)
    setPdfData({ file, thumbnail: meta.thumbnail, pageCount: meta.pageCount, isLocked: meta.isLocked })
    setCustomFileName(`${file.name.replace('.pdf', '')}-unlocked`)
    clearUrls(); setPassword('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const performUnlock = async () => {
    if (!pdfData || (pdfData.isLocked && !password)) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const result = await unlockPdf(pdfData.file, password)
      if (!result.success) throw new Error('Incorrect password.')
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: password || undefined, ignoreEncryption: true } as any)
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = createUrl(blob)
      addActivity({ name: `${customFileName || 'unlocked'}.pdf`, tool: 'Unlock', size: blob.size, resultUrl: url })
    } catch (error: any) { toast.error(error.message || 'Error.') } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={performUnlock} disabled={isProcessing || (pdfData?.isLocked && !password)} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <Unlock size={20} />} Unlock PDF
    </button>
  )

  return (
    <NativeToolLayout title="Unlock PDF" description="Remove passwords and restrictions permanently. Processed locally." actions={pdfData && !objectUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      {!pdfData ? (
        <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Unlock size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select Locked PDF</h3>
          <p className="text-sm text-gray-400">Tap to browse files</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">{pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <Lock size={20} />}</div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black">{pdfData.isLocked ? 'Encrypted Document' : 'Open Document'}</p>
            </div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-6 shadow-sm">
            {!objectUrl ? (
              <div className="space-y-6">
                {pdfData.isLocked ? (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Master Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-lg text-center dark:text-white" placeholder="••••••••" autoFocus />
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 text-center"><p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">File is already unlocked!</p></div>
                )}
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Output Filename</label>
                  <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                </div>
              </div>
            ) : (
              <SuccessState message="Encryption Removed!" downloadUrl={objectUrl} fileName={`${customFileName || 'unlocked'}.pdf`} onStartOver={() => { clearUrls(); setPassword(''); setPdfData(null); }} />
            )}
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
