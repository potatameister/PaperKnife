import { useState } from 'react'
import { Shield, Zap, Github, Globe, Smartphone, Moon, Heart, Key, Star, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function About() {
  const [supporterKey, setSupporterKey] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleRedeem = () => {
    setIsVerifying(true)
    // Simple local validation logic to be implemented later
    setTimeout(() => {
      setIsVerifying(false)
      toast.info("Supporter keys will be available soon!")
    }, 1500)
  }

  return (
    <div className="min-h-full">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight dark:text-white">
            How it <span className="text-rose-500">Works.</span>
          </h2>
          <p className="text-xl text-gray-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            PaperKnife was built on a simple premise: your documents are none of my business.
          </p>
        </section>

        {/* The Protocol Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Zero-Server Architecture</h3>
            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">
              Most PDF tools upload your files to their servers. I don't. Everything you do happens locally in your browser's memory. When you close the tab, the data is gone forever.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Instant Edge Speed</h3>
            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">
              By bypassing the upload and download process, I eliminate latency. Large PDF merges happen in milliseconds because the heavy lifting is done by your device's own hardware.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">One Codebase, Two Souls</h3>
            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">
              My "Chameleon Mode" allows the same logic to power both this Web Dashboard and the native Android APK. I use Capacitor to bridge the gap between web and native.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <Smartphone size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Offline by Default</h3>
            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">
              Because I don't rely on APIs, PaperKnife works perfectly without an internet connection once the page is loaded. Absolute privacy, even in Airplane mode.
            </p>
          </div>
        </div>

        {/* Supporter Key Section */}
        <section className="mb-24 bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-12 border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-rose-500/10 pointer-events-none">
            <Key size={120} strokeWidth={1} />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 text-rose-500 font-black uppercase tracking-[0.2em] text-xs mb-4">
              <Star size={16} fill="currentColor" />
              Supporter Features
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-6 dark:text-white">Redeem Supporter Key</h2>
            <p className="text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed">
              If you supported PaperKnife on <a href="https://github.com/sponsors/potatameister" className="text-rose-500 hover:underline">Gumroad</a>, enter your license key below to unlock exclusive "Pro" themes and help keep this project 100% private and ad-free.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={supporterKey}
                onChange={(e) => setSupporterKey(e.target.value.toUpperCase())}
                placeholder="PK-XXXX-XXXX-XXXX"
                className="flex-1 bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-mono font-bold transition-colors"
              />
              <button 
                onClick={handleRedeem}
                disabled={!supporterKey || isVerifying}
                className="bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifying ? <Sparkles size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Verify Key
              </button>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-zinc-800">
                <div className="text-rose-500 mb-2"><Moon size={20} /></div>
                <h4 className="font-bold text-sm mb-1 dark:text-white">OLED Black</h4>
                <p className="text-[10px] text-gray-400">Pure black for battery savings.</p>
              </div>
              <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                <div className="text-rose-500 mb-2"><Sparkles size={20} /></div>
                <h4 className="font-bold text-sm mb-1 dark:text-white">Rose Gold</h4>
                <p className="text-[10px] text-gray-400">Our signature premium look.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="bg-rose-500 rounded-[3rem] p-8 md:p-16 text-white text-center shadow-2xl shadow-rose-500/20">
          <Heart className="mx-auto mb-6 opacity-80" size={48} fill="currentColor" />
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Support My Work</h2>
          <p className="text-rose-100 mb-10 max-w-xl mx-auto leading-relaxed text-lg">
            PaperKnife is 100% free and open-source. I never sell your data because I never see it. If you find this tool useful, consider supporting its development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://github.com/potatameister/PaperKnife" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white text-rose-500 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-50 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              <Github size={20} /> View Source
            </a>
            <a 
              href="https://github.com/sponsors/potatameister" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              <Heart size={20} className="text-rose-400" fill="currentColor" /> Become a Sponsor
            </a>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-gray-100 dark:border-zinc-900 mt-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-600">
          <p>© 2026 PaperKnife</p>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-gray-200 dark:text-zinc-800">|</span>
            <p>Built with ❤️ by <a href="https://github.com/potatameister" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:text-rose-600 transition-colors">potatameister</a></p>
            <span className="hidden md:block text-gray-200 dark:text-zinc-800">|</span>
            <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
