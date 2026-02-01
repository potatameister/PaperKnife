import { useState, useRef } from 'react'
import { Download, Loader2, Lock, MousePointer2, Image as ImageIcon, Trash2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import ToolHeader from './shared/ToolHeader'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'

type SignaturePdfData = {
  file: File
  pageCount: number
  isLocked: boolean
  pdfDoc?: any
  password?: string
}

export default function SignatureTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)
  
  const [pdfData, setPdfData] = useState<SignaturePdfData | null>(null)
  const [signatureImg, setSignatureImg] = useState<string | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const customFileName = 'paperknife-signed'
  const [unlockPassword, setUnlockPassword] = useState('')
  
  // Placement State
  const [activePage, setActivePage] = useState(1)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [size, setSize] = useState(150)
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({
        ...pdfData,
        isLocked: false,
        pageCount: result.pageCount,
        pdfDoc: result.pdfDoc,
        password: unlockPassword
      })
      updateThumbnail(result.pdfDoc, 1)
    } else {
      toast.error('Incorrect password')
    }
    setIsProcessing(false)
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) {
        setPdfData({ file, pageCount: 0, isLocked: true })
      } else {
        const pdfDoc = await loadPdfDocument(file)
        setPdfData({
          file,
          pageCount: meta.pageCount,
          isLocked: false,
          pdfDoc
        })
        updateThumbnail(pdfDoc, 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const updateThumbnail = async (pdf: any, pageNum: number) => {
    const thumb = await renderPageThumbnail(pdf, pageNum)
    setThumbnail(thumb)
  }

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSignatureFile(file)
      setSignatureImg(URL.createObjectURL(file))
    } else {
      toast.error('Please upload a transparent PNG signature')
    }
  }

  const saveSignedPdf = async () => {
    if (!pdfData || !signatureFile) return
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        password: pdfData.password || undefined,
        ignoreEncryption: true
      } as any)

      const sigBytes = await signatureFile.arrayBuffer()
      let sigImage
      if (signatureFile.type === 'image/png') {
        sigImage = await pdfDoc.embedPng(sigBytes)
      } else {
        sigImage = await pdfDoc.embedJpg(sigBytes)
      }

      const pages = pdfDoc.getPages()
      const page = pages[activePage - 1]
      const { width, height } = page.getSize()

      // Convert percentage positions to PDF coordinates
      // Note: PDF y-axis starts from bottom
      const pdfX = (pos.x / 100) * width
      const pdfY = height - ((pos.y / 100) * height) - (size * (sigImage.height / sigImage.width))

      page.drawImage(sigImage, {
        x: pdfX,
        y: pdfY,
        width: size,
        height: size * (sigImage.height / sigImage.width),
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      addActivity({
        name: `${customFileName}.pdf`,
        tool: 'Signature',
        size: blob.size,
        resultUrl: url
      })
      toast.success('PDF signed successfully!')
    } catch (error: any) {
      toast.error(`Error signing PDF: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex-1">
      <main className="max-w-6xl mx-auto px-6 py-6 md:py-10">
        <ToolHeader 
          title="Electronic" 
          highlight="Signature" 
          description="Sign any PDF document securely. Upload a transparent PNG of your signature." 
        />

        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input type="file" accept="image/*" className="hidden" ref={signatureInputRef} onChange={handleSignatureUpload} />

        {!pdfData ? (
          <div onClick={() => !isProcessing && fileInputRef.current?.click()} className={`border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 transition-all cursor-pointer group ${isProcessing ? 'opacity-50' : ''}`}>
            <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <MousePointer2 size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Select PDF to Sign</h3>
            <p className="text-sm text-gray-400">Tap to browse your files</p>
          </div>
        ) : pdfData.isLocked ? (
          <div className="max-w-md mx-auto animate-in fade-in duration-500">
             <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">File is Protected</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">Unlock this file to sign it.</p>
              <input 
                type="password" 
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-center mb-4"
              />
              <button onClick={handleUnlock} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs">Unlock PDF</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Preview Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Page {activePage} of {pdfData.pageCount}</span>
                  <div className="flex gap-2">
                    <button 
                      disabled={activePage <= 1}
                      onClick={() => { setActivePage(prev => prev - 1); updateThumbnail(pdfData.pdfDoc, activePage - 1); }}
                      className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold disabled:opacity-30"
                    >
                      Prev
                    </button>
                    <button 
                      disabled={activePage >= pdfData.pageCount}
                      onClick={() => { setActivePage(prev => prev + 1); updateThumbnail(pdfData.pdfDoc, activePage + 1); }}
                      className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div 
                  className="relative aspect-[1/1.4] w-full bg-gray-100 dark:bg-black rounded-xl overflow-hidden cursor-crosshair group"
                  onClick={(e) => {
                    if (!signatureImg) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    setPos({ x, y })
                  }}
                >
                  {thumbnail ? (
                    <img src={thumbnail} className="w-full h-full object-contain" alt="PDF Page" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center animate-pulse"><Loader2 className="animate-spin text-rose-500" /></div>
                  )}

                  {signatureImg && (
                    <div 
                      style={{ 
                        left: `${pos.x}%`, 
                        top: `${pos.y}%`, 
                        width: `${size}px`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className="absolute pointer-events-none ring-2 ring-rose-500 ring-offset-2 rounded-sm shadow-2xl transition-all duration-75"
                    >
                      <img src={signatureImg} className="w-full h-auto" alt="Signature" />
                    </div>
                  )}

                  {!signatureImg && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-lg text-xs font-bold">Upload signature first</p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-center text-gray-400 mt-4 font-medium italic">Click anywhere on the document to place your signature.</p>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm sticky top-24">
                {!downloadUrl ? (
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">1. Your Signature</label>
                      {!signatureImg ? (
                        <button 
                          onClick={() => signatureInputRef.current?.click()}
                          className="w-full aspect-video bg-rose-50 dark:bg-rose-900/10 border-2 border-dashed border-rose-200 dark:border-rose-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-rose-500 hover:bg-rose-100 transition-all"
                        >
                          <ImageIcon size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Upload PNG</span>
                        </button>
                      ) : (
                        <div className="relative group">
                          <div className="w-full p-4 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-zinc-800">
                            <img src={signatureImg} className="h-20 mx-auto object-contain" alt="Uploaded sig" />
                          </div>
                          <button 
                            onClick={() => { setSignatureImg(null); setSignatureFile(null); }}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {signatureImg && (
                      <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex justify-between">
                            <span>Signature Size</span>
                            <span className="text-rose-500">{size}px</span>
                          </label>
                          <input 
                            type="range" min="50" max="400" step="5"
                            value={size}
                            onChange={(e) => setSize(parseInt(e.target.value))}
                            className="w-full accent-rose-500"
                          />
                        </div>

                        <button 
                          onClick={saveSignedPdf}
                          disabled={isProcessing}
                          className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {isProcessing ? <Loader2 className="animate-spin" /> : <Download />}
                          Save Signed PDF
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <SuccessState 
                    message="Document Signed!"
                    downloadUrl={downloadUrl}
                    fileName={`${customFileName}.pdf`}
                    onStartOver={() => { setDownloadUrl(null); setSignatureImg(null); setPdfData(null); }}
                  />
                )}
                
                <button onClick={() => setPdfData(null)} className="w-full mt-6 py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors tracking-[0.2em]">Cancel</button>
              </div>
            </div>
          </div>
        )}
        <PrivacyBadge />
      </main>
    </div>
  )
}