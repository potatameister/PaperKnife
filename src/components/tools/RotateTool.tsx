import { useState, useRef, useEffect } from 'react'
import { RotateCw, Lock, RefreshCcw, Loader2, X } from 'lucide-react'
import { PDFDocument, degrees } from 'pdf-lib'
import { toast } from 'sonner'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'

type RotatePdfData = { file: File, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string, thumbnail?: string }

const LazyThumbnail = ({ pdfDoc, pageNum, rotation }: { pdfDoc: any, pageNum: number, rotation: number }) => {
  const [src, setSrc] = useState<string | null>(null); const imgRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!pdfDoc || src) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { renderPageThumbnail(pdfDoc, pageNum, 1.0).then(setSrc); observer.disconnect() }
    }, { rootMargin: '200px' })
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [pdfDoc, pageNum, src])
  if (src) return <img src={src} className="w-full h-full object-contain transition-transform duration-300 bg-white" style={{ transform: `rotate(${rotation}deg)` }} alt={`P${pageNum}`} />
  return <div ref={imgRef} className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center"><div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /></div>
}

export default function RotateTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<RotatePdfData | null>(null)
  const [rotations, setRotations] = useState<Record<number, number>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-rotated')
  const [unlockPassword, setUnlockPassword] = useState('')

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
      setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, password: unlockPassword, thumbnail: result.thumbnail })
      setCustomFileName(`${pdfData.file.name.replace('.pdf', '')}-rotated`)
    } else { toast.error('Incorrect password') }
    setIsProcessing(false)
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) { setPdfData({ file, pageCount: 0, isLocked: true }) }
      else {
        const pdfDoc = await loadPdfDocument(file)
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc, thumbnail: meta.thumbnail })
        setCustomFileName(`${file.name.replace('.pdf', '')}-rotated`); setRotations({})
      }
    } catch (err) { console.error(err) } finally { setIsProcessing(false); setDownloadUrl(null) }
  }

  const rotatePage = (pageNum: number) => { setRotations(prev => ({ ...prev, [pageNum]: ((prev[pageNum] || 0) + 90) % 360 })); setDownloadUrl(null) }
  const rotateAll = () => {
    const newRotations = { ...rotations }; for (let i = 1; i <= (pdfData?.pageCount || 0); i++) newRotations[i] = ((newRotations[i] || 0) + 90) % 360
    setRotations(newRotations); setDownloadUrl(null)
  }

  const savePDF = async () => {
    if (!pdfData) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: pdfData.password || undefined, ignoreEncryption: true } as any)
      const pages = pdfDoc.getPages()
      pages.forEach((page, idx) => {
        const pageNum = idx + 1; const rotationToAdd = rotations[pageNum] || 0
        if (rotationToAdd !== 0) { const currentRotation = page.getRotation().angle; page.setRotation(degrees((currentRotation + rotationToAdd) % 360)) }
      })
      const pdfBytes = await pdfDoc.save(); const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob); setDownloadUrl(url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Rotate', size: blob.size, resultUrl: url })
    } catch (error: any) { toast.error(`Error: ${error.message}`) } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={savePDF} disabled={isProcessing} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <RotateCw size={20} />} Save Rotated PDF
    </button>
  )

  return (
    <NativeToolLayout title="Rotate PDF" description="Tap individual pages to rotate 90 degrees." actions={pdfData && !pdfData.isLocked && !downloadUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {!pdfData ? (
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><RotateCw size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400">Tap to start rotating</p>
        </div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto relative z-[100]">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">Protected File</h3>
            <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4 dark:text-white" />
            <button onClick={handleUnlock} disabled={!unlockPassword || isProcessing} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase text-xs">Unlock</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-12 h-16 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">{pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <RotateCw size={24} />}</div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p>
            </div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black uppercase tracking-widest text-[10px] text-gray-400">Tap pages to rotate</h4>
              <div className="flex gap-2">
                <button onClick={rotateAll} className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 font-bold"><RotateCw size={12}/> All</button>
                <button onClick={() => setRotations({})} className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 font-bold"><RefreshCcw size={12}/> Reset</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1 scrollbar-hide">
              {Array.from({ length: pdfData.pageCount }).map((_, i) => {
                const pageNum = i + 1; const rotation = rotations[pageNum] || 0
                return (
                  <div key={pageNum} onClick={() => rotatePage(pageNum)} className="relative group cursor-pointer aspect-[3/4] rounded-xl overflow-hidden border-2 border-transparent hover:border-rose-500 transition-all bg-gray-50 dark:bg-black shadow-sm">
                    <div className="w-full h-full p-2"><LazyThumbnail pdfDoc={pdfData.pdfDoc} pageNum={pageNum} rotation={rotation} /></div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors">
                      <div className="bg-white dark:bg-zinc-800 text-rose-500 p-2 rounded-full opacity-0 group-hover:opacity-100 shadow-xl scale-75 group-hover:scale-100 transition-all border border-gray-100 dark:border-white/5">
                        <RotateCw size={20} />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[9px] font-black text-white">PAGE {pageNum}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
            {!downloadUrl ? (
              <div className="space-y-6">
                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-3">Output Filename</label><input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" /></div>
              </div>
            ) : (
              <SuccessState message="PDF Rotated Successfully!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setDownloadUrl(null); setPdfData(null); }} />
            )}
            <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
