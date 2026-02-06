import { useNavigate } from 'react-router-dom'
import { 
  Search, Shield, Info,
  Download, ChevronRight,
  FileText, Settings2, Sparkles,
  Layers, Zap, Scissors, Lock
} from 'lucide-react'
import { Tool, ToolCategory } from '../types'
import { useState, useMemo, useEffect } from 'react'
import { getRecentActivity, ActivityEntry } from '../utils/recentActivity'

const categoryColors: Record<ToolCategory, { bg: string, text: string, icon: string, border: string }> = {
  Edit: { bg: 'bg-rose-50 dark:bg-rose-900/10', text: 'text-rose-600 dark:text-rose-400', icon: 'text-rose-500', border: 'border-rose-100/50 dark:border-rose-900/20' },
  Secure: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', text: 'text-indigo-600 dark:text-indigo-400', icon: 'text-indigo-500', border: 'border-indigo-100/50 dark:border-indigo-900/20' },
  Convert: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500', border: 'border-emerald-100/50 dark:border-emerald-900/20' },
  Optimize: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500', border: 'border-amber-100/50 dark:border-amber-900/20' }
}

const PaperKnifeLogo = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
      stroke="#F43F5E" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

export default function AndroidView({ tools }: { tools: Tool[] }) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    getRecentActivity(3).then(setHistory)
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const quickActions = [
    { title: 'Merge', icon: Layers, path: '/merge', color: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
    { title: 'Compress', icon: Zap, path: '/compress', color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
    { title: 'Split', icon: Scissors, path: '/split', color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
    { title: 'Protect', icon: Lock, path: '/protect', color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
  ]

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#1C1B1F] pb-32 transition-colors">
      
      {/* M3 System Header */}
      <header className={`px-6 pt-14 pb-6 sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-[#F3EDF7] dark:bg-[#2B2930] shadow-sm' : 'bg-transparent'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20 active:scale-90 transition-all">
               <PaperKnifeLogo size={20} />
             </div>
             <div>
               <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Secure Local Node</span>
               <span className="block text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">v0.1.0 • Offline Ready</span>
             </div>
          </div>
          <div className="flex gap-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-white/10 transition-colors">
              <Settings2 size={20} />
            </button>
          </div>
        </div>
        {!isScrolled && (
          <h1 className="text-3xl font-black tracking-tighter dark:text-white animate-in fade-in slide-in-from-left duration-500">
            Overview
          </h1>
        )}
      </header>

      <main className="px-4 space-y-8">
        
        {/* Unified Status Card */}
        <section className="px-1 animate-in fade-in zoom-in duration-500">
           <div className="relative bg-[#211F26] dark:bg-[#EADDFF] rounded-[2.5rem] p-8 overflow-hidden group shadow-md active:scale-[0.99] transition-transform">
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -mr-24 -mt-24" />
              <Shield className="mb-6 text-rose-500 dark:text-rose-600" size={40} />
              <h4 className="font-black text-2xl mb-2 text-white dark:text-[#211F26] leading-tight tracking-tight">Privacy Guard Active</h4>
              <p className="text-sm font-medium text-gray-400 dark:text-[#49454F] leading-relaxed mb-6">
                Your device is currently acting as a private PDF processing node. No data leakage detected.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 dark:text-emerald-700">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 100% On-Device Storage
              </div>
           </div>
        </section>

        {/* Primary Actions */}
        <section className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#49454F] dark:text-[#CAC4D0]">Primary Services</h3>
            <button onClick={() => navigate('/android-tools')} className="text-[11px] font-black uppercase text-rose-500 active:opacity-50">All Tools</button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-3 active:scale-90 transition-all group"
              >
                <div className={`w-16 h-16 ${action.color} ${action.shadow} rounded-[1.75rem] flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                  <action.icon size={26} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-black text-[#49454F] dark:text-[#CAC4D0] uppercase tracking-tighter">{action.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Activity Feed Summary */}
        {history.length > 0 && (
          <section className="animate-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#49454F] dark:text-[#CAC4D0]">Recent Activity</h3>
              <button onClick={() => navigate('/android-history')} className="text-[11px] font-black uppercase text-rose-500 active:opacity-50">History</button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-white dark:bg-[#2B2930] rounded-[1.5rem] border border-gray-100 dark:border-transparent flex items-center gap-4 active:bg-[#EEE8F4] dark:active:bg-[#36343B] transition-all shadow-sm">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold truncate dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.tool} • Node Local</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discovery Card */}
        <section className="pb-10 animate-in fade-in duration-1000 px-1">
           <button 
             onClick={() => navigate('/android-tools')}
             className="w-full p-8 bg-[#E8DEF8] dark:bg-[#4A4458] rounded-[2.5rem] text-center active:scale-[0.98] transition-all border border-transparent shadow-sm group"
           >
              <Sparkles className="mx-auto mb-4 text-rose-500" size={32} />
              <h4 className="font-black text-xl text-[#1D192B] dark:text-[#E6E1E5] mb-1 tracking-tight">Expand Your Toolbox</h4>
              <p className="text-xs font-medium text-[#49454F] dark:text-[#CAC4D0] opacity-70 mb-6">Access all 15 professional-grade PDF utilities.</p>
              <div className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform">
                 Open Toolbox <ChevronRight size={14} />
              </div>
           </button>
        </section>
      </main>
    </div>
  )
}