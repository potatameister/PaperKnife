import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, ChevronRight
} from 'lucide-react'
import { Tool, ToolCategory } from '../types'
import { PaperKnifeLogo } from './Logo'

export default function AndroidToolsView({ tools }: { tools: Tool[] }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const categoryColors: Record<ToolCategory, { bg: string, text: string, icon: string, border: string }> = {
    Edit: { bg: 'bg-rose-50 dark:bg-rose-900/10', text: 'text-rose-600 dark:text-rose-400', icon: 'text-rose-500', border: 'border-rose-100/50 dark:border-rose-900/20' },
    Secure: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', text: 'text-indigo-600 dark:text-indigo-400', icon: 'text-indigo-500', border: 'border-indigo-100/50 dark:border-indigo-900/20' },
    Convert: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500', border: 'border-emerald-100/50 dark:border-emerald-900/20' },
    Optimize: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500', border: 'border-amber-100/50 dark:border-amber-900/20' }
  }

  const filteredTools = useMemo(() => {
    return tools.filter(tool => 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tools, searchQuery])

  const groupedTools = useMemo(() => {
    return filteredTools.reduce((acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = []
      acc[tool.category].push(tool)
      return acc
    }, {} as Record<ToolCategory, Tool[]>)
  }, [filteredTools])

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black pb-32 transition-colors">
      <header className="px-6 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-6">
        <h1 className="text-4xl font-black tracking-tighter dark:text-white mb-8">All Tools</h1>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-500">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Search for a tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#EEE8F4] dark:bg-[#2B2930] border-none rounded-[1.75rem] py-4 pl-14 pr-6 text-base font-bold placeholder:text-gray-400 focus:bg-white dark:focus:bg-[#36343B] ring-2 ring-transparent focus:ring-rose-500/10 transition-all dark:text-white outline-none shadow-sm"
          />
        </div>
      </header>

      <main className="px-4 space-y-8">
        {(Object.keys(groupedTools) as ToolCategory[]).map((category) => (
          <section key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="px-2 mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#49454F] dark:text-[#CAC4D0]">
              {category} Tools
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {groupedTools[category].map((tool, i) => {
                const colors = categoryColors[tool.category]
                const Icon = tool.icon
                return (
                  <button
                    key={i}
                    onClick={() => tool.implemented && tool.path && navigate(tool.path)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 active:bg-gray-50 dark:active:bg-black transition-all shadow-sm"
                  >
                    <div className={`w-12 h-12 ${colors.bg} ${colors.icon} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-bold text-sm dark:text-white truncate">{tool.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tool.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </main>

      <footer className="text-center py-12 opacity-20">
         <PaperKnifeLogo size={24} iconColor="#F43F5E" partColor="currentColor" className="mx-auto mb-4" />
         <p className="text-[9px] font-black uppercase tracking-[0.5em]">PaperKnife Version 1.0.7</p>
      </footer>
    </div>
  )
}
