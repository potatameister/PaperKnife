import { Github as GHIcon, Heart as HeartIcon, Sparkles, ChevronRight } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'

export default function Thanks() {
  const isNative = Capacitor.isNativePlatform()

  const links = [
    { name: 'pdf-lib', url: 'https://github.com/Hopding/pdf-lib', desc: 'Core document engine for local manipulation.' },
    { name: 'PDF.js', url: 'https://github.com/mozilla/pdf.js', desc: 'High-performance PDF rendering and parsing.' },
    { name: 'Tesseract.js', url: 'https://github.com/naptha/tesseract.js', desc: 'Fully localized OCR engine for image-to-text conversion.' },
    { name: 'JSZip', url: 'https://github.com/Stuk/jszip', desc: 'Local file compression and bundling.' },
    { name: 'Lucide', url: 'https://github.com/lucide-icons/lucide', desc: 'Beautifully crafted open-source icons.' },
    { name: 'Capacitor', url: 'https://github.com/ionic-team/capacitor', desc: 'Native bridge for cross-platform mobile apps.' },
    { name: 'OpenCode', url: 'https://github.com/opencode-ai/opencode', desc: 'Open-source AI coding assistant for the terminal.' },
    { name: 'Termux', url: 'https://github.com/termux/termux-app', desc: 'Mobile terminal for on-the-go development.' },
    { name: 'Gemini CLI', url: 'https://github.com/google-gemini/gemini-cli', desc: 'AI assistance for architectural design.' },
  ]

  const content = (
    <div className="animate-in fade-in duration-700">
      <section className={isNative ? "mb-8 text-center py-2" : "mb-12 text-center"}>
        <div className="flex items-center justify-center gap-2 text-rose-500 font-black text-[9px] uppercase tracking-[0.4em] mb-4">
          <Sparkles size={12} /> Acknowledgments
        </div>
        <h2 className={isNative ? "text-3xl font-black tracking-tighter dark:text-white leading-tight mb-3" : "text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.1] mb-6"}>
          The <span className="text-rose-500">Supporters.</span>
        </h2>
        <p className="text-base md:text-lg text-gray-500 dark:text-zinc-400 leading-relaxed font-medium max-w-xl mx-auto px-4">
          PaperKnife is a self-funded labor of love. These are the individuals and tools that keep the engine running.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 mb-12">
        {/* Main Supporter Card / Hall of Fame - Compact */}
        <div className="p-10 bg-zinc-900 text-white rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center gap-10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-1000">
            <HeartIcon size={160} fill="currentColor" />
          </div>
          
          <div className="w-20 h-20 bg-rose-500 text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20 animate-pulse relative z-10">
            <HeartIcon size={32} fill="currentColor" />
          </div>
          
          <div className="flex-1 text-center md:text-left relative z-10">
            <h3 className="text-3xl font-black tracking-tighter mb-2">Hall of Fame</h3>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-lg mb-8 mx-auto md:mx-0">
              The heroes who fuel the engine. Your support ensures PaperKnife stays free and private forever. Sponsors receive a permanent shout-out here.
            </p>
            <a href="https://github.com/sponsors/potatameister" target="_blank" className="inline-flex items-center gap-3 px-8 py-3.5 bg-white text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-lg">
              <HeartIcon size={14} fill="currentColor" /> Sponsor Project
            </a>
          </div>
        </div>

        {/* Technologies Grid - High Density */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {links.map((link) => (
            <a 
              key={link.name} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group p-5 bg-white dark:bg-zinc-900 rounded-[1.75rem] border border-gray-100 dark:border-white/5 hover:border-rose-500 transition-all shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-gray-50 dark:bg-black rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors text-gray-400 shrink-0 border border-transparent dark:border-white/5">
                  <GHIcon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-xs tracking-widest uppercase dark:text-white mb-0.5">
                    {link.name}
                  </h3>
                  <p className="text-[9px] text-gray-500 dark:text-zinc-500 font-bold uppercase tracking-tight truncate">{link.desc}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </a>
          ))}
        </div>
      </div>

      <footer className="text-center py-8 opacity-20">
         <PaperKnifeLogo size={24} iconColor="#F43F5E" partColor="currentColor" className="mx-auto mb-4" />
         <p className="text-[8px] font-black uppercase tracking-[0.5em]">PaperKnife Protocol v1.0.8</p>
      </footer>
    </div>
  )

  if (isNative) {
    return (
      <NativeToolLayout title="Credits" description="Hall of Fame & Ecosystem" actions={null}>
        <div className="pb-20">
          {content}
        </div>
      </NativeToolLayout>
    )
  }

  return (
    <div className="min-h-full bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {content}
      </main>
    </div>
  )
}
