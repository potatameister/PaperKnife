import React, { useState, useRef, useEffect } from 'react'
import { Lock, Unlock, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { getPdfMetaData, unlockPdf, flattenPdf } from '../../utils/pdfHelpers'
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

  const [isLoadingFile, setIsLoadingFile] = useState(false)

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsLoadingFile(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 50)) // Allow UI to render loading state
      const meta = await getPdfMetaData(file)
      setPdfData({ file, thumbnail: meta.thumbnail, pageCount: meta.pageCount, isLocked: meta.isLocked })
      setCustomFileName(`${file.name.replace('.pdf', '')}-unlocked`)
      clearUrls(); setPassword('')
    } catch (e) {
      console.error('Error reading PDF:', e)
      toast.error('Failed to read PDF file.')
    } finally {
      setIsLoadingFile(false)
    }
  }

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
    if (e.target) e.target.value = ''
  }

  const performUnlock = async () => {
    if (!pdfData || (pdfData.isLocked && !password)) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const result = await unlockPdf(pdfData.file, password)
      
      if (!result.success) {
        if (result.error === 'PASSWORD') {
          throw new Error('Incorrect password.')
        } else {
          throw new Error('Reconstruction failed. The file may be too large or complex for this device.')
        }
      }
      
      let finalBytes: Uint8Array | undefined = result.pdfData;

      if (!result.isDecrypted) {
        // Standard encryption. Use pdf-lib to fast-decrypt the original file.
        const arrayBuffer = await pdfData.file.arrayBuffer();
        const libDoc = await PDFDocument.load(arrayBuffer, { password });
        finalBytes = await libDoc.save();
      }

      if (!finalBytes) throw new Error('Failed to generate unlocked file.')

      // Copy to fresh buffer for safety
      const safeFinalBytes = new Uint8Array(finalBytes.length);
      safeFinalBytes.set(finalBytes);
      
      const blob = new Blob([safeFinalBytes], { type: 'application/pdf' })
      const url = createUrl(blob)
      addActivity({ name: `${customFileName || 'unlocked'}.pdf`, tool: 'Unlock', size: blob.size, resultUrl: url, buffer: safeFinalBytes })
    } catch (error: any) { 
      console.error('Unlock error:', error)
      toast.error(error.message || 'An error occurred during unlocking.') 
    } finally { 
      setIsProcessing(false) 
    }
  }

  const ActionButton = () => (
    <button onClick={performUnlock} disabled={isProcessing || (pdfData?.isLocked && !password)} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <Unlock size={20} />} Unlock PDF
    </button>
  )

  return (
    <NativeToolLayout title="Unlock PDF" description="Remove passwords and restrictions permanently. Processed locally." actions={pdfData && !objectUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      {isLoadingFile ? (
        <div className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
          <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
          <h3 className="text-xl font-bold dark:text-white mb-2">Reading PDF...</h3>
          <p className="text-sm text-gray-400">This might take a moment for large files</p>
        </div>
      ) : !pdfData ? (
        <button 
          onClick={() => !isProcessing && fileInputRef.current?.click()} 
          className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Unlock size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select Locked PDF</h3>
          <p className="text-sm text-gray-400">Tap to browse files</p>
        </button>
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
              <SuccessState message="Encryption Removed!" downloadUrl={objectUrl} fileName={`${customFileName || 'unlocked'}.pdf`} onStartOver={() => { clearUrls(); setPassword(''); setPdfData(null); setIsProcessing(false); }} />
            )}
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}

