/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Minus, Loader2, Lock, Share2, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { loadPdfDocument, renderPageThumbnail, renderGridThumbnail, shareFile, unlockPdf } from '../utils/pdfHelpers'
import { useBackHandler } from '../utils/backHandler'
import { PaperKnifeLogo } from './Logo'
import { t } from '../i18n'

interface PdfPreviewProps {
  file: File
  onClose: () => void
  onProcess: () => void
}

const ZOOM_LEVELS = [1, 1.5, 2, 3]
const LOW_SCALE = 2.0
const HI_SCALE = 3.5

const LazyPage = ({ pdfDoc, pageNum, hiRes, calmRef, calmTick }: {
  pdfDoc: any, pageNum: number, hiRes: boolean,
  calmRef: React.MutableRefObject<boolean>, calmTick: number,
}) => {
  const [lo, setLo] = useState<string | null>(null)
  const [img, setImg] = useState<string | null>(null)
  const [hiImg, setHiImg] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderState = useRef({ lo: false, full: false, hi: false, running: false })

  useEffect(() => {
    const el = containerRef.current
    if (!el || !pdfDoc) return
    let cancelled = false

    // Progressive: tiny grid bitmap first (instant scroll), full bitmap when
    // calm, hi-res only at max zoom. Upgrades pause mid-gesture (calm gate)
    // and resume via calmTick so gestures never compete with raster work.
    const render = async () => {
      const st = renderState.current
      if (st.running) return
      const calm = calmRef.current
      const needLo = !st.lo
      const needFull = !st.full && calm
      const needHi = hiRes && !st.hi && calm
      if (!needLo && !needFull && !needHi) return
      st.running = true
      try {
        if (needLo) {
          const data = await renderGridThumbnail(pdfDoc, pageNum)
          if (!cancelled && data) { setLo(data); st.lo = true }
        }
        if (needFull) {
          const data = await renderPageThumbnail(pdfDoc, pageNum, LOW_SCALE, 1.5)
          if (!cancelled && data) { setImg(data); st.full = true }
        }
        if (needHi) {
          const data = await renderPageThumbnail(pdfDoc, pageNum, HI_SCALE, 2)
          if (!cancelled && data) { setHiImg(data); st.hi = true }
        }
      } finally {
        st.running = false
      }
    }

    // Observer stays alive so pages entering view (or calming down after a
    // gesture) render/upgrade on demand instead of all pages at once.
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) render()
    }, { rootMargin: '400px' })
    observer.observe(el)
    return () => { cancelled = true; observer.disconnect() }
  }, [pdfDoc, pageNum, hiRes, calmTick])

  const src = hiRes && hiImg ? hiImg : img ? img : lo

  return (
    <div
      ref={containerRef}
      data-page-num={pageNum}
      className="relative w-full [-webkit-touch-callout:none] [content-visibility:auto] [contain-intrinsic-size:auto_1000px]"
    >
      <div
        className="bg-white p-0 rounded-none shadow-none group relative overflow-hidden w-full max-w-full flex items-center justify-center min-h-[300px]"
      >
        {src ? (
          <img
            src={src}
            alt={t("Page {0}", pageNum)}
            decoding="async"
            className="max-w-full h-auto object-contain select-none"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 py-20">
             <Loader2 className="w-6 h-6 text-zinc-800 animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PdfPreview({ file, onClose, onProcess }: PdfPreviewProps) {
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [password, setPassword] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [scale, setScale] = useState(1)
  const [committedHi, setCommittedHi] = useState(false)
  const [calmTick, setCalmTick] = useState(0)

  const mainRef = useRef<HTMLElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  // liveRef is the visual truth mid-gesture; React state commits on release,
  // so no render ever happens inside the gesture path (the smoothness core).
  const liveRef = useRef(1)
  const pinchRef = useRef<{ d: number, cx: number, cy: number } | null>(null)
  const tapRef = useRef<{ t: number, x: number, y: number } | null>(null)
  const hiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)
  const pendingRef = useRef<{ s: number, cx: number, cy: number } | null>(null)
  const calmRef = useRef(true)
  const pctEls = useRef<Array<HTMLSpanElement | null>>([])

  const hiRes = committedHi

  const setPct = (s: number) => {
    const label = `${Math.round(s * 100)}%`
    pctEls.current.forEach(el => { if (el) el.textContent = label })
  }

  // Bitmap upgrades pause while busy, resume via calmTick when calm again.
  const markBusy = () => { calmRef.current = false }
  const markCalm = () => {
    if (!calmRef.current) {
      calmRef.current = true
      setCalmTick(t => t + 1)
    }
  }
  const cancelAnim = () => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }

  const mainPoint = (clientX: number, clientY: number) => {
    const r = mainRef.current?.getBoundingClientRect()
    return { cx: clientX - (r?.left ?? 0), cy: clientY - (r?.top ?? 0) }
  }

  const applyPaint = (s: number, cx: number, cy: number) => {
    const main = mainRef.current
    const pages = pagesRef.current
    if (!main || !pages) return
    const sOld = liveRef.current
    liveRef.current = s
    if (s === sOld) return
    const px = (main.scrollLeft + cx) / sOld
    const py = (main.scrollTop + cy) / sOld
    pages.style.transform = `scale(${s})`
    main.scrollLeft = px * s - cx
    main.scrollTop = py * s - cy
    setPct(s)
  }

  // Direct-DOM scale coalesced to one write per frame: transform + focal
  // scroll, no React render. The focal point stays pinned under (cx, cy).
  const paintScale = (raw: number, cx: number, cy: number) => {
    pendingRef.current = { s: Math.min(3, Math.max(1, raw)), cx, cy }
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const p = pendingRef.current
      pendingRef.current = null
      if (p) applyPaint(p.s, p.cx, p.cy)
    })
  }

  const commitScale = (s: number) => {
    liveRef.current = s
    setScale(s)
    setPct(s)
  }

  const queueHiUpgrade = (target: number) => {
    if (hiTimer.current) { clearTimeout(hiTimer.current); hiTimer.current = null }
    if (target === 3) hiTimer.current = setTimeout(() => setCommittedHi(true), 200)
  }

  // Spring-settle: glide live -> target over ~160ms ease-out (Ultra feel),
  // focal-anchored throughout, upgrades resume when settled.
  const animateTo = (target: number, cx: number, cy: number) => {
    cancelAnim()
    const main = mainRef.current
    const pages = pagesRef.current
    markBusy()
    // `from` must be captured before commitScale overwrites liveRef.
    const from = liveRef.current
    commitScale(target)
    queueHiUpgrade(target)
    if (!main || !pages) { markCalm(); return }
    if (Math.abs(from - target) < 0.001) {
      applyPaint(target, cx, cy)
      markCalm()
      return
    }
    const px = (main.scrollLeft + cx) / (from || 1)
    const py = (main.scrollTop + cy) / (from || 1)
    const t0 = performance.now()
    const dur = 160
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      const s = from + (target - from) * e
      liveRef.current = s
      pages.style.transform = `scale(${s})`
      main.scrollLeft = px * s - cx
      main.scrollTop = py * s - cy
      setPct(s)
      if (k < 1) animRef.current = requestAnimationFrame(step)
      else { animRef.current = null; markCalm() }
    }
    animRef.current = requestAnimationFrame(step)
  }

  const snapRelease = (cx: number, cy: number) => {
    const s = liveRef.current
    const snapped = ZOOM_LEVELS.reduce((a, b) => Math.abs(b - s) < Math.abs(a - s) ? b : a)
    animateTo(snapped, cx, cy)
  }

  const stepZoom = (dir: 1 | -1) => {
    const main = mainRef.current
    const cx = (main?.clientWidth ?? 0) / 2
    const cy = (main?.clientHeight ?? 0) / 2
    const s = liveRef.current
    const target = dir === 1
      ? ZOOM_LEVELS.find(l => l > s + 0.001) ?? 3
      : [...ZOOM_LEVELS].reverse().find(l => l < s - 0.001) ?? 1
    animateTo(target, cx, cy)
  }
  const zoomIn = () => stepZoom(1)
  const zoomOut = () => stepZoom(-1)

  // Chromium-model pinch: incremental ratio every frame, midpoint-anchored,
  // painted straight to the DOM. Bitmap work suspends until release.
  // Single-finger scroll untouched.
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const d = Math.hypot(dx, dy)
    const { cx, cy } = mainPoint(
      (e.touches[0].clientX + e.touches[1].clientX) / 2,
      (e.touches[0].clientY + e.touches[1].clientY) / 2,
    )
    const p = pinchRef.current
    if (!p || p.d === 0 || d === 0) {
      cancelAnim()
      markBusy()
      pinchRef.current = { d: d || 1, cx, cy }
      tapRef.current = null
      return
    }
    paintScale(liveRef.current * (d / p.d), cx, cy)
    pinchRef.current = { d, cx, cy }
  }

  // Double-tap on touchstart pairs (most reliable signal), 100% <-> 200%.
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) { tapRef.current = null; return }
    const t = e.touches[0]
    const now = Date.now()
    const last = tapRef.current
    if (last && now - last.t < 300 && Math.hypot(t.clientX - last.x, t.clientY - last.y) < 12) {
      cancelAnim()
      const { cx, cy } = mainPoint(t.clientX, t.clientY)
      animateTo(liveRef.current > 1.5 ? 1 : 2, cx, cy)
      tapRef.current = null
    } else {
      tapRef.current = { t: now, x: t.clientX, y: t.clientY }
    }
  }

  const onTouchEnd = () => {
    const p = pinchRef.current
    pinchRef.current = null
    if (p) snapRelease(p.cx, p.cy)
  }

  // Hardware back button closes the preview (ordered via shared stack)
  useBackHandler(true, onClose)

  // Reset zoom whenever a different file is previewed
  useEffect(() => {
    cancelAnim()
    liveRef.current = 1
    setScale(1)
    setPct(1)
    setCommittedHi(false)
    pinchRef.current = null
    tapRef.current = null
    calmRef.current = true
    if (pagesRef.current) pagesRef.current.style.transform = 'scale(1)'
  }, [file])

  useEffect(() => {
    let cancelled = false
    let doc: any = null
    const load = async () => {
      setIsLoading(true)
      try {
        doc = await loadPdfDocument(file)
        if (cancelled) { try { await doc.destroy(); } catch { /* ignore */ } return }
        setPdfDoc(doc)
        setTotalPages(doc.numPages)
      } catch (err: any) {
        if (err.name === 'PasswordException') {
          setIsLocked(true)
        }
        console.error('Preview load error:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()

    return () => {
      cancelled = true
      ;(async () => {
        if (doc) { try { await doc.destroy(); } catch { /* ignore */ } }
        setPdfDoc((prev: any) => { if (prev && prev !== doc) { try { prev.destroy(); } catch { /* ignore */ } } return null });
      })()
    }
  }, [file, onClose])

  const handleUnlock = async () => {
    if (!password) return
    setIsUnlocking(true)
    try {
      const result = await unlockPdf(file, password)
      if (result.success) {
        setPdfDoc(result.pdfDoc)
        setTotalPages(result.pageCount)
        setIsLocked(false)
        toast.success(t("Document unlocked"))
      } else {
        toast.error(t("Incorrect password"))
      }
    } catch (e) {
      toast.error(t("Failed to unlock"))
    } finally {
      setIsUnlocking(false)
    }
  }

  // Transform-immune page indicator: most-visible page wins. Visual rects
  // inflate under zoom (page 1 would cover the midpoint forever), while the
  // observer maps through transforms correctly.
  useEffect(() => {
    const main = mainRef.current
    const pages = pagesRef.current
    if (!main || !pages || totalPages === 0) return
    const visible = new Map<number, number>()
    const pick = () => {
      let best = 1
      let bestRatio = -1
      visible.forEach((ratio, page) => {
        if (ratio > bestRatio || (ratio === bestRatio && page < best)) {
          best = page
          bestRatio = ratio
        }
      })
      setCurrentPage(best)
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        const page = Number((en.target as HTMLElement).dataset.pageNum)
        if (en.isIntersecting) visible.set(page, en.intersectionRatio)
        else visible.delete(page)
      })
      pick()
    }, { root: main, threshold: [0, 0.25, 0.5, 0.75, 1] })
    pages.querySelectorAll('[data-page-num]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [pdfDoc, totalPages])

  const handleShare = async () => {
    const buffer = await file.arrayBuffer()
    await shareFile(new Uint8Array(buffer), file.name, file.type)
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[500] bg-zinc-950 flex flex-col animate-in fade-in duration-300 overflow-hidden overscroll-none"
    >
      
      {/* Fixed Header - Always Visible */}
      <header className="fixed top-0 inset-x-0 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4 bg-zinc-900/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-50 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 active:bg-white/10 active:text-white transition-all"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
             <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-xl shrink-0">
                <PaperKnifeLogo size={20} iconColor="#F43F5E" partColor="#000000" />
             </div>
             <div className="hidden sm:block min-w-0">
                <h2 className="text-sm font-black text-white truncate max-w-[140px] leading-tight">{file.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{t("Secure View")}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-white/5 border border-white/5 rounded-2xl p-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={zoomOut}
              disabled={scale <= 1}
              aria-label={t("Zoom out")}
              className="w-8 h-8 flex items-center justify-center text-zinc-300 rounded-xl active:bg-white/10 transition-all disabled:opacity-30"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <span ref={el => { pctEls.current[0] = el }} className="text-[10px] font-black text-zinc-300 w-9 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              aria-label={t("Zoom in")}
              className="w-8 h-8 flex items-center justify-center text-zinc-300 rounded-xl active:bg-white/10 transition-all disabled:opacity-30"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }} 
            className="w-10 h-10 flex items-center justify-center bg-white/5 text-zinc-300 rounded-2xl active:bg-white/10 transition-all border border-white/5"
          >
            <Share2 size={18} strokeWidth={2.5} />
          </button>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onProcess();
            }}
            className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 active:bg-rose-600 transition-all border border-rose-400/20"
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </header>

      {/* Main Content - Scrollable List of Pages */}
      <main
        ref={mainRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        className="flex-1 overflow-auto bg-zinc-950 scrollbar-hide overscroll-none touch-pan-x touch-pan-y"
      >
        <div className="min-h-full flex flex-col items-center pt-24 pb-24 space-y-0">
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">{t("Decoding Layers...")}</p>
            </div>
          )}

          {isLocked ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-rose-500/20">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter mb-3">{t("Layer Protected")}</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed mb-8">{t("This document is encrypted. Enter the password to view the contents.")}</p>
              
              <div className="w-full max-w-xs space-y-3 mb-10">
                 <input 
                   type="password" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                   placeholder={t("Enter Password")}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-center outline-none focus:border-rose-500 transition-all"
                   autoFocus
                 />
                 <button 
                   onClick={handleUnlock}
                   disabled={!password || isUnlocking}
                   className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {isUnlocking ? <Loader2 className="animate-spin" size={16} /> : <Unlock size={16} />} 
                   {t("Unlock Layer")}
                 </button>
              </div>

              <button 
                onClick={onProcess} 
                className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors"
              >
                {t("Tool Selection")}
              </button>
            </div>
          ) : (
            <div
              ref={pagesRef}
              className="w-full max-w-3xl mx-auto"
              style={{ transformOrigin: '0 0' }}
            >
              {Array.from({ length: totalPages }).map((_, idx) => (
                <LazyPage
                  key={idx}
                  pdfDoc={pdfDoc}
                  pageNum={idx + 1}
                  hiRes={hiRes}
                  calmRef={calmRef}
                  calmTick={calmTick}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Status Bar - Always Visible */}
      <footer className="fixed bottom-0 inset-x-0 px-6 py-4 bg-zinc-900/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 z-50 pb-[calc(env(safe-area-inset-bottom)+1rem)]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 opacity-60">
             <span>{(file.size / (1024*1024)).toFixed(2)} MB</span>
             <span className="opacity-30">•</span>
             <span>{t("PDF Document")}</span>
          </div>
         <div className="text-zinc-400 font-bold tracking-[0.1em]">
            <span ref={el => { pctEls.current[1] = el }}>{Math.round(scale * 100)}%</span> • {currentPage} / {totalPages}
         </div>
      </footer>
    </div>,
    document.body
  )
}