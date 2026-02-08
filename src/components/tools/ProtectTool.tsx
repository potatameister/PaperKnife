import { useState, useRef, useEffect } from 'react'
import { Lock, ShieldCheck, Loader2, ArrowRight, X } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite'
import { toast } from 'sonner'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type ProtectPdfFile = {
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  sourcePassword?: string
}

export default function ProtectTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [pdfData, setPdfData] = useState<ProtectPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [customFileName, setCustomFileName] = useState('paperknife-protected')

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({ ...pdfData, isLocked: false, thumbnail: result.thumbnail, pageCount: result.pageCount, sourcePassword: unlockPassword })
      setCustomFileName(`${pdfData.file.name.replace('.pdf', '')}-protected`)
    } else { toast.error('Incorrect password') }
    setIsProcessing(false)
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    const meta = await getPdfMetaData(file)
    setPdfData({ file, thumbnail: meta.thumbnail, pageCount: meta.pageCount, isLocked: meta.isLocked })
    setCustomFileName(`${file.name.replace('.pdf', '')}-protected`)
    clearUrls()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const protectPDF = async () => {
    if (!pdfData || !password || password !== confirmPassword) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const sourcePdf = await PDFDocument.load(arrayBuffer, { password: pdfData.sourcePassword || undefined, ignoreEncryption: true } as any)
      const newPdf = await PDFDocument.create()
      const pages = await newPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
      pages.forEach(page => newPdf.addPage(page))
      const pdfBytes = await newPdf.save()
      const encryptedBytes = await encryptPDF(pdfBytes, password)
      const blob = new Blob([encryptedBytes as any], { type: 'application/pdf' })
      const url = createUrl(blob)
      addActivity({ name: `${customFileName || 'protected'}.pdf`, tool: 'Protect', size: blob.size, resultUrl: url })
    } catch (error: any) { toast.error(`Failed: ${error.message}`) } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={protectPDF} disabled={isProcessing || !password || password !== confirmPassword} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <><Loader2 className="animate-spin" /> Securing...</> : <>Encrypt & Save <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="Protect PDF" description="Add strong encryption to your documents. Processed locally." actions={pdfData && !pdfData.isLocked && !objectUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      {!pdfData ? (
        <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><ShieldCheck size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400">Tap to browse files</p>
        </div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Protected File</h3>
            <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="Current Password" className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4" />
            <button onClick={handleUnlock} disabled={!unlockPassword || isProcessing} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs">{isProcessing ? '...' : 'Unlock'}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500">{pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <Lock size={20} />}</div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p></div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>
                    <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-white/5 space-y-6 shadow-sm">
            {!objectUrl ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest px-1">New Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" placeholder="••••••••" /></div>
                  <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest px-1">Confirm Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" placeholder="••••••••" /></div>
                </div>
                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest px-1">Output Filename</label><input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" /></div>
              </div>
            ) : (
              <SuccessState message="Encrypted Successfully" downloadUrl={objectUrl} fileName={`${customFileName || 'protected'}.pdf`} onStartOver={() => { clearUrls(); setPassword(''); setConfirmPassword(''); setPdfData(null); }} />
            )}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-white/5 flex items-start gap-3"><Lock size={14} className="text-amber-500 shrink-0 mt-0.5" /><p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">PaperKnife cannot recover forgotten passwords. Save it securely.</p></div>
            <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
          