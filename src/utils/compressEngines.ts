/**
 * PaperKnife compress engines — shared by CompressTool UI and the local-only lab.
 * Single source of truth: bytes in, bytes out. Callers own toasts/state.
 */
import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFArray } from 'pdf-lib'

import { loadPdfDocument } from './pdfHelpers'
import { getProcessBytes } from './decryptInput'
import { t } from '../i18n'

export type CompressionQuality = 'low' | 'medium' | 'high'

export interface CompressEngineInput {
  file: File
  pageCount: number
  pdfDoc?: any
  password?: string
}

export interface EngineResult {
  url: string
  size: number
  buffer: Uint8Array
}

export interface CondenseStats {
  photos: number
  shrunk: number
  skippedMask: number
  skippedFormat: number
  skippedColor: number
  skippedSmall: number
  decodeFail: number
  noGain: number
  samples: string[]
}

export interface CondenseResult extends EngineResult {
  stats: CondenseStats
}

export const COMPRESS_TIERS: Record<CompressionQuality, { scale: number, jpegQ: number }> = {
  high: { scale: 1.0, jpegQ: 0.8 },
  medium: { scale: 1.0, jpegQ: 0.6 },
  low: { scale: 1.0, jpegQ: 0.3 }
}

export const CONDENSE_TIERS: Record<'high' | 'medium', { maxDim: number, jpegQ: number }> = {
  high: { maxDim: 2560, jpegQ: 0.8 },
  medium: { maxDim: 1920, jpegQ: 0.65 }
}

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(',')[1]
  const binaryString = window.atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j)
  return bytes
}

