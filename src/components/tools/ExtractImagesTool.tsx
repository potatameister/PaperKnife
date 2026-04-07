import { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, Loader2, X, Sparkles, FileUp } from 'lucide-react'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { SecurePDFGate } from '../shared/SecurePDFGate'

type PdfData = { 
  file: File, 
  decryptedBuffer: Uint8Array,
  thumbnail?: string, 
  pageCount: number, 
  pdfDoc?: any
}

export default function ExtractImagesTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [pdfData, setPdfData] = useState<PdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [extractedCount, setExtractedCount] = useState(0)
  const [customFileName, setCustomFileName] = useState('extracted-images')
  const isNative = Capacitor.isNativePlatform()

  const [isLoadingFile, setIsLoadingFile] = useState(false)

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      setSourceFile(file)
    }
  }, [])

  const handleUnlocked = async (decryptedBuffer: Uint8Array, file: File) => {
    setIsLoadingFile(true)
    try {
      const meta = await getPdfMetaData(file)
      const pdfDoc = await loadPdfDocument(decryptedBuffer)
      setPdfData({ file, decryptedBuffer, pageCount: meta.pageCount, pdfDoc, thumbnail: meta.thumbnail })
      setCustomFileName(`${file.name.replace('.pdf', '')}-extracted`)
    } catch (err) { 
      console.error(err) 
      toast.error('Failed to load document structure')
    } finally { 
      setIsLoadingFile(false); 
      setDownloadUrl(null) 
    }
  }

  const extractImages = async () => {
    if (!pdfData || !pdfData.pdfDoc) return
    setIsProcessing(true); setProgress(0); setExtractedCount(0)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    try {
      const zip = new JSZip()
      let imageCounter = 0
      
      for (let i = 1; i <= pdfData.pageCount; i++) {
        const page = await pdfData.pdfDoc.getPage(i)
        const operatorList = await page.getOperatorList()
        
        for (let j = 0; j < operatorList.fnArray.length; j++) {
          const fn = operatorList.fnArray[j]
          // If the function is an image painting operation
          if (fn === 85 || fn === 82 || fn === 92 || fn === 87) { // internal codes for image ops in some pdfjs versions, but let's be safer
             // In modern pdfjs, we usually check the string names if possible or look at common image paint codes
          }
          
          // Safer way: iterate all objects mentioned in the operator list
          const depName = operatorList.argsArray[j]?.[0]
          if (typeof depName === 'string' && depName.startsWith('img_')) {
            try {
              const imgObj = await page.objs.get(depName)
              if (imgObj && imgObj.data) {
                imageCounter++
                
                // Convert Uint8ClampedArray to Canvas to DataURL
                const canvas = document.createElement('canvas')
                canvas.width = imgObj.width
                canvas.height = imgObj.height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  const imageData = ctx.createImageData(imgObj.width, imgObj.height)
                  imageData.data.set(imgObj.data)
                  ctx.putImageData(imageData, 0, 0)
                  
                  const dataUrl = canvas.toDataURL('image/png')
                  const base64Data = dataUrl.split(',')[1]
                  zip.file(`image-${imageCounter.toString().padStart(3, '0')}.png`, base64Data, { base64: true })
                }
              }
            } catch (e) {
              console.warn('Failed to extract an image object', e)
            }
          }
        }
        
        setProgress(Math.round((i / pdfData.pageCount) * 100))
      }
      
      if (imageCounter === 0) {
        toast.error('No embedded images found.', {
          description: 'The file might be heavily compressed or uses non-standard image encoding.'
        })
        setIsProcessing(false)
        return
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const zipBuffer = new Uint8Array(await zipBlob.arrayBuffer())
      setDownloadUrl(url)
      setExtractedCount(imageCounter)
      addActivity({ name: `${customFileName}.zip`, tool: 'Extract Images', size: zipBlob.size, resultUrl: url, buffer: zipBuffer })
      toast.success(`Extracted ${imageCounter} images!`)
    } catch (error: any) { 
      toast.error(`Error: ${error.message}`) 
    } finally { 
      setIsProcessing(false) 
    }
  }

  const ActionButton = () => (
    <button onClick={extractImages} disabled={isProcessing} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <><Loader2 className="animate-spin" /> {progress}%</> : <><Sparkles size={18} /> Extract Raw Images</>}
    </button>
  )
return (
  <NativeToolLayout title="Extract Images" description="Find and save all original images embedded inside the PDF." actions={pdfData && !downloadUrl && <ActionButton />}>
    <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && setSourceFile(e.target.files[0])} />
    {!pdfData ? (
      <SecurePDFGate 
        file={sourceFile} 
        onUnlocked={handleUnlocked} 
        onCancel={() => setSourceFile(null)}
      >
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"><FileUp size={32} /></div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
          <p className="text-sm text-gray-400">Tap to search for images</p>
        </div>
      </SecurePDFGate>
    ) : (
      <div className="space-y-6">
...
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500">{pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <ImageIcon size={20} />}</div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3><p className="text-[10px] text-gray-400 uppercase font-black">{pdfData.pageCount} Pages • {(pdfData.file.size / (1024*1024)).toFixed(1)} MB</p></div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-8 shadow-sm">
            {!downloadUrl ? (
              <>
                <div className="space-y-4">
                  <div className="text-center py-2 px-4 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
                      This tool scans every page and recovers high-quality source images. Perfect for saving photos from documents.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 text-center">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">
                      Note: If no images are detected, the file may have been compressed using rasterization (printing to PDF).
                    </p>
                  </div>
                </div>
                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest px-1">Output ZIP Name</label><input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" /></div>
                {isProcessing && (
                  <div className="space-y-3">
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden shadow-inner">
                       <div className="bg-rose-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-center font-black text-gray-400 uppercase tracking-widest animate-pulse">Extracting High-Res Assets...</p>
                  </div>
                )}
              </>
            ) : (
              <SuccessState message={`Successfully extracted ${extractedCount} images!`} downloadUrl={downloadUrl} fileName={`${customFileName}.zip`} onStartOver={() => { setDownloadUrl(null); setProgress(0); setExtractedCount(0); setPdfData(null); }} showPreview={false} />
            )}
            <button onClick={() => setPdfData(null)} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">Close File</button>
          </div>
        </div>
      )}
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
