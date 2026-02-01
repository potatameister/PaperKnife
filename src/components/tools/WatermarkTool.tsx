import { useState, useRef } from 'react'
import { Download, Loader2, CheckCircle2, Type, Lock, Eye, Settings, Sliders } from 'lucide-react'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'

type WatermarkPdfData = {
  file: File
  pageCount: number
  isLocked: boolean
  password?: string
}

export default function WatermarkTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfData, setPdfData] = useState<WatermarkPdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-watermarked')
  const [unlockPassword, setUnlockPassword] = useState('')
  
  // Watermark Settings
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.3)
  const [fontSize, setFontSize] = useState(50)
  const [rotation, setRotation] = useState(-45)
  const [color, setColor] = useState('#F43F5E') // Rose 500

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
      setCustomFileName(`${pdfData.file.name.replace('.pdf', '')}-watermarked`)
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
      setCustomFileName(`${file.name.replace('.pdf', '')}-watermarked`)
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

  const applyWatermark = async () => {
    if (!pdfData) return
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        password: pdfData.password || undefined,
        ignoreEncryption: true
      } as any)

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const pages = pdfDoc.getPages()
      const watermarkColor = hexToRgb(color)

      pages.forEach(page => {
        const { width, height } = page.getSize()
        page.drawText(text, {
          x: width / 2 - (text.length * fontSize) / 4,
          y: height / 2,
          size: fontSize,
          font: font,
          color: watermarkColor,
          opacity: opacity,
          rotate: degrees(rotation),
        })
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      addActivity({
        name: `${customFileName}.pdf`,
        tool: 'Watermark',
        size: blob.size,
        resultUrl: url
      })
    } catch (error: any) {
      alert(`Error applying watermark: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1">
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 dark:text-white">Watermark <span className="text-rose-500">PDF.</span></h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400">Add secure text overlays to your documents. <br className="hidden md:block"/>Processed locally.</p>
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
                  <Type size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Select PDF</h3>
                <p className="text-xs md:text-sm text-gray-400 dark:text-zinc-500">Tap to start watermarking</p>
              </>
            )}
          </div>
        ) : pdfData.isLocked ? (
          <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">File is Protected</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">Unlock this file to add a watermark.</p>
              
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* File Info */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-6">
              <div className="w-20 h-28 bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-rose-500">
                <Type size={32} />
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
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Settings size={12} /> Watermark Text</label>
                        <input 
                          type="text" 
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2"><Sliders size={12} /> Opacity ({Math.round(opacity * 100)}%)</label>
                        <input 
                          type="range" min="0.1" max="1" step="0.1"
                          value={opacity}
                          onChange={(e) => setOpacity(parseFloat(e.target.value))}
                          className="w-full accent-rose-500"
                        />
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
                            className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Rotation</label>
                          <input 
                            type="number" 
                            value={rotation}
                            onChange={(e) => setRotation(parseInt(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Color</label>
                        <div className="flex gap-2">
                           <input 
                            type="color" 
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-12 w-20 bg-transparent border-none cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={color.toUpperCase()}
                            onChange={(e) => setColor(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-mono text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
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

                  <button 
                    onClick={applyWatermark}
                    disabled={isProcessing || !text}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Type />}
                    Apply Watermark
                  </button>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border border-green-100 dark:border-green-900/30">
                      <CheckCircle2 size={20} /> Success! Watermark applied.
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
                  
                  <button onClick={() => { setDownloadUrl(null); }} className="w-full py-2 text-xs font-black uppercase text-gray-400 hover:text-rose-500 tracking-[0.2em]">Watermark Another</button>
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