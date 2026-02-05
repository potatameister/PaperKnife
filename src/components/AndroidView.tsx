import { useNavigate } from 'react-router-dom'
import { 
  Plus, Search, Shield, Info, Star,
  CheckCircle2, Clock, Download
} from 'lucide-react'
import { Tool, ToolCategory } from '../types'
import { useState, useMemo, useEffect } from 'react'
import { getRecentActivity, ActivityEntry } from '../utils/recentActivity'

const categoryColors: Record<ToolCategory, { bg: string, text: string, icon: string }> = {
  Edit: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', icon: 'text-rose-500' },
  Secure: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', icon: 'text-indigo-500' },
  Convert: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  Optimize: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' }
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

  useEffect(() => {
    getRecentActivity(3).then(setHistory)
  }, [])

  const filteredTools = useMemo(() => {
    return tools.filter(tool => 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tools, searchQuery])

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center">
              <PaperKnifeLogo size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight dark:text-white">PaperKnife</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Zero-Server Engine</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/about')}
            className="w-10 h-10 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center text-gray-400"
          >
            <Info size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-zinc-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 dark:text-white"
          />
        </div>
      </header>

      <main className="px-6 space-y-8">
        {/* Recent Files Section */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Clock size={14} /> Recent Files
              </h3>
            </div>
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.tool}</p>
                  </div>
                  {item.resultUrl && (
                    <a href={item.resultUrl} download={item.name} className="p-2 text-rose-500">
                      <Download size={18} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tools Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Star size={14} /> All Tools
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {filteredTools.map((tool, i) => {
              const colors = categoryColors[tool.category]
              const Icon = tool.icon
              return (
                <button
                  key={i}
                  onClick={() => tool.implemented && tool.path && navigate(tool.path)}
                  className={`relative p-5 rounded-[2rem] text-left transition-all active:scale-95 flex flex-col gap-4 overflow-hidden border ${tool.implemented ? 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm' : 'bg-gray-50 dark:bg-zinc-950 border-transparent opacity-60 grayscale'}`}
                >
                  <div className={`w-12 h-12 ${colors.bg} ${colors.icon} rounded-2xl flex items-center justify-center`}>
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm dark:text-white leading-tight mb-1">{tool.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium leading-tight line-clamp-2">{tool.desc}</p>
                  </div>
                  {!tool.implemented && (
                    <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-tighter bg-gray-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-gray-500">Soon</span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* Security Badge */}
        <div className="bg-rose-500 rounded-[2.5rem] p-8 text-white">
          <Shield className="mb-4 opacity-50" size={32} />
          <h4 className="font-black text-xl mb-2 leading-tight">Privacy Protocol Active</h4>
          <p className="text-xs font-bold text-rose-100 uppercase tracking-widest leading-relaxed">Everything is processed in your device memory. 0 bytes uploaded.</p>
        </div>
      </main>

      {/* Fab Mock (For UI feel) */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 pointer-events-none opacity-0 md:opacity-100">
        <div className="bg-rose-500 text-white p-4 rounded-3xl shadow-2xl">
          <Plus size={24} strokeWidth={3} />
        </div>
      </div>
    </div>
  )
}