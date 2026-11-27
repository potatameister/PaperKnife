import { useState, useRef, useEffect } from 'react'
import { Hash, Lock, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'

import { getPdfMetaData, unlockPdf, loadPdfDocument } from '../../utils/pdfHelpers'
import { numberPages } from '../../utils/pageNumberEngines'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { t } from '../../i18n'

type PageNumberPdfData = { file: File, pageCount: number, isLocked: boolean, password?: string, pdfDoc?: any, thumbnail?: string }
type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export default function PageNumberTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<PageNumberPdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-numbered')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [format, setFormat] = useState(t("Page {n} of {total}"))
  const [position, setPosition] = useState<Position>('bottom-center')
  const [color] = useState('#6B7280')

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
      setCustomFileName(`${pdfData.file.name.replace('.pdf', '')}-numbered`)
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
        setCustomFileName(`${file.name.replace('.pdf', '')}-numbered`)
      }
    } catch (err) { console.error(err); toast.error(t("Failed to open PDF")) } finally { setIsProcessing(false); setDownloadUrl(null) }
  }

  const applyPageNumbers = async () => {
    if (!pdfData) return
    setIsProcessing(true); await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const res = await numberPages(
        { file: pdfData.file, password: pdfData.password },
        { format, position },
        (blob) => URL.createObjectURL(blob)
      )
      setDownloadUrl(res.url)
      addActivity({ name: `${customFileName}.pdf`, tool: 'Page Numbers', size: res.size, resultUrl: res.url, buffer: res.buffer })
    } catch (error: any) { toast.error(`Error: ${error.message}`) } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={applyPageNumbers} disabled={isProcessing} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <Hash size={20} />} {t("Add Page Numbers")}
    </button>
  )

  const getPreviewStyles = () => {
    const styles: React.CSSProperties = { position: 'absolute', padding: '10px', color: color, fontSize: '8px', fontWeight: 'bold' }
    if (position.includes('top')) styles.top = 0; else styles.bottom = 0
    if (position.includes('left')) styles.left = 0; 
    else if (position.includes('right')) styles.right = 0;
    else { styles.left = '50%'; styles.transform = 'translateX(-50%)' }
    return styles
  }

  return (
    <NativeToolLayout title={t("Page Numbers")} description={t("Add custom numbering to your PDF automatically.")} actions={pdfData && !pdfData.isLocked && !downloadUrl && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {!pdfData ? (
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><Hash size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">{t("Select PDF")}</h3>
          <p className="text-sm text-gray-400">{t("Tap to start numbering")}</p>
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
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col items-center">
               <div className="flex justify-between items-center w-full mb-4 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Eye size={12}/> {t("Live Preview")}</h4>
               </div>
               <div className="relative aspect-[3/4] w-full max-w-[300px] bg-white border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                  {pdfData.thumbnail ? (
                    <img src={pdfData.thumbnail} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-100"><Hash size={64} /></div>
                  )}
                  <div style={getPreviewStyles()}>
                    {format.replace('{n}', '1').replace('{total}', pdfData.pageCount.toString())}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
              {!downloadUrl ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">{t("Label Format")}</label>
                    <input type="text" value={format} onChange={(e) => setFormat(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" placeholder={t("Page {n} of {total}")} />
                    <p className="text-[8px] text-gray-400 mt-2">{t("Use")} <b>{'{n}'}</b> {t("for page number and")} <b>{'{total}'}</b> {t("for total pages.")}</p>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">{t("Position")}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position[]).map(pos => (
                        <button key={pos} onClick={() => setPosition(pos)} className={`py-3 px-1 rounded-xl text-[8px] font-black uppercase transition-all border ${position === pos ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'bg-gray-50 dark:bg-black text-gray-400 border-gray-100 dark:border-zinc-800'}`}>
                          {t(pos.replace('-', ' '))}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3">{t("Output Filename")}</label>
                    <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" />
                    {pdfData.password && (<p className="text-amber-700 dark:text-amber-400 font-bold text-[11px] leading-relaxed mt-3 text-center">{t("File output will be unlocked.")}</p>)}
                  </div>
                </>
              ) : (
                <SuccessState message={t("Numbers Applied Successfully!")} downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => setDownloadUrl(null)} />
              )}
              <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">{t("Close File")}</button>
            </div>
          </div>
        </div>
      )}
    </NativeToolLayout>
  )
}
