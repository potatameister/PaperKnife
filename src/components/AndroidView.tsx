import { Shield, Home, Grid, Menu, Moon, Sun, ChevronRight, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Theme, Tool } from '../types'
import { PaperKnifeLogo } from './Logo'

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

export default function AndroidView({ theme, toggleTheme, tools }: { theme: Theme, toggleTheme: () => void, tools: Tool[] }) {
  const navigate = useNavigate()

  const handleToolClick = (tool: Tool) => {
    if (!tool.implemented) return
    if (tool.title === 'Merge PDF') {
      navigate('/merge')
    } else if (tool.title === 'Split PDF') {
      navigate('/split')
    } else if (tool.title === 'Protect PDF') {
      navigate('/protect')
    } else if (tool.title === 'Unlock PDF') {
      navigate('/unlock')
    } else if (tool.title === 'Compress PDF') {
      navigate('/compress')
    }
  }

  return (
    <div className="h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 font-sans flex flex-col overflow-hidden transition-colors duration-300 ease-out">
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <PaperKnifeLogo size={28} />
          <h1 className="text-xl font-black tracking-tighter dark:text-white">PaperKnife</h1>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="https://github.com/sponsors/potatameister" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center h-10 px-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 border border-rose-100 dark:border-rose-900/30 active:scale-95 transition-all"
          >
            <Heart size={18} fill="currentColor" />
          </a>
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 active:scale-90 transition-transform"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-2xl transition-colors text-gray-900 dark:text-white"><Menu size={20} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight mb-2 dark:text-white">Tools</h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm italic">Local processing • 100% Private</p>
        </div>
        
        <div className="space-y-3">
          {tools.map((tool, i) => (
            <ToolCardCompact 
              key={i} 
              {...tool} 
              onClick={() => handleToolClick(tool)} 
            />
          ))}
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

      {/* Bottom Nav */}
      <nav className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 fixed bottom-0 w-full pb-safe z-30">
        <div className="flex justify-around items-center h-20 px-4">
          <button className="flex flex-col items-center gap-1.5 text-rose-500">
            <div className="bg-rose-50 dark:bg-rose-900/30 p-2 rounded-xl"><Home size={24} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>
          <button 
            onClick={() => navigate('/about')}
            className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
          >
            <Shield size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Privacy</span>
          </button>
          <a 
            href="https://github.com/potatameister/PaperKnife"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-zinc-500"
          >
            <Grid size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Source</span>
          </a>
        </div>
      </nav>
    </div>
  )
}