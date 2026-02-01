import { useState, useRef } from 'react'
import { Download, Loader2, CheckCircle2, Hash, Lock, Eye, Settings, Layout } from 'lucide-react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'

type PageNumberPdfData = {
  file: File
  pageCount: number
  isLocked: boolean
  password?: string
}

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export default function PageNumberTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfData, setPdfData] = useState<PageNumberPdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const customFileName = 'paperknife-numbered'
  const [unlockPassword, setUnlockPassword] = useState('')
  
  // Settings
  const [format, setFormat] = useState('Page {n} of {total}')
  const [position, setPosition] = useState<Position>('bottom-center')
  const [startFrom, setStartFrom] = useState(1)
  const [fontSize, setFontSize] = useState(10)
  const [color, setColor] = useState('#6B7280') // Gray 500

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({
        ...pdfData,
        isLocked: false,
        pageCount: result.pageCount,
        password: unlockPassword
      })
    } else {
      alert('Incorrect password')
    }
    setIsProcessing(false)
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      setPdfData({
        file,
        pageCount: meta.pageCount,
        isLocked: meta.isLocked
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
      setDownloadUrl(null)
    }
  }

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return rgb(r, g, b)
  }

  const applyPageNumbers = async () => {
    if (!pdfData) return
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        password: pdfData.password || undefined,
        ignoreEncryption: true
      } as any)

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const pages = pdfDoc.getPages()
      const textColor = hexToRgb(color)

      pages.forEach((page, idx) => {
        const { width, height } = page.getSize()
        const n = idx + startFrom
        const total = pages.length + (startFrom - 1)
        const label = format.replace('{n}', n.toString()).replace('{total}', total.toString())
        
        const textWidth = font.widthOfTextAtSize(label, fontSize)
        const margin = 30

        let x = width / 2 - textWidth / 2
        let y = margin

        if (position.includes('left')) x = margin
        if (position.includes('right')) x = width - textWidth - margin
        if (position.includes('top')) y = height - margin - fontSize

        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font: font,
          color: textColor,
        })
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      addActivity({
        name: `${customFileName}.pdf`,
        tool: 'Page Numbers',
        size: blob.size,
        resultUrl: url
      })
    } catch (error: any) {
      alert(`Error adding page numbers: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1">
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 dark:text-white">Page <span className="text-rose-500">Numbers.</span></h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400">Add custom numbering to your PDF pages automatically. <br className="hidden md:block"/>Everything stays on your device.</p>
        </div>

        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

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
                  <Hash size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Select PDF</h3>
                <p className="text-xs md:text-sm text-gray-400 dark:text-zinc-500">Tap to start numbering</p>
              </>
            )}
          </div>
        ) : pdfData.isLocked ? (
          <div className="max-w-md mx-auto animate-in fade-in duration-500">
             <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">File is Protected</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">Unlock this file to add page numbers.</p>
              
              <div className="space-y-4">
                <input 
                  type="password" 
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-center transition-all"
                  autoFocus
                />
                <button 
                  onClick={handleUnlock}
                  disabled={!unlockPassword || isProcessing}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? 'Unlocking...' : 'Unlock PDF'}
                </button>
                <button 
                  onClick={() => setPdfData(null)}
                  className="w-full py-2 text-xs font-bold text-gray-400 hover:text-rose-500"
                >
                  Choose different file
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* File Info */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-6">
              <div className="w-20 h-28 bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-rose-500">
                <Hash size={32} />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Settings size={12} /> Label Format</label>
                        <input 
                          type="text" 
                          value={format}
                          onChange={(e) => setFormat(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold"
                          placeholder="Page {n} of {total}"
                        />
                        <p className="text-[10px] text-gray-400 mt-2 font-medium italic">Use {"{n}"} for current page and {"{total}"} for total pages.</p>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Layout size={12} /> Position</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position[]).map((pos) => (
                            <button
                              key={pos}
                              onClick={() => setPosition(pos)}
                              className={`py-2 px-1 rounded-xl text-[8px] font-black uppercase transition-all border ${position === pos ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-gray-50 dark:bg-black text-gray-400 border-gray-100 dark:border-zinc-800'}`}
                            >
                              {pos.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Font Size</label>
                          <input 
                            type="number" 
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Start From</label>
                          <input 
                            type="number" 
                            value={startFrom}
                            onChange={(e) => setStartFrom(parseInt(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Color</label>
                        <input 
                          type="color" 
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="h-12 w-full bg-transparent border-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={applyPageNumbers}
                    disabled={isProcessing}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Hash />}
                    Add Page Numbers
                  </button>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border border-green-100 dark:border-green-900/30">
                      <CheckCircle2 size={20} /> Success! Numbers added.
                   </div>
                   
                   <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => window.open(downloadUrl, '_blank')}
                        className="flex-1 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
                      >
                        <Eye size={20} /> Preview
                      </button>
                      
                      <a 
                        href={downloadUrl} 
                        download={`${customFileName}.pdf`}
                        className="flex-[2] bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all shadow-xl"
                      >
                        <Download size={24} /> Download PDF
                      </a>
                   </div>
                  
                  <button onClick={() => { setDownloadUrl(null); }} className="w-full py-2 text-xs font-black uppercase text-gray-400 hover:text-rose-500 tracking-[0.2em]">Add to Another</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          100% Client-Side Processing
        </div>
      </main>
    </div>
  )
}