import { useState, useRef, useEffect } from 'react'
import { Zap, Loader2, X, FileIcon, ChevronLeft, ChevronRight, Maximize2, ArrowRight, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFArray } from 'pdf-lib'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { getProcessBytes } from '../../utils/decryptInput'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import SuccessState from './shared/SuccessState'
import { NativeToolLayout } from './shared/NativeToolLayout'

// Compare Slider Component (Optimized)
const QualityCompare = ({ originalBuffer, compressedBuffer }: { originalBuffer: Uint8Array, compressedBuffer: Uint8Array }) => {
  const [originalThumb, setOriginalThumb] = useState<string>('')
  const [compressedThumb, setCompressedThumb] = useState<string>('')
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadThumbs = async () => {
      try {
        const origPdf = await loadPdfDocument(new File([originalBuffer as any], 'orig.pdf', { type: 'application/pdf' }))
        const compPdf = await loadPdfDocument(new File([compressedBuffer as any], 'comp.pdf', { type: 'application/pdf' }))
        const t1 = await renderPageThumbnail(origPdf, 1, 2.0)
        const t2 = await renderPageThumbnail(compPdf, 1, 2.0)
        setOriginalThumb(t1); setCompressedThumb(t2)
      } catch (e) { console.error(e) }
    }
    loadThumbs()
  }, [originalBuffer, compressedBuffer])

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const position = ((x - rect.left) / rect.width) * 100
    setSliderPos(Math.max(0, Math.min(100, position)))
  }

  if (!originalThumb || !compressedThumb) return (
    <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-[2rem] animate-pulse">
       <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
       <p className="text-[10px] font-black uppercase text-gray-400">Comparing Quality...</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h4 className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Maximize2 size={12} /> Quality Inspection</h4>
      </div>
      <div ref={containerRef} className="relative h-80 md:h-[400px] rounded-[2rem] overflow-hidden cursor-ew-resize select-none border border-gray-100 dark:border-white/5" onMouseMove={handleMove} onTouchMove={handleMove}>
        <img src={compressedThumb} className="absolute inset-0 w-full h-full object-contain bg-white" alt="Compressed" />
        <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={originalThumb} className="absolute inset-0 w-full h-full object-contain bg-white" alt="Original" />
        </div>
        <div className="absolute top-0 bottom-0 w-1 bg-white shadow-xl z-10" style={{ left: `${sliderPos}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-zinc-900 rounded-full shadow-2xl border border-gray-100 dark:border-white/5 flex items-center justify-center text-rose-500">
             <ChevronLeft size={14} /><ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}

type CompressPdfFile = {
  id: string
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  pdfDoc?: any
  password?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  resultUrl?: string
  resultSize?: number
  keptOriginal?: boolean
  unlockedGrew?: boolean
  resultMessage?: string
}

type CompressionQuality = 'low' | 'medium' | 'high'

export default function CompressTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile, setPipelineFile, lastPipelinedFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [files, setFiles] = useState<CompressPdfFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [unlockingIds, setUnlockingIds] = useState<Set<string>>(new Set())
  const [globalProgress, setGlobalProgress] = useState(0)
  const [quality, setQuality] = useState<CompressionQuality>('medium')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      if (pipelined.type && pipelined.type !== 'application/pdf') {
        toast.error('The file from the previous tool is not a PDF and cannot be used here.')
        return
      }
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFiles([file])
    }
  }, [])

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    const picked = Array.from(selectedFiles).filter(f => f.type === 'application/pdf')
    if (picked.length === 0) return
    if (picked.length > 1) toast('One file at a time — using the first PDF.')
    const file = picked[0]
    const entry = {
      id: Math.random().toString(36).substr(2, 9),
      file, pageCount: 0, isLocked: false, status: 'pending' as const
    }
    setFiles([entry]); setShowSuccess(false); clearUrls()

    // Clear input value to allow selecting the same file again
    if (fileInputRef.current) fileInputRef.current.value = ''

    getPdfMetaData(file).then(meta => {
      if (!meta.isLocked && meta.pageCount === 0) {
        toast.error(`"${file.name}" could not be read.`)
        setFiles(prev => prev.filter(item => item.id !== entry.id))
        return
      }
      setFiles(prev => prev.map(item => item.id === entry.id ? { ...item, pageCount: meta.pageCount, isLocked: meta.isLocked, thumbnail: meta.thumbnail } : item))
    })
  }

  const handleUnlock = async (id: string, password: string) => {
    const item = files.find(f => f.id === id)
    if (!item || unlockingIds.has(id)) return
    setUnlockingIds(prev => new Set(prev).add(id))
    try {
      const result = await unlockPdf(item.file, password)
      if (result.success) {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, thumbnail: result.thumbnail, password } : f))
      } else { toast.error(`Incorrect password for "${item.file.name}"`) }
    } catch { toast.error(`Failed to unlock "${item.file.name}"`) } finally {
      setUnlockingIds(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const compressSingleFile = async (item: CompressPdfFile, quality: CompressionQuality, onProgress?: (p: number) => void): Promise<{ url: string, size: number, buffer: Uint8Array }> => {
    let pdfDoc = item.pdfDoc || await loadPdfDocument(item.file)
    const scaleMap = { high: 1.0, medium: 1.0, low: 1.0 }; const qualityMap = { high: 0.8, medium: 0.6, low: 0.3 }
    const scale = scaleMap[quality]; const jpegQuality = qualityMap[quality]
    const pagesData: { imageBytes: Uint8Array, width: number, height: number }[] = []
    for (let i = 1; i <= item.pageCount; i++) {
      const page = await pdfDoc.getPage(i); const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas'); const context = canvas.getContext('2d')
      if (!context) continue
      canvas.height = viewport.height; canvas.width = viewport.width
      await page.render({ canvasContext: context, viewport }).promise
      const imgData = canvas.toDataURL('image/jpeg', jpegQuality)
      const base64 = imgData.split(',')[1]; const binaryString = window.atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j)
      pagesData.push({ imageBytes: bytes, width: viewport.width, height: viewport.height })
      
      // Update progress during rasterization phase
      if (onProgress) onProgress(Math.round((i / item.pageCount) * 50)) // First 50% is rasterization
      canvas.width = 0; canvas.height = 0
    }
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(new URL('../../utils/pdfWorker.ts', import.meta.url), { type: 'module' })
        worker.postMessage({ type: 'COMPRESS_PDF_ASSEMBLY', payload: { pages: pagesData, quality } }, pagesData.map(p => p.imageBytes.buffer) as any)
        
        worker.onmessage = (e) => {
          if (e.data.type === 'PROGRESS') {
             if (onProgress) onProgress(50 + Math.round(e.data.payload * 0.5)) // Second 50% is assembly
          } else if (e.data.type === 'SUCCESS') {
            const blob = new Blob([e.data.payload], { type: 'application/pdf' })
            resolve({ url: createUrl(blob), size: blob.size, buffer: e.data.payload }); worker.terminate()
          } else if (e.data.type === 'ERROR') {
            reject(new Error(e.data.payload)); worker.terminate()
          }
        }

        worker.onerror = () => {
          reject(new Error('Worker failed to start or execution error.')); worker.terminate()
        }
      } catch (e: any) {
        reject(new Error(`Failed to start worker: ${e.message}`))
      }
    })
  }

  const decodeJpeg = (data: Uint8Array): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([data as any], { type: 'image/jpeg' }))
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')) }
    img.src = url
  })

  const condenseImages = async (item: CompressPdfFile, maxDim: number, jpegQuality: number, onProgress?: (p: number) => void): Promise<{ url: string, size: number, buffer: Uint8Array }> => {
    // Condense: shrink embedded photos in place, keep text/vectors native.
    // No new deps, no WASM: pdf-lib walks the image XObjects, platform
    // canvas re-encodes the JPEGs. Mirrors PaperKnife+ NITRO numbers.
    const bytes = await getProcessBytes(item.file, item.password)
    let pdfDoc
    try {
      pdfDoc = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
    } catch {
      throw new Error(`"${item.file.name}" could not be optimized.`)
    }
    const context = (pdfDoc as any).context
    const MIN_IMAGE_BYTES = 10 * 1024
    const entries = context.enumerateIndirectObjects() as any[]
    let shrunk = 0
    for (let idx = 0; idx < entries.length; idx++) {
      const [ref, obj] = entries[idx]
      try {
        if (!(obj instanceof PDFRawStream)) continue
        const dict = obj.dict
        if (!dict) continue
        const subtype = dict.lookup(PDFName.of('Subtype'))
        if (!subtype || subtype.toString() !== '/Image') continue
        if (dict.lookup(PDFName.of('ImageMask'))) continue
        const filter = dict.lookup(PDFName.of('Filter'))
        const filterStr = filter ? filter.toString() : ''
        const cs = dict.lookup(PDFName.of('ColorSpace'))
        const csStr = cs ? cs.toString() : ''
        if (!filterStr.includes('DCTDecode') || filterStr.includes('JPXDecode')) continue
        if (csStr && !csStr.includes('RGB') && !csStr.includes('Gray') && !csStr.includes('Grey')) {
          // ICCBased profiles (Word/Docs exports, encrypt rebuilds): accept
          // Gray (N=1) and RGB (N=3), keep rejecting CMYK (N=4) — canvas
          // would wreck CMYK colors. Indexed-over-RGB is also fine.
          let colorOk = false
          try {
            const resolveRef = (o: any): any => {
              try {
                const r = context.lookup(o)
                return r === undefined ? o : r
              } catch { return o }
            }
            const iccComponents = (o: any): number => {
              const prof = resolveRef(o)
              const dictOf = (prof as any)?.dict
              const nObj = dictOf ? dictOf.get(PDFName.of('N')) : undefined
              return nObj && typeof (nObj as any).asNumber === 'function' ? (nObj as any).asNumber() : 0
            }
            const arr = resolveRef(cs)
            if (arr instanceof PDFArray && arr.size() > 0) {
              const headObj = resolveRef(arr.get(0))
              const head = headObj ? headObj.toString() : ''
              if (head === '/ICCBased') {
                const n = iccComponents(arr.get(1))
                colorOk = n === 1 || n === 3
              } else if (head === '/Indexed') {
                const baseObj = resolveRef(arr.get(1))
                const bStr = baseObj ? baseObj.toString() : ''
                if (bStr.includes('RGB') || bStr.includes('Gray') || bStr.includes('Grey')) colorOk = true
                else {
                  // Base may be an ICC profile stream ref (toString shows "12 0 R")
                  const n = iccComponents(arr.get(1))
                  colorOk = n === 1 || n === 3
                }
              }
            }
          } catch { /* resolve failure — stays rejected */ }
          if (!colorOk) continue
        }
        const contents = obj.getContents() as Uint8Array
        if (!contents || contents.byteLength < MIN_IMAGE_BYTES) continue
        let img: HTMLImageElement
        try {
          img = await decodeJpeg(contents)
        } catch { continue }
        const w = img.naturalWidth, h = img.naturalHeight
        if (!w || !h) continue
        const down = Math.min(1, maxDim / Math.max(w, h))
        const tw = Math.max(1, Math.round(w * down)), th = Math.max(1, Math.round(h * down))
        const canvas = document.createElement('canvas')
        canvas.width = tw; canvas.height = th
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tw, th)
        ctx.drawImage(img, 0, 0, tw, th)
        const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality)
        const base64 = dataUrl.split(',')[1]
        const binaryString = window.atob(base64)
        const fresh = new Uint8Array(binaryString.length)
        for (let j = 0; j < binaryString.length; j++) fresh[j] = binaryString.charCodeAt(j)
        canvas.width = 0; canvas.height = 0
        if (fresh.byteLength >= contents.byteLength) continue
        dict.set(PDFName.of('Width'), PDFNumber.of(tw))
        dict.set(PDFName.of('Height'), PDFNumber.of(th))
        context.assign(ref, PDFRawStream.of(dict, fresh))
        shrunk++
      } catch { /* per-image skip: masks, CMYK, odd filters stay untouched */ }
      if (onProgress && idx % 20 === 0) onProgress(Math.round((idx / entries.length) * 100))
    }
    if (shrunk === 0) {
      throw new Error(`"${item.file.name}" photos could not be shrunk.`)
    }
    const out = await pdfDoc.save({ useObjectStreams: true })
    const buffer = new Uint8Array(out)
    const blob = new Blob([buffer as any], { type: 'application/pdf' })
    if (onProgress) onProgress(100)
    return { url: createUrl(blob), size: blob.size, buffer }
  }

  const startBatchCompression = async () => {
    const pendingFiles = files.filter(f => !f.isLocked && f.status === 'pending')
    if (pendingFiles.length === 0) return
    setIsProcessing(true); setGlobalProgress(0)

    const item = pendingFiles[0]
    if (!item.pageCount) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f))
      toast.error(`"${item.file.name}" could not be read.`)
      setIsProcessing(false)
      return
    }
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f))
    try {
      const originalSize = item.file.size
      const tierLabel = { high: 'High', medium: 'Standard', low: 'Smallest' } as const
      let res: { url: string, size: number, buffer: Uint8Array }
      let usedTier: CompressionQuality = quality
      let crisp = false
      if (quality === 'low') {
        // Smallest path untouched, salvage pass included
        res = await compressSingleFile(item, quality, setGlobalProgress)
        if (res.size >= originalSize) {
          const retry = await compressSingleFile(item, 'medium', setGlobalProgress)
          if (retry.size < res.size) res = retry
        }
      } else {
        // Condense first (photos shrink, text stays sharp), raster fallback.
        // A compress tool must never hand back a bigger file without trying lower tiers.
        const condenseTiers: { maxDim: number, jpegQ: number, tier: CompressionQuality }[] = quality === 'high'
          ? [{ maxDim: 2560, jpegQ: 0.8, tier: 'high' }, { maxDim: 1920, jpegQ: 0.65, tier: 'medium' }]
          : [{ maxDim: 1920, jpegQ: 0.65, tier: 'medium' }]
        const rasterTiers: CompressionQuality[] = quality === 'high' ? ['high', 'medium', 'low'] : ['medium', 'low']
        const state: { best: { res: { url: string, size: number, buffer: Uint8Array }, usedTier: CompressionQuality, crisp: boolean } | null } = { best: null }
        const consider = (attempt: { url: string, size: number, buffer: Uint8Array }, tier: CompressionQuality, isCrisp: boolean) => {
          if (!state.best || attempt.size < state.best.res.size) state.best = { res: attempt, usedTier: tier, crisp: isCrisp }
          return attempt.size < originalSize
        }
        for (const c of condenseTiers) {
          try {
            const attempt = await condenseImages(item, c.maxDim, c.jpegQ, setGlobalProgress)
            if (consider(attempt, c.tier, true)) break
          } catch { /* photos unshrinkable — fall through to raster */ }
        }
        if (!state.best || state.best.res.size >= originalSize) {
          for (const tier of rasterTiers) {
            let attempt
            try {
              attempt = await compressSingleFile(item, tier, setGlobalProgress)
            } catch (e) {
              if (tier === 'high') continue // raster failure at top tier — fall through to lower tiers
              throw e
            }
            if (attempt && consider(attempt, tier, false)) break
          }
        }
        if (!state.best) throw new Error(`Failed to compress "${item.file.name}".`)
        res = state.best.res; usedTier = state.best.usedTier; crisp = state.best.crisp
      }
      // Never ship an unusable result
      if (res.size < 1024) throw new Error(`"${item.file.name}" compressed to an unusable file.`)
      // Guarantee: never hand back a bigger file than the original —
      // except locked inputs, which must ship the rebuilt (unlocked) result
      const wasLocked = !!item.password
      const steppedDown = usedTier !== quality
      const pct = ((1 - res.size / originalSize) * 100).toFixed(0)
      const baseOutcome = steppedDown ? `Reduced by ${pct}% (used ${tierLabel[usedTier]})` : `Reduced by ${pct}%`
      const outcome = crisp ? `${baseOutcome} — text stays sharp` : baseOutcome
      let finalBuffer = res.buffer, finalSize = res.size, finalUrl = res.url, keptOriginal = false, unlockedGrew = false
      let finalMessage = outcome
      if (res.size >= originalSize && !wasLocked) {
        finalBuffer = new Uint8Array(await item.file.arrayBuffer())
        finalSize = originalSize
        finalUrl = createUrl(new Blob([finalBuffer as any], { type: 'application/pdf' }))
        keptOriginal = true
        finalMessage = 'Already optimal — kept original'
      } else if (res.size >= originalSize && wasLocked) {
        unlockedGrew = true
        finalMessage = 'Unlocked — larger than original'
      }
      const outName = item.file.name.replace('.pdf', '-compressed.pdf')
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'completed', resultUrl: finalUrl, resultSize: finalSize, keptOriginal, unlockedGrew, resultMessage: finalMessage } : f))
      addActivity({ name: outName, tool: 'Compress', size: finalSize, resultUrl: finalUrl, buffer: finalBuffer })
      const originalBuffer = await item.file.arrayBuffer()
      setPipelineFile({
        buffer: finalBuffer,
        name: outName,
        type: 'application/pdf',
        originalBuffer: new Uint8Array(originalBuffer)
      })
      if (keptOriginal || unlockedGrew || steppedDown || crisp) toast.success(finalMessage)
    } catch (e: any) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f))
      toast.error(e?.message || `Failed to compress "${item.file.name}".`)
    }
    setIsProcessing(false); setShowSuccess(true)
  }

  const ActionButton = () => (
    <button 
      onClick={startBatchCompression}
      disabled={isProcessing || files.filter(f => !f.isLocked).length === 0}
      className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl`}
    >
      {isProcessing ? <><Loader2 className="animate-spin" /> {globalProgress}%</> : <>Compress PDF <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="Compress PDF" description="Reduce file size while maintaining quality. Everything stays on your device." actions={files.length > 0 && !showSuccess && <ActionButton />}>
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      
      {files.length === 0 ? (
        <button 
          onClick={() => !isProcessing && fileInputRef.current?.click()} 
          className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner"><Zap size={32} /></div>
              <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF</h3>
              <p className="text-sm text-gray-400 font-medium">Tap to start compression</p>
        </button>
      ) : !showSuccess ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map(f => (
              <div key={f.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 flex items-center gap-4 relative group shadow-sm">
                <div className="w-12 h-16 bg-gray-50 dark:bg-black rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800">
                  {f.isLocked ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-black text-rose-500">
                      <Lock size={16} />
                      <span className="text-[8px] font-black uppercase mt-1 text-center px-1">Locked</span>
                    </div>
                  ) : f.thumbnail ? <img src={f.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileIcon className="text-gray-300" size={16} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate dark:text-white">{f.file.name}</p>
                  {f.isLocked ? (
                    <div className="flex gap-1 mt-1 items-center">
                       {unlockingIds.has(f.id) ? (
                         <p className="flex-1 text-[10px] font-bold text-gray-400 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin text-rose-500" /> Unlocking…</p>
                       ) : (
                         <input type="password" placeholder="Password" className="flex-1 bg-gray-50 dark:bg-black text-[10px] p-1.5 rounded-lg outline-none w-full border border-gray-100 dark:border-zinc-800 focus:border-rose-500" onKeyDown={(e) => { if(e.key === 'Enter') handleUnlock(f.id, e.currentTarget.value) }} />
                       )}
                    </div>
                  ) : <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{(f.file.size / (1024*1024)).toFixed(2)} MB • {f.pageCount} Pages</p>}
                </div>
                <button onClick={() => setFiles(prev => prev.filter(item => item.id !== f.id))} className="p-2 text-gray-300 hover:text-rose-500 transition-colors"><X size={16} /></button>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest px-1">Compression Strategy</h4>
            {files.some(f => f.password) && (
              <p className="text-amber-700 dark:text-amber-400 font-bold text-[11px] leading-relaxed mb-4 text-center">File output will be unlocked.</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'high', label: 'High Quality', desc: 'Best Quality' },
                { id: 'medium', label: 'Standard', desc: 'Balanced' },
                { id: 'low', label: 'Smallest', desc: 'Max Save' }
              ].map((lvl) => (
                <button key={lvl.id} onClick={() => setQuality(lvl.id as CompressionQuality)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${quality === lvl.id ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-gray-100 dark:border-white/5'}`}>
                  <span className={`font-black uppercase text-[9px] text-center leading-tight ${quality === lvl.id ? 'text-rose-500' : 'text-gray-400'}`}>{lvl.label}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">{lvl.desc}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-6 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-white/5">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                   <Zap size={16} />
                 </div>
                 <h5 className="text-xs font-black uppercase tracking-widest dark:text-white">Strategy Details</h5>
               </div>
               <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {quality === 'high' && (
                    <>
                       <strong>High Quality:</strong> Shrinks embedded photos first — text stays sharp and selectable.
                       Falls back to a full-detail rebuild only when photos can't shrink.
                       Expected reduction: <span className="text-rose-500 font-bold">varies by file (photo-heavy shrinks most)</span>.
                    </>
                  )}
                 {quality === 'medium' && (
                   <>
                       <strong>Standard:</strong> Balanced photo shrink for everyday sharing and email attachments, text stays sharp.
                       Falls back to a rebuild when photos can't shrink; the original is kept if nothing would shrink.
                       Expected reduction: <span className="text-rose-500 font-bold">10-60%</span>.
                   </>
                 )}
                  {quality === 'low' && (
                    <>
                      <strong>Smallest Size:</strong> Aggressive downsampling for the lowest possible file size. 
                      Ideal for quick mobile viewing or meeting strict upload limits. 
                      Expected reduction: <span className="text-rose-500 font-bold">70-90%</span>.
                    </>
                  )}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed mt-3">
                   Note: High and Standard shrink embedded photos first so text stays sharp and selectable, and fall back to rebuilding pages as images when photos can't shrink (text not selectable then). Smallest always rebuilds. If the chosen tier would grow the file, the next option is tried automatically — the original is kept only if nothing shrinks (locked inputs always ship the smallest unlocked rebuild).
                </p>
             </div>

            {isProcessing && (
              <div className="mt-8 space-y-3">
                <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden shadow-inner">
                   <div className="bg-rose-500 h-full transition-all" style={{ width: `${globalProgress}%` }} />
                </div>
                <p className="text-[10px] text-center font-black uppercase text-gray-400 tracking-widest animate-pulse">Rasterizing Document...</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in zoom-in duration-300">
          {objectUrl && (
            <div className="space-y-8">
              {lastPipelinedFile?.originalBuffer && lastPipelinedFile?.buffer && <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm"><QualityCompare originalBuffer={lastPipelinedFile.originalBuffer} compressedBuffer={lastPipelinedFile.buffer} /></div>}
              <SuccessState message={files[0].resultMessage || `Reduced by ${((1 - (files[0].resultSize || 0) / files[0].file.size) * 100).toFixed(0)}%`} downloadUrl={objectUrl} fileName={files[0].file.name.replace('.pdf', '-compressed.pdf')} onStartOver={() => { setFiles([]); setShowSuccess(false); clearUrls(); setIsProcessing(false); }} />
            </div>
          )}
        </div>
      )}
    </NativeToolLayout>
  )
}
