import { useState } from 'react'
import { 
  Github, Heart, 
  ChevronDown, Lock, 
  Code, 
  Terminal, Zap,
  ExternalLink,
  Cpu, ShieldCheck, Shield,
  Sparkles, Trash2, Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { clearActivity } from '../utils/recentActivity'
import { toast } from 'sonner'

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

export default function About() {
  const isNative = Capacitor.isNativePlatform()
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

  // Settings Dashboard (Native View)
  if (isNative) {
    return (
      <NativeToolLayout 
        title="Settings" 
        description="Configuration and Privacy Protocol"
      >
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Header Branding */}
          <section className="flex flex-col items-center text-center py-4">
             <div className="w-20 h-20 bg-zinc-900 dark:bg-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-4">
                <ShieldCheck size={40} className="text-rose-500" />
             </div>
             <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">PaperKnife Node</h2>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mt-1">v0.5.0-beta • Zero Server</p>
          </section>

          {/* Privacy Controls */}
          <section>
            <h3 className="px-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Security Management</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
              <div className="p-5 flex items-center justify-between border-b border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-none">Auto-Wipe</h4>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1.5 font-medium">Scrub history on every app launch</p>
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
                className="w-full p-5 flex items-center gap-4 active:bg-gray-50 dark:active:bg-zinc-800 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-zinc-900 dark:bg-black text-white rounded-xl flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-none">Wipe All Data</h4>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500 mt-1.5 font-medium">Instantly clear all local activity logs</p>
                </div>
              </button>
            </div>
          </section>

          {/* Privacy Protocol (How it works) */}
          <section>
            <h3 className="px-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Technical Protocol</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 p-2 shadow-sm">
               <TechSpec title="Zero-Server Architecture" icon={Shield}>
                  <p>Your files never leave your device. All processing happens in the browser's private memory heap (RAM). No data is ever transmitted to a server.</p>
               </TechSpec>
               <TechSpec title="Local-First Logic" icon={Zap}>
                  <p>By leveraging Web Workers and pdf-lib, we execute complex PDF manipulation directly on your CPU. This ensures 100% privacy and offline capability.</p>
               </TechSpec>
               <TechSpec title="Secure Encryption" icon={Lock}>
                  <p>Protect PDF uses AES-256 bit encryption. Your passwords are used only as cryptographic seeds and are never stored or logged.</p>
               </TechSpec>
               <TechSpec title="Open Source Integrity" icon={Code}>
                  <p>PaperKnife is fully open source. You can audit the entire source code on GitHub to verify our privacy claims.</p>
               </TechSpec>
            </div>
          </section>

          {/* Support & Credits */}
          <section>
            <h3 className="px-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Project Support</h3>
            <div className="bg-zinc-900 dark:bg-zinc-100 rounded-[2rem] p-6 text-white dark:text-black shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 text-rose-500/10 pointer-events-none">
                  <Heart size={80} fill="currentColor" />
               </div>
               <div className="relative z-10">
                  <h4 className="font-black text-xl mb-2">Support the Engine</h4>
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 leading-relaxed mb-6">PaperKnife is a free, independent project. Your support keeps it ad-free and private forever.</p>
                  <div className="flex gap-2">
                    <a 
                      href="https://github.com/sponsors/potatameister" 
                      target="_blank" 
                      className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
                    >
                      Sponsor
                    </a>
                    <Link 
                      to="/thanks"
                      className="flex-1 py-3 bg-white/10 dark:bg-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center active:scale-95 transition-transform"
                    >
                      Credits
                    </Link>
                  </div>
               </div>
            </div>
          </section>

          {/* Legal / Policy Footer */}
          <section className="text-center py-10 opacity-40">
             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                Precision • Privacy • Performance <br/>
                Open Source 2026
             </p>
          </section>
        </div>
      </NativeToolLayout>
    )
  }

  // Web View (Full Documentation)
  return (
    <div className="min-h-full bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        <section className="mb-24">
          <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">
            <Terminal size={14} /> Documentation v0.9.5
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.1] mb-8">
            The Free <br/>
            <span className="text-rose-500">Privacy</span> Engine.
          </h2>
          <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 leading-relaxed font-medium max-w-2xl">
            PaperKnife is a high-integrity PDF utility that executes entirely within the client-side runtime. We removed the server to ensure your documents never leave your sight.
          </p>
          <div className="mt-8">
            <Link 
              to="/thanks" 
              className="inline-flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-transform"
            >
              <Sparkles size={16} /> View Special Thanks
            </Link>
          </div>
        </section>

        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Technical Protocol</h3>
            <div className="h-[1px] flex-1 bg-gray-100 dark:border-zinc-800" />
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-gray-100 dark:border-zinc-800 px-2 md:px-6 shadow-sm">
            <TechSpec title="Zero-Server Protocol" icon={ShieldCheck}>
              <p>PaperKnife operates on a <strong>Local-First</strong> principle. When you select a file, it is loaded into your browser's private heap memory as an <code>ArrayBuffer</code>. No part of your file is ever uploaded, cached on a server, or transmitted over a network.</p>
            </TechSpec>
            <TechSpec title="In-Memory Processing" icon={Cpu}>
              <p>Heavy computation is performed by background <strong>Web Workers</strong>. This ensures the main UI thread remains responsive while complex PDF operations execute in parallel on your hardware.</p>
            </TechSpec>
            <TechSpec title="Audit Integrity" icon={Code}>
              <p>The entire engine is Open Source. You can verify our "Zero-Server" claim by auditing the Network tab (F12) to ensure no PDF data is transmitted to external URLs.</p>
              <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-rose-500 font-bold hover:underline mt-2 text-[10px] uppercase tracking-widest">
                Audit on GitHub <ExternalLink size={12} />
              </a>
            </TechSpec>
          </div>
        </section>

        <footer className="text-center pt-10 border-t border-gray-100 dark:border-zinc-900">
            <div className="flex justify-center gap-8 mb-8">
                <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-500 transition-colors"><Github size={20} /></a>
                <Link to="/thanks" className="text-gray-400 hover:text-rose-500 transition-colors"><Sparkles size={20} /></Link>
                <a href="https://github.com/sponsors/potatameister" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-500 transition-colors"><Heart size={20} /></a>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 dark:text-zinc-800 mb-2 leading-relaxed">
                PaperKnife • Precision Logic <br/>
                Zero Data Persistence • Open Source 2026
            </p>
        </footer>

      </main>
    </div>
  )
}