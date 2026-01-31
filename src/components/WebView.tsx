import { useNavigate, Link } from 'react-router-dom'
import { Shield, Zap, Download, ChevronRight, Moon, Sun, Github, Info, Heart } from 'lucide-react'
import { Theme, Tool } from '../types'
import { PaperKnifeLogo } from './Logo'

const ToolCard = ({ title, desc, icon: Icon, className = "", implemented = false, onClick }: Tool & { className?: string, onClick?: () => void }) => (
  <div 
    onClick={implemented ? onClick : undefined}
    className={`
      rounded-3xl border transition-all duration-300 group overflow-hidden flex flex-col p-6 md:p-8 relative
      ${implemented 
        ? 'cursor-pointer hover:shadow-lg dark:hover:shadow-rose-900/10 hover:border-rose-200 dark:hover:border-rose-800 hover:-translate-y-0.5' 
        : 'cursor-not-allowed opacity-60 saturate-0'}
      ${className}
    `}
  >
    <div className={`
      bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center transition-all duration-300 mb-6 
      ${implemented ? 'group-hover:bg-rose-500 group-hover:text-white' : ''}
      ${className.includes('row-span-2') ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-14 md:h-14'}
    `}>
      <Icon size={className.includes('row-span-2') ? 32 : 24} className="md:w-[28px] md:h-[28px]" strokeWidth={1.5} />
    </div>
    <div className="flex-1 flex flex-col justify-end">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h3 className={`font-bold text-gray-900 dark:text-white ${className.includes('row-span-2') ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>{title}</h3>
        {implemented ? (
          <ChevronRight size={18} className="text-gray-300 dark:text-zinc-600 group-hover:text-rose-500 transition-colors transform group-hover:translate-x-1" />
        ) : (
          <span className="text-[10px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-gray-400">Soon</span>
        )}
      </div>
      <p className={`text-gray-500 dark:text-zinc-400 leading-relaxed ${className.includes('row-span-2') ? 'text-base md:text-lg' : 'text-xs md:text-sm'}`}>{desc}</p>
    </div>
  </div>
)

export default function WebView({ theme, toggleTheme, tools }: { theme: Theme, toggleTheme: () => void, tools: Tool[] }) {
  const navigate = useNavigate()

  // Bento Grid Layout Configuration
  const getBentoClass = (i: number) => {
    switch(i) {
      case 0: return "md:col-span-2 md:row-span-2 bg-gradient-to-br from-white to-rose-50 dark:from-zinc-900 dark:to-rose-950/10 border-rose-100 dark:border-rose-900/30" // Merge (Hero)
      case 4: return "md:col-span-1 md:row-span-1 bg-gradient-to-br from-white to-rose-50/50 dark:from-zinc-900 dark:to-rose-950/5 border-rose-50 dark:border-rose-900/20" // Protect (Secondary Hero)
      default: return "md:col-span-1 bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800" // Others
    }
  }

  // Handle Tool Click
  const handleToolClick = (tool: Tool) => {
    if (!tool.implemented) return;
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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-gray-900 dark:text-zinc-100 font-sans selection:bg-rose-100 dark:selection:bg-rose-900 selection:text-rose-600 transition-colors duration-300 ease-out">
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity">
            <PaperKnifeLogo size={28} />
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white">PaperKnife</h1>
          </Link>
          <div className="flex items-center gap-2 md:gap-6">
            <nav className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-zinc-400 mr-2">
              <a href="https://github.com/sponsors/potatameister" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:text-rose-600 transition flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                <Heart size={18} fill="currentColor" />
                <span className="hidden sm:block">Sponsor</span>
              </a>
              <Link to="/about" className="hover:text-rose-500 transition flex items-center gap-2">
                <Info size={20} className="md:hidden" />
                <span className="hidden md:block">About</span>
              </Link>
            </nav>
            <div className="flex items-center gap-2 border-l border-gray-100 dark:border-zinc-800 pl-2 md:pl-6">
              <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center justify-center h-10 w-10 rounded-xl text-gray-500 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all">
                <Github size={20} />
              </a>
              <button 
                onClick={toggleTheme}
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:border-rose-500 transition-all active:scale-95"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-20">
        <div className="text-center mb-10 md:mb-20">
          <span className="inline-block px-4 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] md:text-xs font-bold rounded-full mb-6 border border-rose-100 dark:border-rose-900/30">
            LOCAL PROCESSING • 100% PRIVATE
          </span>
          <h2 className="text-4xl md:text-7xl font-black mb-6 md:mb-8 tracking-tight text-gray-900 dark:text-white">
            Stop Uploading <br/>
            <span className="text-rose-500">Your Privacy.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The professional PDF utility that lives in your browser. <br className="hidden md:block"/>
            No uploads, no servers, just your data staying yours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {tools.map((tool, i) => (
            <ToolCard 
              key={i} 
              {...tool} 
              className={getBentoClass(i)} 
              onClick={() => handleToolClick(tool)}
            />
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

      <footer className="border-t border-gray-100 dark:border-zinc-800 mt-32 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-6">
                <PaperKnifeLogo size={24} />
                <span className="font-black tracking-tighter text-xl">PaperKnife</span>
              </div>
              <p className="text-gray-500 dark:text-zinc-400 text-sm max-w-sm leading-relaxed mb-8">
                Absolute privacy for your documents. We process everything in your browser memory. No servers, no tracking, just precision tools.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-2xl hover:bg-rose-500 hover:text-white transition-all text-gray-600 dark:text-zinc-400">
                  <Github size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-6">Resources</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-600 dark:text-zinc-400">
                <li><Link to="/" className="hover:text-rose-500 transition">All Tools</Link></li>
                <li><Link to="/about" className="hover:text-rose-500 transition">Privacy Protocol</Link></li>
                <li><a href="#" className="hover:text-rose-500 transition">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-6">Support</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-600 dark:text-zinc-400">
                <li><a href="https://github.com/sponsors/potatameister" className="flex items-center gap-2 hover:text-rose-500 transition"><Heart size={14} className="text-rose-500" /> Sponsor Project</a></li>
                <li><a href="#" className="flex items-center gap-2 hover:text-rose-500 transition">Report an Issue</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
              <p>© 2026 PaperKnife.</p>
              <p className="hidden md:block">•</p>
              <p>Built with ❤️ by <a href="https://github.com/potatameister" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">potatameister</a></p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-rose-500 transition">Terms</a>
              <a href="#" className="hover:text-rose-500 transition">License</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}