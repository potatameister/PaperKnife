import { useState, useRef } from 'react'
import { ArrowLeft, Download, Loader2, CheckCircle2, Moon, Sun, Zap, Heart, Shield, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'

import { Theme } from '../../types'
import { getPdfMetaData, loadPdfDocument } from '../../utils/pdfHelpers'
import { PaperKnifeLogo } from '../Logo'

type CompressPdfFile = {
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  pdfDoc?: any
}

type CompressionQuality = 'low' | 'medium' | 'high'

export default function CompressTool({ theme, toggleTheme }: { theme: Theme, toggleTheme: () => void }) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfData, setPdfData] = useState<CompressPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [quality, setQuality] = useState<CompressionQuality>('medium')
  const [resultSize, setResultSize] = useState<number | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-compressed')

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) {
        setPdfData({ file, pageCount: 0, isLocked: true })
        alert('This file is password protected. Please unlock it using the Split or Protect tool first.')
      } else {
        const pdfDoc = await loadPdfDocument(file)
        setPdfData({
          file,
          pageCount: meta.pageCount,
          isLocked: false,
          pdfDoc,
          thumbnail: meta.thumbnail
        })
        setCustomFileName(`${file.name.replace('.pdf', '')}-compressed`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
      setDownloadUrl(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
  }

  const compressPDF = async () => {
    if (!pdfData || !pdfData.pdfDoc) return
    setIsProcessing(true)
    setProgress(0)
    
    // Yield to UI
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const newPdf = await PDFDocument.create()
      
      // Settings based on quality
      // We render at different scales and JPEG qualities
      const scaleMap = { low: 1.0, medium: 1.5, high: 2.0 }
      const qualityMap = { low: 0.3, medium: 0.5, high: 0.7 }
      
      const scale = scaleMap[quality]
      const jpegQuality = qualityMap[quality]

      for (let i = 1; i <= pdfData.pageCount; i++) {
        const page = await pdfData.pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) continue
        
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        await page.render({ canvasContext: context, viewport, canvas: canvas as any }).promise
        
        const imgData = canvas.toDataURL('image/jpeg', jpegQuality)
        const imgBytes = await fetch(imgData).then(res => res.arrayBuffer())
        
        const pdfImg = await newPdf.embedJpg(imgBytes)
        const pdfPage = newPdf.addPage([viewport.width, viewport.height])
        pdfPage.drawImage(pdfImg, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        })
        
        setProgress(Math.round((i / pdfData.pageCount) * 100))
      }

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      setResultSize(blob.size)
      setDownloadUrl(URL.createObjectURL(blob))

    } catch (error: any) {
      console.error('Compress Error:', error)
      alert(`Compression failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-gray-900 dark:text-zinc-100 font-sans animate-slide-in relative transition-colors duration-300 ease-out">
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-500 hover:text-rose-500 mr-1"><ArrowLeft size={20} /></button>
            <PaperKnifeLogo size={28} />
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white hidden sm:block">PaperKnife</h1>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="font-black text-sm uppercase tracking-widest text-rose-500 hidden md:block">Compress PDF</h1>
            <button onClick={toggleTheme} className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:border-rose-500 transition-all active:scale-95">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 dark:text-white">File <span className="text-rose-500">Shrinker.</span></h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400">Optimize and compress your PDFs for easy sharing. <br className="hidden md:block"/>Everything stays on your device.</p>
        </div>

        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

        {!pdfData ? (
          <div onClick={() => !isProcessing && fileInputRef.current?.click()} className={`border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-10 md:p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}>
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 size={48} className="text-rose-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold mb-2">Analyzing PDF...</h3>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Zap size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Select PDF</h3>
                <p className="text-xs md:text-sm text-gray-400 dark:text-zinc-500">Tap to start compressing</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* File Info */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-6">
              <div className="w-20 h-28 bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700">
                {pdfData.thumbnail ? <img src={pdfData.thumbnail} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-rose-500"><Shield size={24} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate dark:text-white">{pdfData.file.name}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button onClick={() => setPdfData(null)} className="mt-2 text-xs font-black uppercase text-rose-500 hover:text-rose-600 transition-colors">Change File</button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
              {!downloadUrl ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><Zap size={12} /> Compression Level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['low', 'medium', 'high'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setQuality(lvl)}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${quality === lvl ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-800'}`}
                        >
                          <span className={`font-black uppercase text-[10px] ${quality === lvl ? 'text-rose-500' : 'text-gray-400'}`}>{lvl}</span>
                          <span className="text-[8px] text-gray-400 font-bold">{lvl === 'low' ? 'Max Shrink' : lvl === 'medium' ? 'Balanced' : 'High Quality'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex items-start gap-3">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] md:text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      <strong>Note:</strong> To achieve maximum compression, text may be converted to images. This makes the file much smaller but prevents text selection.
                    </p>
                  </div>

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

                  <div className="space-y-4">
                    {isProcessing && (
                      <div className="space-y-3">
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[10px] text-center font-black uppercase text-gray-400 tracking-widest animate-pulse">Compressing... {progress}%</p>
                      </div>
                    )}
                    <button 
                      onClick={compressPDF}
                      disabled={isProcessing}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : <Zap />}
                      Compress PDF
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
                   <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border border-green-100 dark:border-green-900/30">
                      <CheckCircle2 size={20} /> Success! Optimization Complete.
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <span className="block text-[10px] font-black uppercase text-gray-400 mb-1">Original</span>
                        <span className="font-bold">{(pdfData.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                      <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                        <span className="block text-[10px] font-black uppercase text-rose-500 mb-1">Compressed</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">{(resultSize! / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => window.open(downloadUrl, '_blank')}
                        className="flex-1 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95"
                      >
                        Preview
                      </button>
                      <a 
                        href={downloadUrl} 
                        download={`${customFileName || 'compressed'}.pdf`}
                        className="flex-[2] bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all shadow-xl"
                      >
                        <Download size={24} /> Download PDF
                      </a>
                   </div>
                  
                  <button onClick={() => { setDownloadUrl(null); setProgress(0); }} className="w-full py-2 text-xs font-black uppercase text-gray-400 hover:text-rose-500 tracking-[0.2em]">Compress Again</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Secure Client-Side Processing
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
