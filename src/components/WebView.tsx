import { FileText, Shield, Zap, Download, Grid, ChevronRight, Moon, Sun } from 'lucide-react'
import { Theme, Tool } from '../types'

export const PaperKnifeLogo = ({ size = 24 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 4L21 12H9L4 4Z" fill="#F43F5E" />
    <path d="M4 20L21 12H9L4 20Z" className="fill-zinc-900 dark:fill-zinc-100 transition-colors duration-300" />
    <path d="M9 12L21 12" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
  </svg>
)

const ToolCard = ({ title, desc, icon: Icon, featured = false }: Tool & { featured?: boolean }) => (
  <div className={`
    rounded-3xl border transition-all duration-300 cursor-pointer group overflow-hidden flex flex-col p-8
    ${featured ? 'md:col-span-2 md:row-span-1 bg-gradient-to-br from-white to-rose-50 dark:from-zinc-900 dark:to-rose-950/20' : 'bg-white dark:bg-zinc-900'}
    ${featured ? 'border-rose-100 dark:border-rose-900/30' : 'border-gray-100 dark:border-zinc-800'}
    hover:shadow-xl dark:hover:shadow-rose-900/10 hover:border-rose-200 dark:hover:border-rose-800
  `}>
    <div className={`
      bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 w-14 h-14 mb-6
      ${featured ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none' : 'group-hover:bg-rose-500 group-hover:text-white'}
    `}>
      <Icon size={28} />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900 dark:text-white text-xl">{title}</h3>
        <ChevronRight size={18} className="text-gray-300 dark:text-zinc-600 group-hover:text-rose-500 transition-colors transform group-hover:translate-x-1" />
      </div>
      <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">{desc}</p>
    </div>
  </div>
)

export default function WebView({ theme, toggleTheme, tools }: { theme: Theme, toggleTheme: () => void, tools: Tool[] }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 font-sans selection:bg-rose-100 dark:selection:bg-rose-900 selection:text-rose-600">
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <PaperKnifeLogo size={32} />
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">PaperKnife</h1>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <nav className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-zinc-400">
              <a href="#" className="hover:text-rose-500 transition">Tools</a>
              <a href="#" className="hover:text-rose-500 transition">Privacy</a>
            </nav>
            <button 
              onClick={toggleTheme}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:border-rose-500 transition-all active:scale-95"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <a href="#" className="hidden sm:block bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full hover:bg-rose-500 dark:hover:bg-rose-500 dark:hover:text-white transition-all shadow-lg hover:shadow-rose-200 dark:shadow-none font-bold text-sm uppercase tracking-wider">Get APK</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full mb-6 border border-rose-100 dark:border-rose-900/30">
            100% OFFLINE & PRIVATE
          </span>
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-gray-900 dark:text-white">
            Precision PDF <br/>
            <span className="text-rose-500">Processing.</span>
          </h2>
          <p className="text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The professional PDF utility that lives in your browser. <br className="hidden md:block"/>
            No uploads, no servers, just your data staying yours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <ToolCard key={i} {...tool} featured={i === 0} />
          ))}
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-100 dark:border-zinc-800 pt-20">
          {[
            { icon: Shield, title: 'Zero Cloud', desc: "Your files never leave your memory. We don't have a server, and we don't want your data." },
            { icon: Zap, title: 'Instant Speed', desc: "By processing locally, there's no upload or download delay. Large files are handled in seconds." },
            { icon: Download, title: 'Install Anywhere', desc: "Use it as a web app or download the APK for a full native experience on your Android device." }
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-50 dark:border-zinc-800 shadow-sm">
              <div className="text-rose-500 mb-6"><feature.icon size={32} strokeWidth={2.5} /></div>
              <h4 className="font-bold text-lg mb-3 dark:text-white">{feature.title}</h4>
              <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 dark:border-zinc-800 mt-32 py-16 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <PaperKnifeLogo size={24} />
            <span className="font-black tracking-tighter">PaperKnife</span>
          </div>
          <p className="text-gray-400 dark:text-zinc-500 text-sm">© 2026 PaperKnife. Built for absolute privacy.</p>
          <div className="flex gap-6 text-sm font-bold text-gray-400 dark:text-zinc-500">
            <a href="#" className="hover:text-rose-500 transition">GitHub</a>
            <a href="#" className="hover:text-rose-500 transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
