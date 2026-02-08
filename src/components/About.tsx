import { useState } from 'react'
import { 
  Heart, 
  ChevronDown, 
  Code, 
  Zap,
  ShieldCheck, Shield,
  Sparkles, Trash2, Clock, Moon, Sun, Monitor
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'
import { Theme } from '../types'

const TechSpec = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 dark:border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-rose-500 text-white' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400'}`}>
            <Icon size={18} strokeWidth={2} />
          </div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white">{title}</h4>
        </div>
        <ChevronDown size={18} className={`text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pb-6 pl-14 pr-4 text-xs text-gray-500 dark:text-zinc-400 leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </div>
  )
}

interface AboutProps {
  theme?: Theme
  setTheme?: (theme: Theme) => void
}

export default function About({ theme, setTheme }: AboutProps) {
  const [autoWipe, setAutoWipe] = useState(() => localStorage.getItem('autoWipe') === 'true')

  const toggleAutoWipe = () => {
    const newValue = !autoWipe
    setAutoWipe(newValue)
    localStorage.setItem('autoWipe', String(newValue))
    toast.success(newValue ? 'Auto-Wipe Enabled' : 'Auto-Wipe Disabled')
  }

  const handleClearData = async () => {
    await clearActivity()
    toast.success('All local data cleared.')
  }

  return (
    <NativeToolLayout 
      title="Settings" 
      description="Manage your experience and privacy preferences."
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Identity Section */}
        <section className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-white/5 flex items-center gap-4 shadow-sm">
           <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ShieldCheck size={32} className="text-white" />
           </div>
           <div>
              <h2 className="text-xl font-black dark:text-white">PaperKnife Node</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">v0.5.0-beta • Active</p>
           </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-3">
          <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Appearance</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 p-2 grid grid-cols-3 gap-2">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'System' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme?.(t.id as Theme)}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all ${theme === t.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-gray-50 dark:bg-black text-gray-400'}`}
              >
                <t.icon size={20} />
                <span className="text-[10px] font-bold uppercase">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Privacy Section */}
        <section className="space-y-3">
          <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Privacy & Performance</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm dark:text-white">Auto-Wipe</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Clear history on every launch</p>
                </div>
              </div>
              <button 
                onClick={toggleAutoWipe}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${autoWipe ? 'bg-rose-500' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${autoWipe ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <button 
              onClick={handleClearData}
              className="w-full p-4 flex items-center gap-4 active:bg-gray-50 dark:active:bg-zinc-800 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-zinc-100 dark:bg-black text-gray-500 rounded-xl flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm dark:text-white">Nuke All Data</h4>
                <p className="text-[10px] text-gray-400 font-medium">Instantly scrub all local activity</p>
              </div>
            </button>
          </div>
        </section>

        {/* Protocol Section */}
        <section className="space-y-3">
          <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Technical Protocol</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 p-2 shadow-sm">
             <TechSpec title="Zero-Server Architecture" icon={Shield}>
                <p>Your files never leave your device. All processing happens in the browser's private memory heap (RAM). No data is ever transmitted to a server.</p>
             </TechSpec>
             <TechSpec title="Local-First Logic" icon={Zap}>
                <p>By leveraging Web Workers and pdf-lib, we execute complex PDF manipulation directly on your CPU. This ensures 100% privacy and offline capability.</p>
             </TechSpec>
             <TechSpec title="Open Source Integrity" icon={Code}>
                <p>PaperKnife is fully open source. You can audit the entire source code on GitHub to verify our privacy claims.</p>
             </TechSpec>
          </div>
        </section>

        {/* Support Card */}
        <section>
           <div className="bg-zinc-900 dark:bg-zinc-100 rounded-[2.5rem] p-8 text-white dark:text-black relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-8 text-rose-500/10 pointer-events-none">
                <Heart size={100} fill="currentColor" />
              </div>
              <div className="relative z-10">
                <h4 className="text-2xl font-black tracking-tight mb-2">Support the Dev</h4>
                <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed mb-6 max-w-[200px]">Keep PaperKnife free and private by sponsoring development.</p>
                <div className="flex gap-3">
                  <a 
                    href="https://github.com/sponsors/potatameister" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30 active:scale-95 transition-transform"
                  >
                    <Heart size={14} fill="currentColor" /> Sponsor
                  </a>
                  <Link 
                    to="/thanks"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 dark:bg-black/5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    <Sparkles size={14} /> Credits
                  </Link>
                </div>
              </div>
           </div>
        </section>

        <footer className="text-center py-10 opacity-30">
           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500">
             Precision • Privacy • Performance <br/>
             Open Source 2026
           </p>
        </footer>
      </div>
    </NativeToolLayout>
  )
}