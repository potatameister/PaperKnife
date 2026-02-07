import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  ChevronRight,
  FileText,
  Layers, Zap, Scissors, Lock,
  Moon, Sun, LayoutGrid, Clock
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getRecentActivity, ActivityEntry } from '../utils/recentActivity'
import { PaperKnifeLogo } from './Logo'

interface AndroidViewProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export default function AndroidView({ theme, toggleTheme }: AndroidViewProps) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<ActivityEntry[]>([])

  useEffect(() => {
    getRecentActivity(3).then(setHistory)
  }, [])

  const quickActions = [
    { title: 'Merge', icon: Layers, path: '/merge', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { title: 'Compress', icon: Zap, path: '/compress', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Split', icon: Scissors, path: '/split', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Protect', icon: Lock, path: '/protect', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-black transition-colors">
      
      {/* Pro-Grade Compact AppBar */}
      <header className="px-6 pt-safe pb-4 sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95">
               <PaperKnifeLogo size={22} iconColor="#F43F5E" />
             </div>
             <div>
               <h1 className="text-sm font-black tracking-tight text-gray-900 dark:text-white leading-none">PaperKnife</h1>
               <p className="text-[8px] font-bold text-rose-500 uppercase tracking-[0.2em] mt-1">Local Processing Node</p>
             </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 flex-1 overflow-y-auto">
        
        {/* Modern Status Widget */}
        <section className="animate-in fade-in zoom-in duration-500">
           <div className="relative bg-zinc-900 dark:bg-zinc-100 rounded-[2.5rem] p-6 overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex items-start justify-between mb-4">
                 <div className="p-3 bg-white/10 dark:bg-black/5 rounded-2xl">
                    <Shield className="text-rose-500" size={24} />
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Active</span>
                 </div>
              </div>
              <h4 className="font-black text-xl text-white dark:text-black tracking-tight mb-1">Privacy Guard Active</h4>
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed">
                Zero data persistence enabled. All PDF modifications are performed within your device's private memory heap.
              </p>
           </div>
        </section>

        {/* High-Density Action Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Quick Services</h3>
            <button onClick={() => navigate('/android-tools')} className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1">
              Explore <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col items-start gap-4 shadow-sm active:scale-95 transition-all group"
              >
                <div className={`p-3 ${action.bg} ${action.color} rounded-2xl group-active:rotate-12 transition-transform`}>
                  <action.icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{action.title}</span>
                  <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Optimized</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Activity Feed */}
        {history.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Recent Node Activity</h3>
              <button onClick={() => navigate('/android-history')} className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-gray-100 dark:border-white/5">
                <Clock size={14} className="text-zinc-400" />
              </button>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 overflow-hidden shadow-sm">
              {history.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => navigate('/android-history')}
                  className="w-full p-4 flex items-center gap-4 active:bg-gray-50 dark:active:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold truncate dark:text-white">{item.name}</p>
                    <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">{item.tool} Utility</p>
                  </div>
                  <ChevronRight size={14} className="text-zinc-300" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Catalog Trigger */}
        <section className="pb-8">
           <button 
             onClick={() => navigate('/android-tools')}
             className="w-full p-6 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] flex items-center justify-between border border-transparent active:border-rose-500/30 transition-all group"
           >
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-white dark:bg-black rounded-2xl shadow-sm text-rose-500">
                    <LayoutGrid size={24} />
                 </div>
                 <div className="text-left">
                    <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">Full Toolbox</h4>
                    <p className="text-[10px] font-medium text-zinc-400">All 15 professional PDF nodes</p>
                 </div>
              </div>
              <ChevronRight size={20} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
           </button>
        </section>
      </main>
    </div>
  )
}
