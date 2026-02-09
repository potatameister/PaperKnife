import { Github, Heart, Sparkles, Code } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'

export default function Thanks() {
  const isNative = Capacitor.isNativePlatform()

  const links = [
    { name: 'Termux', url: 'https://github.com/termux/termux-app', desc: 'The powerful terminal emulator for Android that made development on-the-go possible.' },
    { name: 'OpenCode', url: 'https://github.com/opencode', desc: 'The open-source community fostering collaboration and innovation.' },
    { name: 'Gemini CLI', url: 'https://github.com/google-gemini/gemini-cli', desc: 'The AI agent that assisted in the architectural design and implementation of PaperKnife.' },
  ]

  const content = (
    <div className="animate-in fade-in duration-700">
      <section className={isNative ? "mb-10 text-center py-4" : "mb-16"}>
        <div className={`flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-[0.4em] mb-6 ${isNative ? 'justify-center' : ''}`}>
          <Sparkles size={14} /> Acknowledgments
        </div>
        <h2 className={isNative ? "text-4xl font-black tracking-tighter dark:text-white leading-tight mb-4" : "text-5xl md:text-7xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.1] mb-8"}>
          Special <br/>
          <span className="text-rose-500">Thanks.</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 leading-relaxed font-medium max-w-2xl mx-auto">
          PaperKnife wouldn't be possible without the incredible tools and communities that empower local-first development.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
        {links.map((link) => (
          <a 
            key={link.name} 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group p-8 bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 hover:border-rose-500 transition-all shadow-sm flex flex-col justify-between h-full"
          >
            <div>
              <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-500 group-hover:text-white transition-colors text-gray-400">
                <Github size={24} />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2 dark:text-white">{link.name}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{link.desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Visit Repository <Code size={12} />
            </div>
          </a>
        ))}
        
        {/* Supporter Placeholder */}
        <div className="p-8 bg-zinc-900 rounded-[2.5rem] border border-white/5 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center animate-pulse">
            <Heart size={32} fill="currentColor" />
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">Future Supporters</h3>
          <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
            This space is reserved for the heroes who keep this project alive.
          </p>
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
      <NativeToolLayout title="Credits" description="People and tools behind PaperKnife" actions={null}>
        <div className="pb-20">
          {content}
        </div>
      </NativeToolLayout>
    )
  }

  return (
    <div className="min-h-full bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        {content}
      </main>
    </div>
  )
}
