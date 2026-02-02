import { useState } from 'react'
import { 
  Github, Heart, 
  ChevronDown, Layers, Lock, 
  Code, Star, Sparkles,
  Terminal, Zap,
  ExternalLink, Award, Palette,
  Scissors, Cpu
} from 'lucide-react'
import { toast } from 'sonner'

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
          <h4 className="font-black text-sm uppercase tracking-widest dark:text-zinc-200">{title}</h4>
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
  const [supporterKey, setSupporterKey] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [showSupporter, setShowSupporter] = useState(false)

  const handleRedeem = () => {
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      toast.info("Supporter keys will be available in the V1.0 release.")
    }, 1200)
  }

  const themes = [
    'OLED Black', 'Rose Gold', 'Midnight Purple', 'Forest Emerald', 
    'Nordic Slate', 'Cyber Neon', 'Ocean Blue', 'Crimson Red',
    'Amber Glow', 'Slate Grey', 'Deep Sea'
  ]

  return (
    <div className="min-h-full bg-[#FAFAFA] dark:bg-black selection:bg-rose-500 selection:text-white">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        {/* Refined Hero */}
        <section className="mb-24">
          <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6">
            <Terminal size={14} /> Documentation v0.9.4
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter dark:text-white leading-[1.1] mb-8">
            The Free <br/>
            <span className="text-rose-500">Privacy</span> Engine.
          </h2>
          <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 leading-relaxed font-medium max-w-2xl">
            PaperKnife is a high-integrity PDF utility that executes entirely within the client-side runtime. We removed the server to ensure your documents never leave your sight.
          </p>
        </section>

        {/* Technical Specification Protocol */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Tool-Specific Logic</h3>
            <div className="h-[1px] flex-1 bg-gray-100 dark:bg-zinc-900" />
          </div>

          <div className="bg-white dark:bg-zinc-900/50 rounded-[2rem] border border-gray-100 dark:border-zinc-800 px-2 md:px-6 shadow-sm">
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
              <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="inline-flex items-center gap-2 text-rose-500 font-bold hover:underline mt-2 text-[10px] uppercase tracking-widest">
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

            <div className="relative z-10 flex flex-col lg:flex-row gap-12 lg:items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 text-rose-500 font-black uppercase tracking-[0.2em] text-[10px]">
                  <Award size={14} /> Supporter Layer
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Support the <br/>Project.</h3>
                <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                  PaperKnife is free and independent. Supporters unlock purely aesthetic bonuses and keep the project ad-free.
                </p>
                
                <button 
                  onClick={() => setShowSupporter(!showSupporter)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
                >
                  {showSupporter ? 'Hide Benefits' : 'View Benefits'} <ChevronDown size={14} className={`transition-transform ${showSupporter ? 'rotate-180' : ''}`} />
                </button>

                {showSupporter && (
                  <div className="space-y-6 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <div className="flex items-center gap-2 text-rose-500 mb-3">
                        <Palette size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Premium Aesthetic Engine</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {themes.map(t => (
                          <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold text-gray-400 uppercase">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-rose-500 mb-2">
                        <Github size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">README Shoutout</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed uppercase font-bold tracking-tight">Your name etched in the PaperKnife GitHub Repository Hall of Fame.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full lg:w-80 space-y-4 bg-black/40 p-6 rounded-3xl border border-white/10">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block">Activation Key</label>
                <input 
                  type="text" 
                  value={supporterKey}
                  onChange={(e) => setSupporterKey(e.target.value.toUpperCase())}
                  placeholder="PK-XXXX-XXXX"
                  className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 outline-none font-mono text-xs text-white focus:border-rose-500 transition-all shadow-inner"
                />
                <button 
                  onClick={handleRedeem}
                  disabled={!supporterKey || isVerifying}
                  className="w-full bg-rose-500 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? <Sparkles size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Activate
                </button>
                <a href="https://github.com/sponsors/potatameister" target="_blank" className="block text-center text-[8px] font-black text-gray-500 hover:text-rose-500 transition-colors uppercase tracking-widest pt-2">
                   Sponsor on GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="text-center pt-10 border-t border-gray-100 dark:border-zinc-900">
            <div className="flex justify-center gap-8 mb-8">
                <a href="https://github.com/potatameister/PaperKnife" className="text-gray-400 hover:text-rose-500 transition-colors"><Github size={20} /></a>
                <a href="https://github.com/sponsors/potatameister" className="text-gray-400 hover:text-rose-500 transition-colors"><Heart size={20} /></a>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-200 dark:text-zinc-800 mb-2 leading-relaxed">
                PaperKnife • Precision Logic <br/>
                Zero Data Persistence • Open Source 2026
            </p>
        </footer>

      </main>
    </div>
  )
}
