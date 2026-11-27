import { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, Lock, Loader2, ArrowRight, X, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, unlockPdf, shareFile } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { t } from '../../i18n'

type ImageFormat = 'jpg' | 'png'
type OutputMode = 'zip' | 'separate'
type PdfData = { file: File, thumbnail?: string, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string }
type ImageResult = { name: string, url: string, size: number, buffer: Uint8Array }

const DPI_OPTIONS = [
  { dpi: 72, scale: 1.0, label: t("Draft") },
  { dpi: 150, scale: 2.0, label: t("Standard") },
  { dpi: 300, scale: 300 / 72, label: t("Print") },
] as const

export default function PdfToImageTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile, setPipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<PdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [format, setFormat] = useState<ImageFormat>('jpg')
  const [dpi, setDpi] = useState<number>(150)
  const [outputMode, setOutputMode] = useState<OutputMode>('zip')
  const [imageResults, setImageResults] = useState<ImageResult[]>([])
  const [customFileName, setCustomFileName] = useState('paperknife-images')
  const [unlockPassword, setUnlockPassword] = useState('')
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      if (pipelined.type && pipelined.type !== 'application/pdf') {
        toast.error(t("The file from the previous tool is not a PDF and cannot be used here."))
        return
      }
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, thumbnail: result.thumbnail, password: unlockPassword })
      setCustomFileName(`${pdfData.file.name.replace('.pdf', '')}-images`)
    } else { toast.error(t("Incorrect password for \"{0}\".", pdfData.file.name)) }
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
        setCustomFileName(`${file.name.replace('.pdf', '')}-images`)
      }
    } catch (err) { console.error(err); toast.error(t("Failed to open PDF")) } finally { setIsProcessing(false); setDownloadUrl(null); setImageResults([]) }
    
    // Reset file input value
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startOver = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    imageResults.forEach(r => URL.revokeObjectURL(r.url))
    setDownloadUrl(null); setImageResults([]); setProgress(0); setPdfData(null); setIsProcessing(false)
  }

  const convertToImages = async () => {
    if (!pdfData || !pdfData.pdfDoc) return
    setIsProcessing(true); setProgress(0); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const opt = DPI_OPTIONS.find(o => o.dpi === dpi) ?? DPI_OPTIONS[1]
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const renderOne = async (i: number): Promise<{ name: string, blob: Blob }> => {
        const page = await pdfData.pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale: opt.scale })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error(t("Canvas context not available"))
        canvas.height = viewport.height; canvas.width = viewport.width
        await page.render({ canvasContext: context, viewport }).promise
        try { page.cleanup() } catch { /* ignore */ }
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, mime, 0.8))
        canvas.width = 0; canvas.height = 0
        if (!blob) throw new Error(t("Failed to encode page {0}", i))
        const padNum = i.toString().padStart(Math.max(2, pdfData.pageCount.toString().length), '0')
        return { name: `${customFileName}-${padNum}.${format}`, blob }
      }
      if (outputMode === 'zip') {
        const { default: JSZip } = await import('jszip'); const zip = new JSZip()
        for (let i = 1; i <= pdfData.pageCount; i++) {
          const { name, blob } = await renderOne(i)
          zip.file(name, new Uint8Array(await blob.arrayBuffer()))
          setProgress(Math.round((i / pdfData.pageCount) * 100))
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob); setDownloadUrl(url)
        const zipBuffer = new Uint8Array(await zipBlob.arrayBuffer())
        setPipelineFile({
          buffer: zipBuffer,
          name: `${customFileName}.zip`,
          type: 'application/zip'
        })
        addActivity({ name: `${customFileName}.zip`, tool: 'PDF to Image', size: zipBlob.size, resultUrl: url, buffer: new Uint8Array(await zipBlob.arrayBuffer()) })
      } else {
        const results: ImageResult[] = []
        for (let i = 1; i <= pdfData.pageCount; i++) {
          const { name, blob } = await renderOne(i)
          const buffer = new Uint8Array(await blob.arrayBuffer())
          results.push({ name, url: URL.createObjectURL(blob), size: blob.size, buffer })
          setProgress(Math.round((i / pdfData.pageCount) * 100))
        }
        setImageResults(results)
        results.forEach(r => addActivity({ name: r.name, tool: 'PDF to Image', size: r.size, resultUrl: r.url, buffer: r.buffer }))
      }
    } catch (error: any) { toast.error(`Error: ${error.message}`) } finally { setIsProcessing(false) }
  }

  const shareImage = async (r: ImageResult) => {
    try {
      await shareFile(r.buffer, r.name, format === 'png' ? 'image/png' : 'image/jpeg')
    } catch { toast.error(t("Could not share \"{0}\".", r.name)) }
  }

  const ActionButton = () => (
    <button onClick={convertToImages} disabled={isProcessing} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <><Loader2 className="animate-spin" /> {progress}%</> : <>{t("Convert to Images")} <ArrowRight size={18} /></>}
    </button>
  )

  const hasResults = !!downloadUrl || imageResults.length > 0

  return (
    <NativeToolLayout title={t("PDF to Image")} description={t("Convert document pages into high-quality images.")} actions={pdfData && !pdfData.isLocked && !hasResults && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {!pdfData ? (
        <button 
          onClick={() => !isProcessing && fileInputRef.current?.click()} 
          className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><ImageIcon size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">{t("Select PDF")}</h3>
          <p className="text-sm text-gray-400">{t("Tap to start converting")}</p>
        </button>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">{t("Protected File")}</h3>
            <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder={t("Password")} className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4" />
            <button onClick={handleUnlock} disabled={!unlockPassword || isProcessing} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase text-xs">{t("Unlock")}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500">{pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <ImageIcon size={20} />}</div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3><p className="text-[10px] text-gray-400 uppercase font-black">{pdfData.pageCount} {t("Pages •")} {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p></div>
            <button onClick={startOver} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
            {!hasResults ? (
              <>
                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">{t("Quality (DPI)")}</label><div className="grid grid-cols-3 gap-3">{DPI_OPTIONS.map(o => <button key={o.dpi} onClick={() => setDpi(o.dpi)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${dpi === o.dpi ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'}`}><span className={`font-black text-sm ${dpi === o.dpi ? 'text-rose-500' : 'text-gray-400'}`}>{o.dpi}</span><span className={`font-black uppercase text-[9px] ${dpi === o.dpi ? 'text-rose-500' : 'text-gray-400'}`}>{o.label}</span></button>)}</div></div>
                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">{t("Save As")}</label><div className="grid grid-cols-2 gap-3">{(['zip', 'separate'] as const).map(m => <button key={m} onClick={() => setOutputMode(m)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${outputMode === m ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'}`}><span className={`font-black uppercase text-[10px] ${outputMode === m ? 'text-rose-500' : 'text-gray-400'}`}>{m === 'zip' ? t("Single ZIP") : t("Separate files")}</span></button>)}</div></div>
                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest px-1">{t("Image Format")}</label><div className="grid grid-cols-2 gap-3">{(['jpg', 'png'] as const).map(fmt => <button key={fmt} onClick={() => setFormat(fmt)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${format === fmt ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'}`}><span className={`font-black uppercase text-[10px] ${format === fmt ? 'text-rose-500' : 'text-gray-400'}`}>{fmt}</span></button>)}</div></div>
                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest px-1">{t("Output Name")}</label><input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" /></div>
              </>
            ) : downloadUrl ? (
              <SuccessState message={t("Images Ready!")} downloadUrl={downloadUrl} fileName={`${customFileName}.zip`} onStartOver={startOver} showPreview={false} />
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">{imageResults.length} images • {dpi} DPI {format}</p>
                {imageResults.map(r => (
                  <div key={r.name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-white/5">
                    <img src={r.url} alt={r.name} className="w-11 h-14 object-cover rounded-lg shrink-0 bg-white" />
                    <div className="flex-1 min-w-0 text-left"><p className="font-bold text-xs truncate dark:text-white">{r.name}</p><p className="text-[10px] text-gray-400 font-bold">{(r.size / 1024).toFixed(0)} KB</p></div>
                    {isNative ? (
                      <button onClick={() => shareImage(r)} className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all" aria-label={t("Share {0}", r.name)}><Share2 size={16} /></button>
                    ) : (
                      <a href={r.url} download={r.name} className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all" aria-label={t("Download {0}", r.name)}><Download size={16} /></a>
                    )}
                  </div>
                ))}
                {!isNative && <p className="text-[11px] text-gray-400 text-center">{t("Your browser may ask permission to download multiple files.")}</p>}
                <button onClick={startOver} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">{t("Start Over")}</button>
              </div>
            )}
            <button onClick={startOver} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">{t("Close File")}</button>
          </div>
        </div>
      )}
    </NativeToolLayout>
  )
}
