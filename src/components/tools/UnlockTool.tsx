import { useState, useRef } from 'react'
import { ArrowLeft, Download, Loader2, CheckCircle2, Moon, Sun, Lock, Unlock, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'

import { Theme } from '../../types'
import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { PaperKnifeLogo } from '../Logo'

type UnlockPdfFile = {
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  password?: string
  pdfDoc?: any
}

export default function UnlockTool({ theme, toggleTheme }: { theme: Theme, toggleTheme: () => void }) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfData, setPdfData] = useState<UnlockPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
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
    setDownloadUrl(null)
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
        password: password,
        ignoreEncryption: false 
      } as any)

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      setDownloadUrl(URL.createObjectURL(blob))

    } catch (error: any) {
      alert(error.message || 'Error unlocking PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-gray-900 dark:text-zinc-100 font-sans animate-slide-in relative transition-colors duration-300 ease-out">
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-500 hover:text-rose-500 mr-1"><ArrowLeft size={20} /></button>
            <PaperKnifeLogo size={28} />
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white hidden sm:block">PaperKnife</h1>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="font-black text-sm uppercase tracking-widest text-rose-500 hidden md:block">Unlock PDF</h1>
            <button onClick={toggleTheme} className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:border-rose-500 transition-all active:scale-95">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 dark:text-white">Restriction <span className="text-rose-500">Remover.</span></h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400">Remove passwords and restrictions from your PDFs permanently. <br className="hidden md:block"/>Everything stays on your device.</p>
        </div>

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
              {!downloadUrl ? (
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
                   <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border border-green-100 dark:border-green-900/30">
                      <CheckCircle2 size={20} /> Success! Restrictions removed.
                   </div>
                   
                   <a 
                    href={downloadUrl} 
                    download={`${customFileName || 'unlocked'}.pdf`}
                    className="w-full bg-gray-900 dark:bg-white text-white dark:text-black p-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all shadow-xl"
                   >
                    <Download size={24} /> Download Unlocked PDF
                  </a>
                  
                  <button onClick={() => { setDownloadUrl(null); setPassword(''); }} className="w-full py-2 text-xs font-black uppercase text-gray-400 hover:text-rose-500 tracking-[0.2em]">Unlock Another</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          100% Client-Side Decryption
        </div>
      </main>

      <footer className="py-12 border-t border-gray-100 dark:border-zinc-900 mt-20">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-600">
          <p>© 2026 PaperKnife</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/sponsors/potatameister" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-colors">
              <Heart size={12} fill="currentColor" /> Sponsor
            </a>
            <span className="hidden md:block text-gray-200 dark:text-zinc-800">|</span>
            <p>Built with ❤️ by <a href="https://github.com/potatameister" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">potatameister</a></p>
            <span className="hidden md:block text-gray-200 dark:text-zinc-800">|</span>
            <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
