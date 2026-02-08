import { useState, useRef, useEffect } from 'react'
import { Info, Lock, Edit3, Loader2, Sparkles, X } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type MetadataPdfData = {
  file: File
  pageCount: number
  isLocked: boolean
  password?: string
  currentMeta: { title?: string, author?: string, subject?: string, keywords?: string, creator?: string, producer?: string }
}

export default function MetadataTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<MetadataPdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-metadata')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [isDeepCleaning, setIsDeepCleaning] = useState(false)
  const [meta, setMeta] = useState({ 
    title: '', 
    author: localStorage.getItem('defaultAuthor') || '', 
    subject: '', 
    keywords: '', 
    creator: localStorage.getItem('defaultAuthor') || 'PaperKnife', 
    producer: localStorage.getItem('defaultAuthor') || 'PaperKnife' 
  })

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
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: unlockPassword } as any)
      const currentMeta = { title: pdfDoc.getTitle() || '', author: pdfDoc.getAuthor() || '', subject: pdfDoc.getSubject() || '', keywords: pdfDoc.getKeywords() || '', creator: pdfDoc.getCreator() || '', producer: pdfDoc.getProducer() || '' }
      setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, password: unlockPassword, currentMeta })
      setMeta(currentMeta)
    } else { toast.error('Incorrect password') }
    setIsProcessing(false)
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const metaRes = await getPdfMetaData(file); let currentMeta = { title: '', author: '', subject: '', keywords: '', creator: '', producer: '' }
      if (!metaRes.isLocked) {
        const arrayBuffer = await file.arrayBuffer(); const pdfDoc = await PDFDocument.load(arrayBuffer)
        currentMeta = { title: pdfDoc.getTitle() || '', author: pdfDoc.getAuthor() || '', subject: pdfDoc.getSubject() || '', keywords: pdfDoc.getKeywords() || '', creator: pdfDoc.getCreator() || '', producer: pdfDoc.getProducer() || '' }
      }
      setPdfData({ file, pageCount: metaRes.pageCount, isLocked: metaRes.isLocked, currentMeta })
      setMeta(currentMeta); setCustomFileName(`${file.name.replace('.pdf', '')}-metadata`)
    } catch (err) { console.error(err) } finally { setIsProcessing(false); setDownloadUrl(null) }
  }

  const saveMetadata = async (deepClean = false) => {
    if (!pdfData) return
    setIsProcessing(true); if (deepClean) setIsDeepCleaning(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const sourcePdf = await PDFDocument.load(arrayBuffer, { password: pdfData.password || undefined, ignoreEncryption: true } as any)
      let targetPdf: PDFDocument
      if (deepClean) {
        targetPdf = await PDFDocument.create()
        const copiedPages = await targetPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
        copiedPages.forEach(page => targetPdf.addPage(page))
      } else { targetPdf = sourcePdf }
      targetPdf.setTitle(meta.title); targetPdf.setAuthor(meta.author); targetPdf.setSubject(meta.subject)
      targetPdf.setKeywords(meta.keywords.split(',').map(k => k.trim()))
      targetPdf.setCreator(meta.creator || 'PaperKnife'); targetPdf.setProducer(meta.producer || 'PaperKnife')
      const pdfBytes = await targetPdf.save(); const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob); setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Metadata', size: blob.size, resultUrl: url })
    } catch (error: any) { toast.error(`Error: ${error.message}`) } finally { setIsProcessing(false); setIsDeepCleaning(false) }
  }

  const ActionButtons = () => (
    <div className="flex flex-col gap-2">
       <button onClick={() => saveMetadata(false)} disabled={isProcessing} className={`w-full bg-rose-500 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}>
         {isProcessing && !isDeepCleaning ? <Loader2 className="animate-spin" /> : <Edit3 size={18} />} Update Metadata
       </button>
       <button onClick={() => saveMetadata(true)} disabled={isProcessing} className={`w-full bg-emerald-500 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20`}>
         {isDeepCleaning ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} Privacy Deep Clean
       </button>
    </div>
  )

  return (
    <NativeToolLayout title="Metadata Editor" description="Edit or wipe document properties for better privacy." actions={pdfData && !pdfData.isLocked && !downloadUrl && <ActionButtons />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {!pdfData ? (
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Edit3 size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400">Tap to start editing metadata</p>
        </div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto relative z-[100]">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">File Protected</h3>
            <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4 dark:text-white" />
            <button onClick={handleUnlock} disabled={!unlockPassword || isProcessing} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase text-xs">Unlock</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0"><Info size={24} /></div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p>
            </div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-6 shadow-sm">
            {!downloadUrl ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['title', 'author', 'subject', 'keywords', 'creator', 'producer'].map(field => (
                  <div key={field}>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest px-1">{field}</label>
                    <input type="text" value={(meta as any)[field]} onChange={(e) => setMeta({...meta, [field]: e.target.value})} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                  </div>
                ))}
              </div>
            ) : (
              <SuccessState message={isDeepCleaning ? "Deep Clean Successful!" : "Metadata Updated!"} downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setDownloadUrl(null); setPdfData(null); }} />
            )}
            <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
