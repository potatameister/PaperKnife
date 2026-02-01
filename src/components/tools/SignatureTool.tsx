import { useState, useRef, useEffect } from 'react'
import { Download, Loader2, Lock, MousePointer2, Image as ImageIcon, Trash2, Pen, Eraser, Check } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import ToolHeader from './shared/ToolHeader'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'

// --- Components ---

function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[300] bg-white/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white animate-pulse">{message}</p>
    </div>
  )
}

function SignaturePad({ onSave, onCancel, inkColor }: { onSave: (blob: Blob) => void, onCancel: () => void, inkColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPoint = useRef<{ x: number, y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // HD Canvas Setup
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.strokeStyle = inkColor
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [inkColor])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    lastPoint.current = getPos(e)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const currentPoint = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    const midPoint = {
      x: (lastPoint.current.x + currentPoint.x) / 2,
      y: (lastPoint.current.y + currentPoint.y) / 2
    }
    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midPoint.x, midPoint.y)
    ctx.stroke()
    lastPoint.current = currentPoint
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    lastPoint.current = null
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleDone = () => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) onSave(blob)
      }, 'image/png')
    }
  }

  return (
    <div className="space-y-4 animate-in zoom-in-95 duration-200">
      <div className="relative aspect-video w-full bg-white border-2 border-gray-200 dark:border-zinc-700 rounded-3xl overflow-hidden touch-none shadow-sm">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={handleClear} className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm text-gray-400" title="Clear">
            <Eraser size={18} />
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500">Cancel</button>
        <button onClick={handleDone} className="flex-[2] py-3 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none">
          <Check size={16} /> Use Signature
        </button>
      </div>
    </div>
  )
}

