import { useState } from 'react'
import { 
  Heart, 
  ChevronDown, 
  Code, 
  Zap,
  ShieldCheck,
  Sparkles, Github, Scale, ExternalLink, Terminal
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'

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

  const content = (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Hero */}
      <section className={isNative ? 'text-center py-4' : 'mb-24'}>
        {!isNative && (
          <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">
            <Terminal size={14} /> Documentation v0.9.5
          </div>
        )}
        <h2 className={isNative ? "text-4xl font-black tracking-tighter dark:text-white mb-4" : "text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.1] mb-8"}>
          The Free <br/>
          <span className="text-rose-500">Privacy</span> Engine.
        </h2>
        <p className="text-lg text-gray-500 dark:text-zinc-400 leading-relaxed font-medium max-w-2xl mx-auto">
          PaperKnife is a high-integrity PDF utility that executes entirely within your browser's private runtime. No data ever leaves your device.
        </p>
      </section>

      {/* Protocol Section */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Technical Protocol</h3>
          <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5" />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 px-2 md:px-6 shadow-sm">
          <TechSpec title="Zero-Server Logic" icon={ShieldCheck}>
            <p>PaperKnife operates on a <strong>Local-First</strong> principle. When you select a file, it is loaded into your browser's private heap memory as an <code>ArrayBuffer</code>. No part of your file is ever uploaded, cached on a server, or transmitted over a network.</p>
          </TechSpec>
          <TechSpec title="Local Compute" icon={Zap}>
            <p>By leveraging Web Workers and <code>pdf-lib</code>, we execute complex PDF manipulation directly on your device CPU. This ensures 100% privacy and full offline capability.</p>
          </TechSpec>
          <TechSpec title="Secure Encryption" icon={Code}>
            <p>Our protection tools use <strong>GPL v3</strong> compliant cryptographic implementations. Passwords are used only as transient seeds and are destroyed immediately after use.</p>
          </TechSpec>
        </div>
      </section>

      {/* License & Source */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div>
            <Scale className="text-rose-500 mb-4" size={32} />
            <h4 className="text-xl font-black dark:text-white mb-2">GPL v3 License</h4>
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
              Copyleft open-source protocol. This ensures that PaperKnife remains free and open forever.
            </p>
          </div>
          <a href="https://github.com/potatameister/PaperKnife/blob/main/LICENSE" target="_blank" className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:translate-x-1 transition-transform">
            Read License <ExternalLink size={12} />
          </a>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col justify-between">
          <div>
            <Github className="text-gray-900 dark:text-white mb-4" size={32} />
            <h4 className="text-xl font-black dark:text-white mb-2">Open Source</h4>
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
              Verify our privacy claims yourself. The entire engine is available for audit on GitHub.
            </p>
          </div>
          <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white hover:translate-x-1 transition-transform">
            View Source <ExternalLink size={12} />
          </a>
        </div>
      </section>

      {/* Support Section */}
      <section className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 text-rose-500/10 pointer-events-none">
          <Heart size={120} fill="currentColor" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-rose-500 font-black uppercase tracking-[0.2em] text-[10px]">
              <Sparkles size={14} /> PaperKnife Supporter
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">Help Grow the <br/>Engine.</h3>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed font-medium">
              Your support keeps PaperKnife independent and completely ad-free for everyone.
            </p>
          </div>
          <div className="w-full md:w-fit flex flex-col gap-3">
            <a href="https://github.com/sponsors/potatameister" target="_blank" className="inline-flex items-center justify-center gap-3 bg-rose-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform">
              <Heart size={16} fill="currentColor" /> Sponsor
            </a>
            <Link to="/thanks" className="inline-flex items-center justify-center gap-3 bg-white/10 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-transform text-white">
              Credits
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-center py-10 opacity-20">
         <PaperKnifeLogo size={24} iconColor="#F43F5E" className="mx-auto mb-4" />
         <p className="text-[9px] font-black uppercase tracking-[0.5em]">PaperKnife Node v0.5.0-beta</p>
      </footer>
    </div>
  )

  if (isNative) {
    return (
      <NativeToolLayout title="About" description="Technical Specification" actions={null}>
        <div className="animate-in fade-in duration-500 pb-32">
          {/* Hero section for Native */}
          <section className="text-center py-8">
            <div className="w-20 h-20 bg-rose-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/20">
              <PaperKnifeLogo size={40} iconColor="#FFFFFF" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter dark:text-white mb-2">PaperKnife</h1>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-rose-500 mb-6">Privacy Engine v0.5.0</p>
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium px-4">
              A high-integrity PDF utility that executes entirely within your device's private runtime.
            </p>
          </section>

          {/* Native Protocol List */}
          <section className="mb-8">
            <h3 className="px-6 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Security Protocol</h3>
            <div className="bg-white dark:bg-zinc-900 border-y border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5">
              <div className="p-5 flex gap-4">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center shrink-0"><ShieldCheck size={20} /></div>
                <div><h4 className="text-sm font-bold dark:text-white">Zero-Server Logic</h4><p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 leading-relaxed">Files are loaded into volatile RAM. No part of your document is ever uploaded or cached.</p></div>
              </div>
              <div className="p-5 flex gap-4">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl flex items-center justify-center shrink-0"><Zap size={20} /></div>
                <div><h4 className="text-sm font-bold dark:text-white">Local Compute</h4><p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 leading-relaxed">PDF manipulation happens on your device CPU. Full offline capability guaranteed.</p></div>
              </div>
              <div className="p-5 flex gap-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl flex items-center justify-center shrink-0"><Code size={20} /></div>
                <div><h4 className="text-sm font-bold dark:text-white">GPL v3 Compliance</h4><p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 leading-relaxed">Open-source cryptographic implementations. Passwords are destroyed after use.</p></div>
              </div>
            </div>
          </section>

          {/* Native Links */}
          <section className="px-4 grid grid-cols-2 gap-3 mb-8">
             <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col items-center text-center shadow-sm">
                <Github size={24} className="mb-3 dark:text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">Source Code</span>
             </a>
             <Link to="/thanks" className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col items-center text-center shadow-sm">
                <Heart size={24} className="mb-3 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">Credits</span>
             </Link>
          </section>

          <div className="px-4">
             <a href="https://github.com/sponsors/potatameister" target="_blank" className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black p-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform">
                <Sparkles size={18} className="text-rose-500" />
                <span className="font-black uppercase tracking-widest text-xs">Sponsor Project</span>
             </a>
          </div>

          <footer className="text-center py-12 opacity-20">
             <PaperKnifeLogo size={24} iconColor="#F43F5E" className="mx-auto mb-4" />
             <p className="text-[9px] font-black uppercase tracking-[0.5em]">PaperKnife Node v0.5.0-beta</p>
          </footer>
        </div>
      </NativeToolLayout>
    )
  }

  return (
    <div className="min-h-full bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 p-6 md:p-0">
      <main className="max-w-4xl mx-auto py-12 md:py-24">
        {content}
      </main>
    </div>
  )
}
