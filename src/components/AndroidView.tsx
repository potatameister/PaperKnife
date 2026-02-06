import { useNavigate } from 'react-router-dom'
import { 
  Search, Shield, Info,
  Download, ChevronRight,
  FileText, Settings2, Sparkles
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
  const [searchQuery, setSearchQuery] = useState('')
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const [activeTab, setActiveTab] = useState<ToolCategory | 'All'>('All')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    getRecentActivity(5).then(setHistory)
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'All' || tool.category === activeTab;
      return matchesSearch && matchesTab;
    })
  }, [tools, searchQuery, activeTab])

  const categories: (ToolCategory | 'All')[] = ['All', 'Edit', 'Secure', 'Convert', 'Optimize']

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#1C1B1F] pb-32 selection:bg-rose-100 dark:selection:bg-rose-900/30 transition-colors">
      
      {/* M3 Top App Bar (Dynamic) */}
      <header className={`px-6 pt-14 pb-6 sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-[#F3EDF7] dark:bg-[#2B2930] shadow-md pt-10' : 'bg-transparent'}`}>
        <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'mb-4' : 'mb-8'}`}>
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-transform">
               <PaperKnifeLogo size={20} />
             </div>
             {!isScrolled && <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 animate-in fade-in duration-500">Android Node</span>}
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-white/10 transition-colors">
              <Settings2 size={22} />
            </button>
            <button onClick={() => navigate('/about')} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-white/10 transition-colors">
              <Info size={22} />
            </button>
          </div>
        </div>
        
        <h1 className={`font-black tracking-tighter dark:text-white transition-all duration-300 ${isScrolled ? 'text-xl mb-4' : 'text-4xl mb-8'}`}>
          {isScrolled ? 'PaperKnife' : 'Dashboard'}
        </h1>

        {/* M3 Search Anchor */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-500">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EEE8F4] dark:bg-[#2B2930] border-none rounded-[1.75rem] py-4 pl-14 pr-6 text-base font-bold placeholder:text-gray-500 focus:bg-white dark:focus:bg-[#36343B] ring-2 ring-transparent focus:ring-rose-500/10 transition-all dark:text-white outline-none shadow-sm active:scale-[0.99]"
          />
        </div>
      </header>

      <main className="px-4 mt-2 space-y-8">
        
        {/* Chips - Standard M3 Style */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${activeTab === cat ? 'bg-[#E8DEF8] dark:bg-[#4A4458] border-transparent text-[#1D192B] dark:text-[#E6E1E5] shadow-sm' : 'bg-transparent border-gray-300 dark:border-gray-600 text-[#49454F] dark:text-[#CAC4D0]'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recent Tasks - M3 Elevated Style */}
        {history.length > 0 && !searchQuery && (
          <section className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#49454F] dark:text-[#CAC4D0]">Recent Activities</h3>
              <button className="text-[11px] font-black uppercase text-rose-500 active:opacity-50">Clear</button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-white dark:bg-[#2B2930] rounded-[1.5rem] border border-gray-100 dark:border-transparent flex items-center gap-4 active:bg-[#EEE8F4] dark:active:bg-[#36343B] transition-all shadow-sm shadow-black/5">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.tool} • Ready</p>
                  </div>
                  <div className="flex items-center">
                     {item.resultUrl && (
                        <a href={item.resultUrl} download={item.name} className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-full text-rose-500 active:scale-90 transition-transform">
                          <Download size={20} />
                        </a>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tool Cards - M3 Style Grid */}
        <section className="animate-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#49454F] dark:text-[#CAC4D0]">{activeTab} Toolbox</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {filteredTools.map((tool, i) => {
              const colors = categoryColors[tool.category]
              const Icon = tool.icon
              return (
                <button
                  key={i}
                  onClick={() => tool.implemented && tool.path && navigate(tool.path)}
                  className={`relative p-5 rounded-[1.75rem] text-left transition-all active:scale-[0.98] flex items-center gap-5 overflow-hidden border ${tool.implemented ? 'bg-white dark:bg-[#2B2930] border-gray-100 dark:border-transparent shadow-sm' : 'bg-gray-50 dark:bg-[#1C1B1F] border-dashed border-gray-200 dark:border-gray-800 opacity-60'}`}
                >
                  <div className={`w-14 h-14 ${colors.bg} ${colors.icon} ${colors.border} border rounded-2xl flex items-center justify-center shrink-0`}>
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-base dark:text-white leading-tight mb-1">{tool.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight truncate">{tool.desc}</p>
                  </div>
                  <div className="p-2 text-gray-400">
                     <ChevronRight size={20} />
                  </div>
                  {!tool.implemented && (
                    <div className="absolute top-0 right-0 h-full w-12 flex items-center justify-center bg-gray-50/80 dark:bg-black/40 backdrop-blur-sm">
                       <span className="rotate-90 text-[8px] font-black uppercase tracking-widest text-gray-400">Soon</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* M3 Security Card */}
        <section className="pb-10 px-1">
           <div className="relative bg-[#211F26] dark:bg-[#EADDFF] rounded-[2.5rem] p-8 overflow-hidden group active:scale-[0.99] transition-transform shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
              <Shield className="mb-6 text-rose-500 dark:text-rose-600" size={44} />
              <h4 className="font-black text-2xl mb-2 text-white dark:text-[#211F26] leading-tight">Privacy Node Active</h4>
              <p className="text-xs font-medium text-gray-400 dark:text-[#49454F] leading-relaxed mb-6">
                All processing is 100% on-device. Your documents never touch our cloud.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 dark:text-emerald-700">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 Zero Server Architecture
              </div>
           </div>
        </section>
      </main>

      {/* M3 Floating Action Button (FAB) */}
      <button 
        className="fixed bottom-28 right-6 w-16 h-16 bg-rose-500 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 active:rotate-12 transition-all z-50 group border-4 border-white dark:border-[#1C1B1F]"
        title="Quick Process"
      >
        <Sparkles size={28} className="group-active:scale-125 transition-transform" strokeWidth={2.5} />
      </button>
    </div>
  )
}