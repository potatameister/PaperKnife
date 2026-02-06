import { useState, useEffect } from 'react'
import { 
  History, Trash2, Download, CheckCircle2, 
  FileText, Clock, Shield, Search
} from 'lucide-react'
import { ActivityEntry, getRecentActivity, clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'

export default function AndroidHistoryView() {
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    getRecentActivity().then(setHistory)
  }, [])

  const handleClear = async () => {
    await clearActivity()
    setHistory([])
    toast.success('History cleared.')
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

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#1C1B1F] pb-32 transition-colors">
      {/* Top App Bar */}
      <header className="px-6 pt-14 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20">
               <History size={20} className="text-white" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Android Node</span>
          </div>
          {history.length > 0 && (
            <button 
              onClick={handleClear}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 active:bg-rose-50 dark:active:bg-rose-900/20 active:text-rose-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
        
        <h1 className="text-4xl font-black tracking-tighter dark:text-white mb-8">History</h1>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-500">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EEE8F4] dark:bg-[#2B2930] border-none rounded-[1.75rem] py-4 pl-14 pr-6 text-base font-bold placeholder:text-gray-500 focus:bg-white dark:focus:bg-[#36343B] transition-all dark:text-white outline-none shadow-sm"
          />
        </div>
      </header>

      <main className="px-4 space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-[#F3EDF7] dark:bg-[#2B2930] rounded-full flex items-center justify-center text-gray-400 mb-6">
              <Clock size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black dark:text-white tracking-tight">No files found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] mt-2">Processed documents will appear here automatically.</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} className="p-4 bg-white dark:bg-[#2B2930] rounded-[1.5rem] border border-gray-100 dark:border-transparent flex items-center gap-4 active:scale-[0.98] transition-all shadow-sm">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate dark:text-white">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{item.tool}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-[10px] text-gray-400 font-bold">{formatSize(item.size)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 {item.resultUrl && (
                    <a 
                      href={item.resultUrl} 
                      download={item.name} 
                      className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-full text-rose-500 active:scale-90 transition-transform"
                    >
                      <Download size={20} />
                    </a>
                 )}
              </div>
            </div>
          ))
        )}

        <div className="pt-10 flex flex-col items-center gap-2 pb-10 opacity-40">
           <Shield size={16} className="text-emerald-500" />
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 text-center">
             Encrypted History • Locally Stored Only
           </p>
        </div>
      </main>
    </div>
  )
}
