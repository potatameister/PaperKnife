import { useState } from 'react'
import { 
  Github, Heart, 
  ChevronDown, Layers, Lock, 
  Code, Star, 
  Terminal, Zap,
  ExternalLink, Award,
  Scissors, Cpu, ShieldCheck, Shield
} from 'lucide-react'

const TechSpec = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 dark:border-zinc-800 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-rose-500 text-white' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400 group-hover:text-rose-500'}`}>
            <Icon size={18} strokeWidth={2} />
          </div>
          <h4 className="font-black text-sm uppercase tracking-widest text-gray-900 dark:text-white">{title}</h4>
        </div>
        <ChevronDown size={18} className={`text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pb-8 pl-14 pr-4 text-sm text-gray-500 dark:text-zinc-400 leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function About() {
  return (
    <div className="min-h-full bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        {/* Refined Hero */}
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
          </p> section.
        </section>

        {/* Technical Specification Protocol */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Tool-Specific Logic</h3>
            <div className="h-[1px] flex-1 bg-gray-100 dark:border-zinc-800" />
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-gray-100 dark:border-zinc-800 px-2 md:px-6 shadow-sm">
            <TechSpec title="Zero-Server Protocol" icon={ShieldCheck}>
              <p>PaperKnife operates on a <strong>Local-First</strong> principle. When you select a file, it is loaded into your browser's private heap memory as an <code>ArrayBuffer</code>. No part of your file is ever uploaded, cached on a server, or transmitted over a network. All computations are performed by your device's CPU.</p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 w-fit px-2 py-1 rounded">
                <Shield size={10} /> 100% In-Memory Processing
              </div>
            </TechSpec>

            <TechSpec title="Merge PDF" icon={Layers}>
              <p>Uses <strong>pdf-lib</strong> to initialize a new document in RAM. It copies the low-level object streams from your source files into the new container, preserving links and structure without disk I/O.</p>
            </TechSpec>

            <TechSpec title="Split PDF" icon={Scissors}>
              <p>Heavy page rendering is offloaded to a <strong>Web Worker</strong> thread. We perform "Atomic Extraction" by copying only the byte-offsets relevant to your selected pages into a fresh PDF buffer.</p>
            </TechSpec>

            <TechSpec title="Compress PDF" icon={Zap}>
              <p>Converts PDF vectors into high-resolution bitmaps, applies lossy JPEG encoding, and re-encapsulates them. This is the most effective way to shrink bloated or scanned documents.</p>
            </TechSpec>

            <TechSpec title="Protect PDF" icon={Lock}>
              <p>Implements the standard PDF Security Handler. Your password is used as a cryptographic seed for <strong>AES-256</strong> bit encryption. Your password never leaves your browser.</p>
            </TechSpec>

            <TechSpec title="Parallel Compute" icon={Cpu}>
              <p>We leverage <strong>Hardware Concurrency</strong>. The engine spawns background Web Workers to process document batches in parallel, ensuring consistent performance without UI latency.</p>
            </TechSpec>

            <TechSpec title="Audit Integrity" icon={Code}>
              <p>The entire engine is Open Source. You can verify our "Zero-Server" claim by auditing the Network tab (F12) to ensure no PDF data is transmitted to external URLs.</p>
              <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-rose-500 font-bold hover:underline mt-2 text-[10px] uppercase tracking-widest">
                Audit on GitHub <ExternalLink size={12} />
              </a>
            </TechSpec>
          </div>
        </section>

        {/* Consolidatied Supporter Section */}
        <section className="mb-24">
          <div className="bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 text-rose-500/10 pointer-events-none">
              <Star size={120} fill="currentColor" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 text-rose-500 font-black uppercase tracking-[0.2em] text-[10px]">
                  <Award size={14} /> PaperKnife Supporter
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Support the <br/>Project.</h3>
                <p className="text-sm text-gray-400 max-w-sm leading-relaxed font-medium">
                  PaperKnife is a free, solo-developed project. Your support helps keep the engine independent and completely ad-free.
                </p>
                
                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-rose-500">
                        <Heart size={16} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">README Shoutout</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed uppercase font-bold tracking-tight">Your name etched in the GitHub Repository.</p>
                </div>
              </div>

              <div className="w-full md:w-fit shrink-0">
                <a 
                  href="https://github.com/sponsors/potatameister" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-rose-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-rose-500/20"
                >
                  <Heart size={16} fill="currentColor" />
                  Sponsor Project
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="text-center pt-10 border-t border-gray-100 dark:border-zinc-900">
            <div className="flex justify-center gap-8 mb-8">
                <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-rose-500 transition-colors"><Github size={20} /></a>
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
