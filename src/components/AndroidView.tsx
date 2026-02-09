import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  ChevronRight,
  FileText,
  Layers, Zap, Scissors, Lock,
  Moon, Sun, Upload, Cpu, ShieldCheck,
  LayoutGrid, Sparkles, Clock
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getRecentActivity, ActivityEntry } from '../utils/recentActivity'
import { PaperKnifeLogo } from './Logo'

interface AndroidViewProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  onFileSelect?: (file: File) => void
}

export default function AndroidView({ theme, toggleTheme, onFileSelect }: AndroidViewProps) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getRecentActivity(3).then(setHistory)
  }, [])

  const quickActions = [
    { title: 'Merge', icon: Layers, path: '/merge', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { title: 'Compress', icon: Zap, path: '/compress', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Split', icon: Scissors, path: '/split', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Protect', icon: Lock, path: '/protect', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-black transition-colors pb-32">
      <input 
        type="file" 
        accept=".pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      {/* Titan Minimal Header */}
      <header className="px-6 pt-safe pb-2 sticky top-0 z-50 bg-[#FAFAFA]/90 dark:bg-black/90 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
             <PaperKnifeLogo size={24} iconColor="#F43F5E" />
             <span className="text-lg font-black tracking-tighter text-gray-900 dark:text-white">PaperKnife</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6 flex-1 overflow-y-auto">
        
        {/* New Hero: Sleek Upload Section */}
        <section className="relative">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-zinc-900 dark:bg-zinc-100 rounded-[2.5rem] p-8 text-left relative overflow-hidden shadow-2xl group active:scale-[0.98] transition-all"
           >
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-[80px] -mr-20 -mt-20 opacity-40 dark:opacity-20 group-active:opacity-60 transition-opacity" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                 <div className="flex justify-between items-start mb-12">
                    <div className="p-4 bg-white/10 dark:bg-black/5 rounded-2xl backdrop-blur-md text-white dark:text-black">
                       <Upload size={32} strokeWidth={2.5} />
                    </div>
                    <div className="px-4 py-2 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/40">
                       PRO READY
                    </div>
                 </div>
                 <div>
                    <h2 className="text-4xl font-black text-white dark:text-black tracking-tight leading-none mb-2">Select PDF</h2>
                    <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Fast, local, and encrypted processing.</p>
                 </div>
              </div>
           </button>
        </section>

        {/* Engine Dashboard */}
        <section className="grid grid-cols-2 gap-3">
           <div className="col-span-2 px-2 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Core Dashboard</h3>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 OFFLINE NODE
              </div>
           </div>
           
           {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col gap-4 shadow-sm active:scale-95 transition-all group"
              >
                <div className={`w-12 h-12 ${action.bg} ${action.color} rounded-2xl flex items-center justify-center group-active:scale-110 transition-transform`}>
                  <action.icon size={24} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                   <span className="text-sm font-bold text-gray-900 dark:text-white block">{action.title}</span>
                   <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">System Tool</span>
                </div>
              </button>
            ))}

            <button
              onClick={() => navigate('/android-tools')}
              className="p-5 bg-rose-500 text-white rounded-[2rem] flex flex-col gap-4 shadow-lg shadow-rose-500/20 active:scale-95 transition-all col-span-2 relative overflow-hidden group"
            >
               <div className="absolute right-0 top-0 p-8 opacity-20 -mr-4 -mt-4 group-active:scale-110 transition-transform">
                  <LayoutGrid size={80} />
               </div>
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center relative z-10">
                  <Sparkles size={24} strokeWidth={2.5} />
               </div>
               <div className="text-left relative z-10">
                  <span className="text-lg font-black block">More Engines</span>
                  <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Explore Full Catalog</span>
               </div>
            </button>
        </section>

        {/* History Section - Persistent */}
        <section className="pb-10">
          <div className="flex items-center justify-between px-2 mb-4">
             <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Activity Stream</h3>
             </div>
             {history.length > 0 && (
                <button onClick={() => navigate('/android-history')} className="text-[10px] font-black uppercase text-rose-500">View All</button>
             )}
          </div>
          
          {history.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-2 shadow-sm">
              {history.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => navigate('/android-history')}
                  className="w-full p-4 flex items-center gap-4 rounded-[1.75rem] active:bg-gray-50 dark:active:bg-white/5 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center shrink-0 text-gray-400 dark:text-zinc-500">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.tool} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border-4 border-dashed border-gray-100 dark:border-white/5 rounded-[2.5rem]">
               <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <ShieldCheck size={32} />
               </div>
               <h4 className="text-sm font-bold text-gray-400 dark:text-zinc-600 mb-1">Vault is Empty</h4>
               <p className="text-[10px] font-medium text-gray-300 dark:text-zinc-700 uppercase tracking-[0.2em]">Start processing to see activity</p>
            </div>
          )}
        </section>

        {/* Status Badge */}
        <div className="flex flex-col items-center gap-3 py-8 opacity-40">
           <Shield className="text-emerald-500" size={20} />
           <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] dark:text-white">Active Privacy Shield</p>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Local Processing Enabled</p>
           </div>
        </div>

      </main>
    </div>
  )
}
