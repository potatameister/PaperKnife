import { useState, useRef, useEffect } from 'react'
import { Loader2, Lock, Image as ImageIcon, ArrowRight } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type SignaturePdfData = { file: File, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string }

export default function SignatureTool() {
  const fileInputRef = useRef<HTMLInputElement>(null); const signatureInputRef = useRef<HTMLInputElement>(null); const previewRef = useRef<HTMLDivElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<SignaturePdfData | null>(null); const [signatureImg, setSignatureImg] = useState<string | null>(null); const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false); const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [unlockPassword, setUnlockPassword] = useState(''); const [activePage] = useState(1); const [pos, setPos] = useState({ x: 50, y: 50 })
  const [size, setSize] = useState(150); const [thumbnail, setThumbnail] = useState<string | null>(null); const [isDraggingSig, setIsDraggingSig] = useState(false); const [isResizing, setIsResizing] = useState(false)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return; setIsProcessing(true)
    try {
      const result = await unlockPdf(pdfData.file, unlockPassword)
      if (result.success) { setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, password: unlockPassword }); const thumb = await renderPageThumbnail(result.pdfDoc, 1, 2.0); setThumbnail(thumb) }
      else { toast.error('Incorrect password') }
    } finally { setIsProcessing(false) }
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return; setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) { setPdfData({ file, pageCount: 0, isLocked: true }) }
      else { const pdfDoc = await loadPdfDocument(file); setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc }); const thumb = await renderPageThumbnail(pdfDoc, 1, 2.0); setThumbnail(thumb) }
    } finally { setIsProcessing(false) }
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!previewRef.current) return; const rect = previewRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX; const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    if (isDraggingSig) { setPos({ x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)) }) }
    else if (isResizing) { const sigX = (pos.x / 100) * rect.width + rect.left; setSize(Math.max(50, Math.min(rect.width, clientX - (sigX - (size / 2))))) }
  }

  const saveSignedPdf = async () => {
    if (!pdfData || !signatureFile) return; setIsProcessing(true)
    try {
      const arrayBuffer = await pdfData.file.arrayBuffer(); const pdfDoc = await PDFDocument.load(arrayBuffer, { password: pdfData.password, ignoreEncryption: true } as any)
      const sigBytes = await signatureFile.arrayBuffer(); let sigImage = signatureFile.type === 'image/png' ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes)
      const page = pdfDoc.getPages()[activePage - 1]; const { width, height } = page.getSize(); const pdfX = (pos.x / 100) * width; const pdfY = height - ((pos.y / 100) * height) - (size * (sigImage.height / sigImage.width))
      page.drawImage(sigImage, { x: pdfX, y: pdfY, width: size, height: size * (sigImage.height / sigImage.width) })
      const pdfBytes = await pdfDoc.save(); const blob = new Blob([pdfBytes as any], { type: 'application/pdf' }); const url = URL.createObjectURL(blob)
      setDownloadUrl(url); addActivity({ name: `signed-${pdfData.file.name}`, tool: 'Signature', size: blob.size, resultUrl: url })
    } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={saveSignedPdf} disabled={isProcessing || !signatureImg} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <>Sign & Save <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="Signature" description="Sign any PDF by dragging your signature image." actions={pdfData && !pdfData.isLocked && !downloadUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input type="file" accept="image/*" className="hidden" ref={signatureInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { setSignatureFile(file); setSignatureImg(URL.createObjectURL(file)) } }} />
      {!pdfData ? (
        <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 transition-all cursor-pointer group"><ImageIcon size={32} className="mx-auto mb-4 text-rose-500" /><h3 className="text-xl font-bold dark:text-white">Select PDF</h3></div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto p-8 bg-white dark:bg-zinc-900 rounded-3xl text-center"><Lock size={32} className="mx-auto mb-4 text-rose-500" /><input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} className="w-full p-4 mb-4 border rounded-xl" /><button onClick={handleUnlock} className="w-full p-4 bg-rose-500 text-white rounded-xl">Unlock</button></div>
      ) : (
        <div className="space-y-6" onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onMouseUp={() => { setIsDraggingSig(false); setIsResizing(false); }} onTouchEnd={() => { setIsDraggingSig(false); setIsResizing(false); }}>
          {!downloadUrl ? (
            <>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-white/5 relative aspect-[1/1.4] overflow-hidden touch-none" ref={previewRef} onClick={(e) => { if (!signatureImg || isDraggingSig || isResizing) return; const r = e.currentTarget.getBoundingClientRect(); setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }) }}>
                {thumbnail ? <img src={thumbnail} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-rose-500" /></div>}
                {signatureImg && (
                  <div onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSig(true) }} onTouchStart={(e) => { e.stopPropagation(); setIsDraggingSig(true) }} style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${size}px`, transform: 'translate(-50%, -50%)' }} className="absolute cursor-move ring-2 ring-rose-500 rounded-sm">
                    <img src={signatureImg} className="w-full pointer-events-none" />
                    <div onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true) }} onTouchStart={(e) => { e.stopPropagation(); setIsResizing(true) }} className="absolute -bottom-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-2 border-white cursor-nwse-resize" />
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={() => signatureInputRef.current?.click()} className="flex-1 p-4 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-100 dark:border-white/5 rounded-2xl font-black uppercase text-xs hover:border-rose-500 transition-all">
                  <span className="flex items-center justify-center gap-2"><ImageIcon size={16}/> Upload Signature</span>
                </button>
              </div>
            </>
          ) : (
            <SuccessState message="Signed Successfully!" downloadUrl={downloadUrl} fileName={`signed-${pdfData.file.name}`} onStartOver={() => { setDownloadUrl(null); setPdfData(null); setSignatureImg(null); }} />
          )}
          <button onClick={() => { setPdfData(null); setSignatureImg(null); }} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