// --- Main Tool ---

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
  const previewRef = useRef<HTMLDivElement>(null)
  
  const [pdfData, setPdfData] = useState<SignaturePdfData | null>(null)
  const [signatureImg, setSignatureImg] = useState<string | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | Blob | null>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadingMsg, setLoadingOverlay] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const customFileName = 'paperknife-signed'
  const [unlockPassword, setUnlockPassword] = useState('')
  
  const [activePage, setActivePage] = useState(1)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [size, setSize] = useState(150)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [sigMode, setSigMode] = useState<'draw' | 'upload' | null>(null)
  const [inkColor, setInkColor] = useState('#000000')
  const [isDraggingSig, setIsDraggingSig] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setLoadingOverlay('Verifying Password...')
    await new Promise(r => setTimeout(r, 100))
    try {
      const result = await unlockPdf(pdfData.file, unlockPassword)
      if (result.success) {
        setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, password: unlockPassword })
        await updateThumbnail(result.pdfDoc, 1)
      } else {
        toast.error('Incorrect password')
      }
    } catch {
      toast.error('Unlock failed')
    } finally {
      setLoadingOverlay(null)
    }
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setLoadingOverlay('Analyzing PDF...')
    await new Promise(r => setTimeout(r, 100))
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) {
        setPdfData({ file, pageCount: 0, isLocked: true })
      } else {
        const pdfDoc = await loadPdfDocument(file)
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc })
        await updateThumbnail(pdfDoc, 1)
      }
    } catch {
      toast.error('Error loading file')
    } finally {
      setLoadingOverlay(null)
    }
  }

  const updateThumbnail = async (pdf: any, pageNum: number) => {
    const thumb = await renderPageThumbnail(pdf, pageNum, 2.0)
    setThumbnail(thumb)
  }

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSignatureFile(file)
      setSignatureImg(URL.createObjectURL(file))
      setSigMode(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    if (isDraggingSig) {
      let x = ((clientX - rect.left) / rect.width) * 100
      let y = ((clientY - rect.top) / rect.height) * 100
      setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
    } else if (isResizing) {
      const sigX = (pos.x / 100) * rect.width + rect.left
      const newWidth = clientX - (sigX - (size / 2))
      setSize(Math.max(50, Math.min(rect.width, newWidth)))
    }
  }

  const saveSignedPdf = async () => {
    if (!pdfData || !signatureFile) return
    setIsProcessing(true)
    setLoadingOverlay('Generating Signed PDF...')
    await new Promise(r => setTimeout(r, 100))
    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: pdfData.password, ignoreEncryption: true } as any)
      const sigBytes = await signatureFile.arrayBuffer()
      const sigImage = await pdfDoc.embedPng(sigBytes)
      const pages = pdfDoc.getPages()
      const page = pages[activePage - 1]
      const { width, height } = page.getSize()
      const pdfX = (pos.x / 100) * width
      const pdfY = height - ((pos.y / 100) * height) - (size * (sigImage.height / sigImage.width))
      page.drawImage(sigImage, { x: pdfX, y: pdfY, width: size, height: size * (sigImage.height / sigImage.width) })
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Signature', size: blob.size, resultUrl: url })
      toast.success('PDF signed successfully!')
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setIsProcessing(false)
      setLoadingOverlay(null)
    }
  }

  return (
    <div className="flex-1" onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onMouseUp={() => { setIsDraggingSig(false); setIsResizing(false); }} onTouchEnd={() => { setIsDraggingSig(false); setIsResizing(false); }}>
      {loadingMsg && <LoadingOverlay message={loadingMsg} />}
      <main className="max-w-6xl mx-auto px-6 py-6 md:py-10">
        <ToolHeader title="Electronic" highlight="Signature" description="Sign any PDF document securely. Draw your signature or upload a transparent PNG." />
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input type="file" accept="image/png" className="hidden" ref={signatureInputRef} onChange={handleSignatureUpload} />

        {!pdfData ? (
          <div onClick={() => !loadingMsg && fileInputRef.current?.click()} className={`border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 transition-all cursor-pointer group ${loadingMsg ? 'opacity-50' : ''}`}>
            <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><MousePointer2 size={40} /></div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Select PDF to Sign</h3>
            <p className="text-sm text-gray-400">Tap to browse your files</p>
          </div>
        ) : pdfData.isLocked ? (
          <div className="max-w-md mx-auto animate-in fade-in duration-500">
             <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">File is Protected</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">Unlock this file to sign it.</p>
              <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="Enter Password" className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-center mb-4 dark:text-white" />
              <button onClick={handleUnlock} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs">Unlock PDF</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Page {activePage} of {pdfData.pageCount}</span>
                  <div className="flex gap-2">
                    <button disabled={activePage <= 1} onClick={async () => { const newPage = activePage - 1; setActivePage(newPage); setThumbnail(null); await updateThumbnail(pdfData.pdfDoc, newPage); }} className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold disabled:opacity-30 dark:text-white">Prev</button>
                    <button disabled={activePage >= pdfData.pageCount} onClick={async () => { const newPage = activePage + 1; setActivePage(newPage); setThumbnail(null); await updateThumbnail(pdfData.pdfDoc, newPage); }} className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold disabled:opacity-30 dark:text-white">Next</button>
                  </div>
                </div>
                <div ref={previewRef} className="relative aspect-[1/1.4] w-full bg-gray-100 dark:bg-black rounded-xl overflow-hidden cursor-crosshair group touch-none" onClick={(e) => { if (!signatureImg || isDraggingSig || isResizing) return; const rect = e.currentTarget.getBoundingClientRect(); setPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 }); }}>
                  {thumbnail ? <img src={thumbnail} className="w-full h-full object-contain" alt="PDF Page" /> : <div className="w-full h-full flex items-center justify-center animate-pulse"><Loader2 className="animate-spin text-rose-500" /></div>}
                  {signatureImg && (
                    <div onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSig(true); }} onTouchStart={(e) => { e.stopPropagation(); setIsDraggingSig(true); }} style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${size}px`, transform: 'translate(-50%, -50%)' }} className={`absolute cursor-move ring-2 ring-rose-500 ring-offset-2 rounded-sm shadow-2xl transition-shadow ${isDraggingSig ? 'scale-105 shadow-rose-500/20' : 'scale-100'}`}>
                      <img src={signatureImg} className="w-full h-auto brightness-0 dark:invert pointer-events-none" alt="Signature" />
                      <div onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); }} onTouchStart={(e) => { e.stopPropagation(); setIsResizing(true); }} className="absolute bottom-[-10px] right-[-10px] w-6 h-6 bg-rose-500 rounded-full border-2 border-white shadow-lg cursor-nwse-resize flex items-center justify-center text-white"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /></div>
                    </div>
                  )}
                  {!signatureImg && <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><p className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-lg text-xs font-bold dark:text-white">Configure signature first</p></div>}
                </div>
                <p className="text-[10px] text-center text-gray-400 mt-4 font-medium italic">Drag signature to move • Drag handle to resize.</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm sticky top-24">
                {!downloadUrl ? (
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">1. Configure Signature</label>
                      {!signatureImg && !sigMode && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setSigMode('draw')} className="aspect-square bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-rose-500 hover:bg-rose-100 transition-all"><Pen size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Draw</span></button>
                            <button onClick={() => signatureInputRef.current?.click()} className="aspect-square bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-rose-500 hover:bg-rose-100 transition-all"><ImageIcon size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Upload</span></button>
                          </div>
                          <div className="flex items-center gap-3 p-1 bg-gray-50 dark:bg-black border border-gray-100 dark:border-zinc-800 rounded-xl">
                            <button onClick={() => setInkColor('#000000')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${inkColor === '#000000' ? 'bg-white dark:bg-zinc-800 text-gray-900 shadow-sm' : 'text-gray-400'}`}>Black Ink</button>
                            <button onClick={() => setInkColor('#003366')} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${inkColor === '#003366' ? 'bg-[#003366] text-white shadow-sm' : 'text-gray-400'}`}>Blue Ink</button>
                          </div>
                        </div>
                      )}
                      {sigMode === 'draw' && <SignaturePad inkColor={inkColor} onSave={(blob) => { setSignatureFile(blob); setSignatureImg(URL.createObjectURL(blob)); setSigMode(null); }} onCancel={() => setSigMode(null)} />}
                      {signatureImg && (
                        <div className="relative group">
                          <div className="w-full p-4 bg-white rounded-2xl border-2 border-gray-100 flex items-center justify-center min-h-[100px] shadow-inner"><img src={signatureImg} className="h-20 object-contain" alt="Signature preview" /></div>
                          <button onClick={() => { setSignatureImg(null); setSignatureFile(null); }} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                    {signatureImg && (
                      <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                        <button onClick={saveSignedPdf} disabled={isProcessing} className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">{isProcessing ? <Loader2 className="animate-spin" /> : <Download />}Save Signed PDF</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <SuccessState message="Document Signed!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setDownloadUrl(null); setSignatureImg(null); setPdfData(null); setSigMode(null); }} />
                )}
                <button onClick={() => setPdfData(null)} className="w-full mt-6 py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors tracking-[0.2em]">Close File</button>
              </div>
            </div>
          </div>
        )}
        <PrivacyBadge />
      </main>
    </div>
  )
}