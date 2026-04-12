/**
 * PaperKnife - Professional Web Dashboard
 * A desktop-optimized, sidebar-driven interface.
 */

import { useState, useMemo } from 'react'
import { 
  Search as SearchIcon, 
  ChevronRight as ChevronRightIcon, 
  Sparkles as SparklesIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tool, ToolCategory } from '../types'

const categoryColors: Record<ToolCategory, { bg: string, text: string, border: string, hover: string, glow: string }> = {
  Edit: { 
    bg: 'bg-rose-50 dark:bg-rose-900/20', 
    text: 'text-rose-500', 
    border: 'border-rose-100 dark:border-rose-900/30',
    hover: 'group-hover:bg-rose-500',
    glow: 'dark:hover:shadow-rose-900/20'
  },
  Security: { 
    bg: 'bg-indigo-50 dark:bg-indigo-900/20', 
    text: 'text-indigo-500', 
    border: 'border-indigo-100 dark:border-indigo-900/30',
    hover: 'group-hover:bg-indigo-500',
    glow: 'dark:hover:shadow-indigo-900/20'
  },
  Convert: { 
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
    text: 'text-emerald-500', 
    border: 'border-emerald-100 dark:border-emerald-900/30',
    hover: 'group-hover:bg-emerald-500',
    glow: 'dark:hover:shadow-emerald-900/20'
  },
  Optimize: { 
    bg: 'bg-amber-50 dark:bg-amber-900/20', 
    text: 'text-amber-500', 
    border: 'border-amber-100 dark:border-amber-900/30',
    hover: 'group-hover:bg-amber-500',
    glow: 'dark:hover:shadow-amber-900/20'
  }
}

const ToolCard = ({ title, desc, icon: Icon, onClick, category }: Tool & { onClick?: () => void }) => {
  const colors = categoryColors[category]
  
  return (
    <button 
      onClick={onClick}
      className="group relative flex flex-col p-6 rounded-[2rem] bg-white dark:bg-zinc-900/40 border border-gray-100 dark:border-white/5 hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-rose-500/5 hover:-translate-y-1"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${colors.bg} ${colors.text} group-hover:bg-rose-500 group-hover:text-white transition-all duration-500`}>
        <Icon size={24} strokeWidth={2} />
      </div>
      <h3 className="font-black text-gray-900 dark:text-white mb-2 text-lg tracking-tight group-hover:text-rose-500 transition-colors">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-2">{desc}</p>
      
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500">
        <ChevronRightIcon size={20} />
      </div>
    </button>
  )
}

export default function WebView({ tools }: { tools: Tool[] }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All')

  const categories: (ToolCategory | 'All')[] = ['All', 'Edit', 'Security', 'Convert', 'Optimize']

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || tool.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [tools, searchQuery, activeCategory])

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black transition-colors duration-500">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.05),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-rose-100 dark:border-rose-900/30">
            <SparklesIcon size={14} /> Professional PDF Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter dark:text-white mb-8 leading-[0.9]">
            Stop Uploading <br/>
            <span className="text-rose-500">Your Privacy.</span>
          </h1>
          
          <div className="max-w-2xl mx-auto relative group mt-12">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-rose-500 transition-colors">
              <SearchIcon size={22} />
            </div>
            <input 
              type="text"
              placeholder="Search tools (e.g. merge, compress, protect...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2rem] py-6 pl-16 pr-8 shadow-2xl shadow-gray-200/50 dark:shadow-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-bold text-xl dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Main Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-12">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${activeCategory === cat ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-lg' : 'bg-white dark:bg-zinc-900 text-gray-400 border-gray-100 dark:border-white/5 hover:border-rose-500'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredTools.length} Modules Active</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard 
                  key={tool.title} 
                  {...tool} 
                  onClick={() => navigate(tool.path || '/')}
                />
              ))}
            </div>

            {filteredTools.length === 0 && (
              <div className="py-32 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <SearchIcon size={32} />
                </div>
                <h3 className="text-2xl font-black dark:text-white mb-2">No tools matched.</h3>
                <p className="text-gray-500 dark:text-zinc-400 font-medium">Try searching for a different keyword or clear your filters.</p>
                <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-8 text-rose-500 font-black uppercase tracking-widest text-xs hover:underline underline-offset-8">Reset Dashboard</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}