export const compressSingleFile = async (
  item: CompressEngineInput,
  quality: CompressionQuality,
  createUrl: (blob: Blob) => string,
  onProgress?: (p: number) => void
): Promise<EngineResult> => {
  const pdfDoc = item.pdfDoc || await loadPdfDocument(item.file)
  const { scale, jpegQ } = COMPRESS_TIERS[quality]
  const pagesData: { imageBytes: Uint8Array, width: number, height: number }[] = []
  for (let i = 1; i <= item.pageCount; i++) {
    const page = await pdfDoc.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) continue
    canvas.height = viewport.height
    canvas.width = viewport.width
    await page.render({ canvasContext: context, viewport }).promise
    const bytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', jpegQ))
    pagesData.push({ imageBytes: bytes, width: viewport.width, height: viewport.height })

    // Update progress during rasterization phase
    if (onProgress) onProgress(Math.round((i / item.pageCount) * 50)) // First 50% is rasterization
    canvas.width = 0
    canvas.height = 0
  }
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker(new URL('./pdfWorker.ts', import.meta.url), { type: 'module' })
      worker.postMessage({ type: 'COMPRESS_PDF_ASSEMBLY', payload: { pages: pagesData, quality } }, pagesData.map(p => p.imageBytes.buffer) as any)

      worker.onmessage = (e) => {
        if (e.data.type === 'PROGRESS') {
          if (onProgress) onProgress(50 + Math.round(e.data.payload * 0.5)) // Second 50% is assembly
        } else if (e.data.type === 'SUCCESS') {
          const blob = new Blob([e.data.payload], { type: 'application/pdf' })
          resolve({ url: createUrl(blob), size: blob.size, buffer: e.data.payload })
          worker.terminate()
        } else if (e.data.type === 'ERROR') {
          reject(new Error(e.data.payload))
          worker.terminate()
        }
      }

      worker.onerror = () => {
        reject(new Error(t("Worker failed to start or execution error.")))
        worker.terminate()
      }
    } catch (e: any) {
      reject(new Error(t("Failed to start worker: {0}", e.message)))
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

const resolveIccComponents = (context: any, cs: any): { ok: boolean, n: number } => {
  // ICCBased profiles (Word/Docs exports, encrypt rebuilds): accept Gray (N=1)
  // and RGB (N=3), keep rejecting CMYK (N=4) — canvas would wreck CMYK colors.
  // Indexed-over-RGB is also fine.
  const resolveRef = (o: any): any => {
    try {
      const r = context.lookup(o)
      return r === undefined ? o : r
    } catch {
      return o
    }
  }
  const iccN = (o: any): number => {
    const prof = resolveRef(o)
    const d = (prof as any)?.dict
    const nObj = d ? d.get(PDFName.of('N')) : undefined
    return nObj && typeof (nObj as any).asNumber === 'function' ? (nObj as any).asNumber() : 0
  }
  try {
    const arr = resolveRef(cs)
    if (arr instanceof PDFArray && arr.size() > 0) {
      const headObj = resolveRef(arr.get(0))
      const head = headObj ? headObj.toString() : ''
      if (head === '/ICCBased') {
        const n = iccN(arr.get(1))
        return { ok: n === 1 || n === 3, n }
      }
      if (head === '/Indexed') {
        const baseObj = resolveRef(arr.get(1))
        const bStr = baseObj ? baseObj.toString() : ''
        if (bStr.includes('RGB') || bStr.includes('Gray') || bStr.includes('Grey')) return { ok: true, n: 0 }
        const n = iccN(arr.get(1))
        return { ok: n === 1 || n === 3, n }
      }
    }
  } catch {
    // resolve failure — stays rejected
  }
  return { ok: false, n: -1 }
}

export const condenseImages = async (
  item: CompressEngineInput,
  maxDim: number,
  jpegQuality: number,
  createUrl: (blob: Blob) => string,
  onProgress?: (p: number) => void
): Promise<CondenseResult> => {
  // Condense: shrink embedded photos in place, keep text/vectors native.
  // No new deps, no WASM: pdf-lib walks the image XObjects, platform
  // canvas re-encodes the JPEGs. Mirrors PaperKnife+ NITRO numbers.
  const bytes = await getProcessBytes(item.file, item.password)
  let pdfDoc
  try {
    pdfDoc = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
  } catch {
    throw new Error(t("\"{0}\" could not be optimized.", item.file.name))
  }
  const context = (pdfDoc as any).context
  const MIN_IMAGE_BYTES = 10 * 1024
  const entries = context.enumerateIndirectObjects() as any[]
  const stats: CondenseStats = {
    photos: 0, shrunk: 0, skippedMask: 0, skippedFormat: 0,
    skippedColor: 0, skippedSmall: 0, decodeFail: 0, noGain: 0, samples: []
  }
  const sample = (s: string) => { if (stats.samples.length < 8) stats.samples.push(s) }
  for (let idx = 0; idx < entries.length; idx++) {
    const [ref, obj] = entries[idx]
    try {
      if (!(obj instanceof PDFRawStream)) continue
      const dict = obj.dict
      if (!dict) continue
      const subtype = dict.lookup(PDFName.of('Subtype'))
      if (!subtype || subtype.toString() !== '/Image') continue
      stats.photos++
      if (dict.lookup(PDFName.of('ImageMask'))) { stats.skippedMask++; continue }
      const filter = dict.lookup(PDFName.of('Filter'))
      const filterStr = filter ? filter.toString() : ''
      const cs = dict.lookup(PDFName.of('ColorSpace'))
      const csStr = cs ? cs.toString() : ''
      if (!filterStr.includes('DCTDecode') || filterStr.includes('JPXDecode')) {
        stats.skippedFormat++
        const bpc = dict.lookup(PDFName.of('BitsPerComponent'))
        sample(`filter=${filterStr || '(none)'} cs=${csStr.slice(0, 60) || '(none)'} bpc=${bpc ? bpc.toString() : '?'}`)
        continue
      }
      if (csStr && !csStr.includes('RGB') && !csStr.includes('Gray') && !csStr.includes('Grey')) {
        const iccResult = resolveIccComponents(context, cs)
        if (!iccResult.ok) { stats.skippedColor++; sample(`color-skipped filter=${filterStr} cs=${csStr.slice(0, 60)} n=${iccResult.n}`); continue }
      }
      const contents = obj.getContents() as Uint8Array
      if (!contents || contents.byteLength < MIN_IMAGE_BYTES) { stats.skippedSmall++; sample(`small ${(contents?.byteLength || 0)}B filter=${filterStr} cs=${csStr.slice(0, 40) || '(none)'}`); continue }
      let img: HTMLImageElement
      try {
        img = await decodeJpeg(contents)
      } catch { stats.decodeFail++; sample('decode-failed'); continue }
      const w = img.naturalWidth, h = img.naturalHeight
      if (!w || !h) { stats.decodeFail++; continue }
      const down = Math.min(1, maxDim / Math.max(w, h))
      const tw = Math.max(1, Math.round(w * down)), th = Math.max(1, Math.round(h * down))
      const canvas = document.createElement('canvas')
      canvas.width = tw
      canvas.height = th
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, tw, th)
      ctx.drawImage(img, 0, 0, tw, th)
      const fresh = dataUrlToBytes(canvas.toDataURL('image/jpeg', jpegQuality))
      canvas.width = 0
      canvas.height = 0
      if (fresh.byteLength >= contents.byteLength) { stats.noGain++; sample(`nogain ${contents.byteLength}B->${fresh.byteLength}B ${w}x${h}`); continue }
      dict.set(PDFName.of('Width'), PDFNumber.of(tw))
      dict.set(PDFName.of('Height'), PDFNumber.of(th))
      context.assign(ref, PDFRawStream.of(dict, fresh))
      stats.shrunk++
    } catch { /* per-image skip: masks, CMYK, odd filters stay untouched */ }
    if (onProgress && idx % 20 === 0) onProgress(Math.round((idx / entries.length) * 100))
  }
  if (stats.shrunk === 0) {
    const err: any = new Error(t("\"{0}\" photos could not be shrunk.", item.file.name))
    err.condenseStats = stats
    throw err
  }
  const out = await pdfDoc.save({ useObjectStreams: true })
  const buffer = new Uint8Array(out)
  const blob = new Blob([buffer as any], { type: 'application/pdf' })
  if (onProgress) onProgress(100)
  return { url: createUrl(blob), size: blob.size, buffer, stats }
}
