import { useState, useRef } from 'react'
import { Lock, Unlock, Loader2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { useObjectURL } from '../../utils/useObjectURL'
import ToolHeader from './shared/ToolHeader'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'

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
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [pdfData, setPdfData] = useState<UnlockPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [password, setPassword] = useState('')
  const [customFileName, setCustomFileName] = useState('paperknife-unlocked')

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    const meta = await getPdfMetaData(file)
    setPdfData({
      file,
      thumbnail: meta.thumbnail,
      pageCount: meta.pageCount,
      isLocked: meta.isLocked
    })
    setCustomFileName(`${file.name.replace('.pdf', '')}-unlocked`)
    clearUrls()
    setPassword('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const performUnlock = async () => {
    if (!pdfData || (pdfData.isLocked && !password)) return

    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const result = await unlockPdf(pdfData.file, password)
      if (!result.success) throw new Error('Incorrect password.')

      const arrayBuffer = await pdfData.file.arrayBuffer()
      // Load with password and explicitly decrypt
      const pdfDoc = await PDFDocument.load(arrayBuffer, { 
        password: password || undefined,
        ignoreEncryption: true 
      } as any)

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = createUrl(blob)

      addActivity({
        name: `${customFileName || 'unlocked'}.pdf`,
        tool: 'Unlock',
        size: blob.size,
        resultUrl: url
      })
    } catch (error: any) {
      toast.error(error.message || 'Error unlocking PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1">
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <ToolHeader 
          title="Restriction" 
          highlight="Remover" 
          description="Remove passwords and restrictions from your PDFs permanently. Everything stays on your device." 
        />

        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

        {!pdfData ? (
          <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-10 md:p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
              <Unlock size={32} />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Select Locked PDF</h3>
            <p className="text-xs md:text-sm text-gray-400 dark:text-zinc-500">Tap to browse your files</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* File Header */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-6">
              <div className="w-20 h-28 bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 text-rose-500">
                {pdfData.thumbnail ? <img src={pdfData.thumbnail} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Lock size={24} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate dark:text-white">{pdfData.file.name}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{pdfData.isLocked ? 'Password Protected' : `${pdfData.pageCount} Pages • ${(pdfData.file.size / (1024 * 1024)).toFixed(2)} MB`}</p>
                <button onClick={() => setPdfData(null)} className="mt-2 text-xs font-black uppercase text-rose-500 hover:text-rose-600 transition-colors">Change File</button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
              {!objectUrl ? (
                <>
                  {pdfData.isLocked ? (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Enter Current Password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold transition-all text-center text-xl"
                        placeholder="••••••••"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20 text-center">
                      <p className="text-green-600 dark:text-green-400 font-bold text-sm">This file is already unlocked!</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Output Filename</label>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus-within:border-rose-500 transition-colors">
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
                    onClick={performUnlock}
                    disabled={isProcessing || (pdfData.isLocked && !password)}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Unlock />}
                    Remove Protections
                  </button>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <SuccessState 
                    message="Success! Restrictions removed."
                    downloadUrl={objectUrl || ''}
                    fileName={`${customFileName || 'unlocked'}.pdf`}
                    onStartOver={() => { clearUrls(); setPassword(''); }}
                   />
                </div>
              )}
            </div>
          </div>
        )}

        <PrivacyBadge />
      </main>
    </div>
  )
}
