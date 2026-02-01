import { useState, useMemo } from 'react'
import { Shield, ChevronRight, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tool, ToolCategory } from '../types'

const ToolCardCompact = ({ title, desc, icon: Icon, implemented, onClick }: Tool & { onClick?: () => void }) => (
  <div 
    onClick={implemented ? onClick : undefined}
    className={`
      bg-white dark:bg-zinc-900 rounded-3xl border transition-all duration-300 flex flex-row items-center p-4 gap-4
      ${implemented 
        ? 'border-gray-100 dark:border-zinc-800 shadow-sm active:scale-95' 
        : 'border-gray-50 dark:border-zinc-900 opacity-50 saturate-0'}
    `}
  >
    <div className={`
      bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center w-12 h-12 shrink-0
      ${implemented ? 'group-hover:bg-rose-500 group-hover:text-white' : ''}
    `}>
      <Icon size={24} />
    </div>
    <div className="text-left overflow-hidden flex-1">
      <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{title}</h3>
      <p className="text-gray-500 dark:text-zinc-400 text-xs truncate">{desc}</p>
    </div>
    {implemented ? (
      <ChevronRight size={16} className="text-gray-300" />
    ) : (
      <span className="text-[8px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-gray-400">Soon</span>
    )}
  </div>
)

export default function AndroidView({ tools }: { tools: Tool[] }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All')

  const categories: (ToolCategory | 'All')[] = ['All', 'Edit', 'Secure', 'Convert', 'Optimize']

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || tool.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [tools, searchQuery, activeCategory])

  const handleToolClick = (tool: Tool) => {
    if (!tool.implemented) return
    if (tool.path) {
      navigate(tool.path)
    }
  }

  return (
    <div className="h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 font-sans flex flex-col overflow-hidden transition-colors duration-300 ease-out">
      <main className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mb-6">
          <h2 className="text-3xl font-black tracking-tight mb-1 dark:text-white">Tools</h2>
          <p className="text-gray-500 dark:text-zinc-400 text-xs italic">Local processing • 100% Private</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search all tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 shadow-sm outline-none focus:border-rose-500 font-bold text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-rose-500 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="space-y-3 mt-4">
          {filteredTools.map((tool) => (
            <ToolCardCompact 
              key={tool.title} 
              {...tool} 
              onClick={() => handleToolClick(tool)} 
            />
          ))}
          {filteredTools.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-gray-400">No tools found.</p>
            </div>
          )}
        </div>
        
        <div className="mt-10 p-6 bg-rose-50 dark:bg-rose-900/10 rounded-[2rem] border border-rose-100 dark:border-rose-900/20">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold mb-2">
            <Shield size={20} />
            <span>Secure Memory</span>
          </div>
          <p className="text-xs text-rose-600/70 dark:text-rose-400/60 leading-relaxed">Your files never leave this device. Processing happens entirely in RAM.</p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600">
            Built by <span className="text-rose-500">potatameister</span>
          </p>
        </div>
      </main>
    </div>
  )
}