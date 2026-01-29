import { Shield, Home, Grid, Settings, Menu, Moon, Sun } from 'lucide-react'
import { Theme, Tool } from '../types'
import { PaperKnifeLogo } from './WebView'

const ToolCardCompact = ({ title, desc, icon: Icon }: Tool) => (
  <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-row items-center p-4 gap-4">
    <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 w-12 h-12 shrink-0 group-hover:bg-rose-500 group-hover:text-white">
      <Icon size={24} />
    </div>
    <div className="text-left overflow-hidden">
      <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{title}</h3>
      <p className="text-gray-500 dark:text-zinc-400 text-xs truncate">{desc}</p>
    </div>
  </div>
)

export default function AndroidView({ theme, toggleTheme, tools }: { theme: Theme, toggleTheme: () => void, tools: Tool[] }) {
  return (
    <div className="h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 font-sans flex flex-col overflow-hidden">
      <header className="bg-white dark:bg-zinc-950 px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <PaperKnifeLogo size={28} />
          <h1 className="text-xl font-black tracking-tighter dark:text-white">PaperKnife</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:border-rose-500 transition-all active:scale-95"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-2xl transition-colors text-gray-900 dark:text-white"><Menu size={20} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight mb-2 dark:text-white">Tools</h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Select a tool to start processing</p>
        </div>
        
        <div className="space-y-4">
          {tools.map((tool, i) => (
            <ToolCardCompact key={i} {...tool} />
          ))}
        </div>
        
        <div className="mt-10 p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/30">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold mb-2">
            <Shield size={20} />
            <span>Private & Offline</span>
          </div>
          <p className="text-sm text-rose-600/70 dark:text-rose-400/70 leading-relaxed">Your documents are processed securely on your device memory.</p>
        </div>
      </main>

      <nav className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800 fixed bottom-0 w-full pb-safe z-30">
        <div className="flex justify-around items-center h-20 px-4">
          <button className="flex flex-col items-center gap-1.5 text-rose-500">
            <div className="bg-rose-50 dark:bg-rose-900/30 p-2 rounded-xl"><Home size={24} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300">
            <Grid size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Files</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300">
            <Settings size={24} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
