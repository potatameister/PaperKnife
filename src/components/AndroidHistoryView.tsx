import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Download as DownloadIcon,
  Clock as HistoryIcon, Shield as ShieldIcon, Search as SearchIcon, FileText as FileTextIcon, ChevronRight as ChevronRightIcon, X as XIcon, Trash2 as Trash2Icon, Calendar as CalendarIcon, HardDrive as HardDriveIcon, Share2 as ShareIcon, FolderOpen as OpenIcon
} from 'lucide-react'
import { ActivityEntry, getRecentActivity, clearActivity, deleteActivity } from '../utils/recentActivity'
import { downloadFile, shareFile } from '../utils/pdfHelpers'
import { usePipeline } from '../utils/pipelineContext'
import { useBackHandler } from '../utils/backHandler'
import PdfPreview from './PdfPreview'
import { toast } from 'sonner'

// Originating tool route for preview's "+" (process) action (zip outputs offer Download/Share/Delete only)
const TOOL_ROUTES: Record<string, string> = {
  'Merge': '/merge', 'Split': '/split', 'Compress': '/compress', 'Protect': '/protect',
  'Unlock': '/unlock', 'Rotate': '/rotate-pdf', 'Rearrange': '/rearrange-pdf',
  'Page Numbers': '/page-numbers', 'Watermark': '/watermark', 'Metadata': '/metadata',
  'Signature': '/signature', 'Grayscale': '/grayscale', 'Image to PDF': '/image-to-pdf',
  'Repair': '/repair'
}

