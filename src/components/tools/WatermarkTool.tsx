import { useState, useRef, useEffect } from 'react'
import { Type, Lock, Loader2, Palette, Eye } from 'lucide-react'
import { toast } from 'sonner'

import { PDFDocument } from 'pdf-lib'
import { getProcessBytes } from '../../utils/decryptInput'
import { getPdfMetaData, unlockPdf, loadPdfDocument, renderPageThumbnail } from '../../utils/pdfHelpers'
import { watermarkPdf } from '../../utils/watermarkEngines'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { t } from '../../i18n'

type WatermarkPdfData = { file: File, pageCount: number, isLocked: boolean, password?: string, pdfDoc?: any, thumbnail?: string }

export default function WatermarkTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<WatermarkPdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-watermarked')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.3)
  const [fontSize, setFontSize] = useState(50)
  const [rotation, setRotation] = useState(-45)
  const [color, setColor] = useState('#000000')
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewToken = useRef(0)
  // Decrypted source bytes are cached per file: sliders must never pay
  // decrypt + full verify per keystroke.
  const previewBytesRef = useRef<{ key: string, bytes: Uint8Array } | null>(null)

  // True preview: run the real engine on current settings and rasterize
  // result page 1. The preview IS the output, so size/position/rotation
  // can never drift like the old mock did. Only page 1 is processed, so
  // even heavy files preview in a fraction of a second.
  useEffect(() => {
    if (!pdfData || pdfData.isLocked) { setPreviewImg(null); return }
    setPreviewLoading(true)
    const token = ++previewToken.current
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(async () => {
      try {
        const key = `${pdfData.file.name}:${pdfData.file.size}:${(pdfData.file as File).lastModified}:${pdfData.password ?? ''}`
        let raw = previewBytesRef.current?.key === key ? previewBytesRef.current.bytes : null
        if (!raw) {
          raw = await getProcessBytes(pdfData.file, pdfData.password)
          previewBytesRef.current = { key, bytes: raw }
        }
        const src = await PDFDocument.load(raw, { throwOnInvalidObject: false } as any)
        const one = await PDFDocument.create()
        const [first] = await one.copyPages(src, [0])
        one.addPage(first)
        const oneBytes = await one.save()
        const oneFile = new File([oneBytes as any], 'watermark-preview.pdf', { type: 'application/pdf' })
        const res = await watermarkPdf(
          { file: oneFile },
          { text, opacity, fontSize, rotation, color },
          (blob) => URL.createObjectURL(blob),
        )
        if (previewToken.current !== token) { URL.revokeObjectURL(res.url); return }
        const file = new File([res.buffer as any], 'watermark-preview.pdf', { type: 'application/pdf' })
        const doc = await loadPdfDocument(file)
        let thumb = ''
        try {
          thumb = await renderPageThumbnail(doc, 1, 1.0)
        } finally {
          try { doc.destroy() } catch { /* ignore */ }
        }
        URL.revokeObjectURL(res.url)
        if (previewToken.current !== token) return
        if (thumb) setPreviewImg(thumb)
      } catch {
        // Keep last good preview; failures surface on Apply with a toast.
      } finally {
        if (previewToken.current === token) setPreviewLoading(false)
      }
    }, 350)
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current) }
  }, [pdfData, text, opacity, fontSize, rotation, color])

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
      setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, password: unlockPassword, pdfDoc: result.pdfDoc, thumbnail: result.thumbnail })
      setCustomFileName(`${pdfData.file.name.replace('.pdf', '')}-watermarked`)
    } else { toast.error(t("Incorrect password for \"{0}\".", pdfData?.file.name)) }
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
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc, thumbnail: meta.thumbnail })
        setCustomFileName(`${file.name.replace('.pdf', '')}-watermarked`)
      }
    } catch (err) { console.error(err); toast.error(t("Failed to open PDF")) } finally { setIsProcessing(false); setDownloadUrl(null) }
  }

  const applyWatermark = async () => {
    if (!pdfData) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const res = await watermarkPdf(
        { file: pdfData.file, password: pdfData.password },
        { text, opacity, fontSize, rotation, color },
        (blob) => URL.createObjectURL(blob)
      )
      setDownloadUrl(res.url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Watermark', size: res.size, resultUrl: res.url, buffer: res.buffer })
    } catch (error: any) { 
      toast.error(`Error: ${error.message}`) 
    } finally { 
      setIsProcessing(false) 
    }
  }

  const ActionButton = () => (
    <button onClick={applyWatermark} disabled={isProcessing || !text} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <Type size={20} />} {t("Apply Watermark")}
    </button>
  )

  return (
    <NativeToolLayout title={t("Watermark")} description={t("Add secure text overlays to your documents locally.")} actions={pdfData && !pdfData.isLocked && !downloadUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {!pdfData ? (
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Type size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">{t("Select PDF")}</h3>
          <p className="text-sm text-gray-400">{t("Tap to start watermarking")}</p>
        </div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto relative z-[100]">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder={t("Password")} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4 dark:text-white" />
            <button onClick={handleUnlock} disabled={!unlockPassword || isProcessing} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase text-xs">{t("Unlock")}</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-2 space-y-6">
            {/* Live Preview */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col items-center">
               <div className="flex justify-between items-center w-full mb-4 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Eye size={12}/> {t("Live Preview")}</h4>
               </div>
               <div className="relative w-full max-w-[300px] bg-white border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                  {previewImg ? (
                    <img src={previewImg} className="w-full h-auto block" alt={t("Watermark preview")} />
                  ) : (
                    <div className="w-full min-h-[300px] flex items-center justify-center text-gray-100"><Type size={64} /></div>
                  )}
                  {previewLoading && (
                    <div className="absolute inset-0 bg-white/30 flex items-start justify-end p-2 pointer-events-none">
                      <Loader2 className="animate-spin text-rose-500" size={16} />
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
              {!downloadUrl ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">{t("Watermark Text")}</label>
                    <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black uppercase text-gray-400">{t("Appearance")}</label>
                       <Palette size={14} className="text-gray-300" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="col-span-2">
                          <label className="block text-[8px] font-black uppercase text-gray-400 mb-2">Color</label>
                          <div className="flex gap-2 flex-wrap">
                             {['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#000000'].map(c => (
                               <button 
                                 key={c} 
                                 onClick={() => setColor(c)}
                                 className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-zinc-900 dark:border-white scale-110' : 'border-transparent'}`}
                                 style={{ backgroundColor: c }}
                               />
                             ))}
                             <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full overflow-hidden border-none p-0 cursor-pointer bg-transparent" />
                          </div>
                       </div>
                       
                       <div>
                          <label className="block text-[8px] font-black uppercase text-gray-400 mb-2">{t("Opacity (")}{Math.round(opacity * 100)}%)</label>
                          <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full accent-rose-500" />
                       </div>
                       <div>
                          <label className="block text-[8px] font-black uppercase text-gray-400 mb-2">{t("Size (")}{fontSize}px)</label>
                          <input type="range" min="10" max="200" step="1" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full accent-rose-500" />
                       </div>
                       <div>
                          <label className="block text-[8px] font-black uppercase text-gray-400 mb-2">{t("Rotation (")}{rotation}°)</label>
                          <input type="range" min="-180" max="180" step="5" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="w-full accent-rose-500" />
                       </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">{t("Output Filename")}</label>
                    <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                    {pdfData.password && (<p className="text-amber-700 dark:text-amber-400 font-bold text-[11px] leading-relaxed mt-3 text-center">{t("File output will be unlocked.")}</p>)}
                  </div>
                </>
              ) : (
                <SuccessState message={t("Watermark Applied Successfully!")} downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => setDownloadUrl(null)} />
              )}
              <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">{t("Close File")}</button>
            </div>
          </div>
        </div>
      )}
    </NativeToolLayout>
  )
}
