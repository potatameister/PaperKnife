import { useState, useEffect } from 'react'
import { 
  Download as DownloadIcon, 
  Clock as HistoryIcon, Shield as ShieldIcon, Search as SearchIcon, FileText as FileTextIcon, ChevronRight as ChevronRightIcon, X as XIcon, Trash2 as Trash2Icon, Calendar as CalendarIcon, HardDrive as HardDriveIcon
} from 'lucide-react'
import { ActivityEntry, getRecentActivity, deleteActivityItem, createBlobUrl } from '../utils/recentActivity'
import { toast } from 'sonner'

export default function AndroidHistoryView() {
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<ActivityEntry | null>(null)

  useEffect(() => {
    const limitSetting = localStorage.getItem('historyLimit')
    const limit = limitSetting === '999' ? 100 : parseInt(limitSetting || '20')
    getRecentActivity(limit).then(setHistory)
  }, [])

  const handleDelete = async (id: string) => {
    await deleteActivityItem(id)
    setHistory(prev => prev.filter(item => item.id !== id))
    setSelectedItem(null)
    toast.success('Removed from history')
  }

  const handleDownload = (item: ActivityEntry) => {
    if (!item.buffer) {
      toast.error('File data not available')
      return
    }
    const blobUrl = createBlobUrl(item.buffer, item.name)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = item.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
    toast.success('Download started')
    setSelectedItem(null)
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black pb-32 transition-colors">
      {/* Bottom Sheet Overlay */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[2.5rem] pt-6 px-6 pb-[calc(env(safe-area-inset-bottom)+7rem)] animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gray-50 dark:bg-zinc-800 text-gray-400 rounded-2xl flex items-center justify-center">
                <FileTextIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black truncate dark:text-white">{selectedItem.name}</p>
                <p className="text-xs text-gray-400">{selectedItem.tool} • {formatSize(selectedItem.size)}</p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {selectedItem.buffer ? (
                <button 
                  onClick={() => handleDownload(selectedItem)}
                  className="w-full flex items-center gap-4 p-4 bg-rose-500 text-white rounded-2xl font-black active:scale-[0.98] transition-all"
                >
                  <DownloadIcon size={20} />
                  <span>Download</span>
                </button>
              ) : (
                <div className="w-full flex items-center gap-4 p-4 bg-gray-100 dark:bg-zinc-800 text-gray-400 rounded-2xl font-black">
                  <DownloadIcon size={20} />
                  <span>File not available</span>
                </div>
              )}
              
              <button 
                onClick={() => handleDelete(selectedItem.id)}
                className="w-full flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl font-black active:scale-[0.98] transition-all"
              >
                <Trash2Icon size={20} />
                <span>Delete from History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Header with Icon */}
        <div className="flex items-center gap-4 px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
           <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 text-white shrink-0">
              <HistoryIcon size={24} strokeWidth={2.5} />
           </div>
           <div>
              <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none mb-1">Activity</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">History</p>
           </div>
        </div>

        {/* Search */}
        <div className="px-6">
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
        </div>
      </div>

      <main className="px-6 space-y-4 mt-4 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
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
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="p-4 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 flex items-center gap-4 active:scale-[0.99] transition-all shadow-sm group cursor-pointer"
            >
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
              </div>
              <ChevronRightIcon size={16} className="text-gray-200 dark:text-zinc-800" />
            </div>
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
    </div>
  )
}