export default function AndroidHistoryView() {
  const navigate = useNavigate()
  const { setPipelineFile } = usePipeline()
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<ActivityEntry | null>(null)
  const [previewItem, setPreviewItem] = useState<ActivityEntry | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  // Hardware back button: preview first, then the action sheet
  useBackHandler(!!previewItem, () => setPreviewItem(null))
  useBackHandler(!!selected && !previewItem, () => setSelected(null))

  useEffect(() => {
    const limitSetting = localStorage.getItem('historyLimit')
    const limit = limitSetting === '999' ? 100 : parseInt(limitSetting || '10')
    getRecentActivity(limit).then(setHistory)
  }, [])

  const handleClear = async () => {
    toast('Wipe all history?', {
      id: 'history-wipe-confirm',
      action: {
        label: 'Confirm',
        onClick: async () => {
          await clearActivity()
          setHistory([])
          toast.success('History wiped', { id: 'history-wipe-done' })
          toast.dismiss('history-wipe-confirm')
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => toast.dismiss('history-wipe-confirm')
      }
    })
  }

  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tool.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const mimeOf = (item: ActivityEntry) => item.name.endsWith('.zip') ? 'application/zip' : 'application/pdf'
  const routeOf = (item: ActivityEntry) => !item.name.endsWith('.zip') ? TOOL_ROUTES[item.tool] : undefined
  const canPreview = (item: ActivityEntry) => !!item.buffer && !item.name.endsWith('.zip')

  const handleOpen = (item: ActivityEntry) => {
    if (!canPreview(item)) return
    setPreviewItem(item)
    setSelected(null)
  }

  const handlePreviewProcess = () => {
    if (!previewItem?.buffer) return
    const route = routeOf(previewItem)
    setPipelineFile({ buffer: previewItem.buffer, name: previewItem.name, type: mimeOf(previewItem) })
    setPreviewItem(null)
    if (route) { navigate(route); toast.success(`Opened in ${previewItem.tool}`) }
    else toast.success('Sent to tools')
  }

  const handleDownload = async (item: ActivityEntry) => {
    if (busy) return
    setBusy('download')
    try {
      if (item.buffer) await downloadFile(item.buffer, item.name, mimeOf(item))
      else if (item.resultUrl) await downloadFile(item.resultUrl, item.name, mimeOf(item))
      else { toast.error('File expired — please re-process'); return }
      toast.success('Saved')
    } catch { toast.error('Download failed') } finally { setBusy(null) }
  }

  const handleShare = async (item: ActivityEntry) => {
    if (busy) return
    setBusy('share')
    try {
      if (item.buffer) await shareFile(item.buffer, item.name, mimeOf(item))
      else if (item.resultUrl) await shareFile(item.resultUrl, item.name, mimeOf(item))
      else { toast.error('File expired — please re-process'); return }
    } catch { toast.error('Share failed') } finally { setBusy(null) }
  }

  const handleDelete = async (item: ActivityEntry) => {
    await deleteActivity(item.id)
    setHistory(prev => prev.filter(h => h.id !== item.id))
    setSelected(null)
    toast.success('Deleted from history')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black pb-32 transition-colors">
      <header className="px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 sticky top-0 bg-[#FAFAFA]/90 dark:bg-black/90 backdrop-blur-xl z-50 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col text-left">
            <h1 className="text-3xl font-black tracking-tighter dark:text-white">Activity</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 opacity-80">Local Storage Active</p>
          </div>
          {history.length > 0 && (
            <button 
              onClick={handleClear}
              className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl active:scale-90 transition-all shadow-sm"
            >
              <Trash2Icon size={20} />
            </button>
          )}
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-rose-500 transition-colors">
            <SearchIcon size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold placeholder:text-gray-400 focus:bg-white dark:focus:bg-zinc-800 shadow-sm outline-none transition-all dark:text-white"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-6 space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-[2.5rem] flex items-center justify-center text-gray-300 mb-6 border border-gray-100 dark:border-white/5">
              <HistoryIcon size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black dark:text-white tracking-tight">Everything Clear</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-500 max-w-[200px] mt-2 font-medium leading-relaxed">Documents processed on this device will appear here temporarily.</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <button key={item.id} onClick={() => setSelected(item)} className="w-full p-4 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 flex items-center gap-4 active:scale-[0.99] transition-all shadow-sm group text-left">
              <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 text-gray-400 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 group-hover:text-rose-500 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-inner">
                <FileTextIcon size={22} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-black truncate dark:text-white mb-0.5">{item.name}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[9px] text-gray-400 font-black uppercase tracking-tighter bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                    {item.tool}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                    <HardDriveIcon size={10} /> {formatSize(item.size)}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                    <CalendarIcon size={10} /> {formatDate(item.timestamp)}
                  </div>
                </div>
                {!item.buffer && !item.resultUrl && (
                  <p className="text-[9px] font-bold text-amber-500 mt-1">Expired — re-process to use again</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                 {(item.buffer || item.resultUrl) && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); handleDownload(item) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDownload(item) } }}
                      className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20 active:scale-90 transition-all"
                    >
                      <DownloadIcon size={18} />
                    </span>
                 )}
                 <ChevronRightIcon size={16} className="text-gray-200 dark:text-zinc-800" />
              </div>
            </button>
          ))
        )}

        <div className="pt-12 flex flex-col items-center gap-3 pb-10 opacity-30">
           <div className="flex items-center gap-2">
             <ShieldIcon size={14} className="text-emerald-500" />
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">Privacy Protocol</span>
           </div>
           <p className="text-[7px] font-medium text-gray-400 max-w-[200px] text-center">
             Documents are processed locally in your private environment. Activity logs are stored on this device only.
           </p>
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 pb-2">
              <p className="text-xs font-black truncate dark:text-white">{selected.name}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1">{selected.tool} • {formatSize(selected.size)} • {formatDate(selected.timestamp)}</p>
              {!selected.buffer && !selected.resultUrl && (
                <p className="text-[10px] font-bold text-amber-500 mt-2">File bytes expired — only Delete is available.</p>
              )}
            </div>
            <div className="p-4 space-y-2">
              {canPreview(selected) && (
                <button onClick={() => handleOpen(selected)} className="w-full p-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <OpenIcon size={16} /> Preview
                </button>
              )}
              <div className="flex gap-2">
                <button disabled={busy !== null || (!selected.buffer && !selected.resultUrl)} onClick={() => handleDownload(selected)} className="flex-1 p-4 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                  <DownloadIcon size={16} /> {busy === 'download' ? 'Saving…' : 'Download'}
                </button>
                <button disabled={busy !== null || (!selected.buffer && !selected.resultUrl)} onClick={() => handleShare(selected)} className="flex-1 p-4 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                  <ShareIcon size={16} /> {busy === 'share' ? 'Sharing…' : 'Share'}
                </button>
              </div>
              <button onClick={() => handleDelete(selected)} className="w-full p-4 text-rose-500 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Trash2Icon size={16} /> Delete
              </button>
              <button onClick={() => setSelected(null)} className="w-full p-3 text-gray-400 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2">
                <XIcon size={14} /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {previewItem?.buffer && (
        <PdfPreview
          file={new File([new Uint8Array(previewItem.buffer)], previewItem.name, { type: mimeOf(previewItem) })}
          onClose={() => setPreviewItem(null)}
          onProcess={handlePreviewProcess}
        />
      )}
    </div>
  )
}