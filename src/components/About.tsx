import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Zap, Github, Globe, Smartphone, Moon, Sun, Heart } from 'lucide-react'
import { Theme } from '../types'
import { PaperKnifeLogo } from './Logo'

export default function About({ theme, toggleTheme }: { theme: Theme, toggleTheme: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-gray-900 dark:text-zinc-100 font-sans transition-colors duration-300 ease-out">
      
      {/* Brand Header */}
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-500 hover:text-rose-500 mr-1"
            >
              <ArrowLeft size={20} />
            </button>
            <PaperKnifeLogo size={28} />
            <h1 className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 dark:text-white hidden sm:block">PaperKnife</h1>
          </div>
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 hover:border-rose-500 transition-all active:scale-95"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight dark:text-white">
            How it <span className="text-rose-500">Works.</span>
          </h2>
          <p className="text-xl text-gray-500 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            PaperKnife was built on a simple premise: your documents are none of our business.
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
              Most PDF tools upload your files to their servers. We don't. Everything you do happens locally in your browser's memory. When you close the tab, the data is gone forever.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Instant Edge Speed</h3>
            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">
              By bypassing the upload and download process, we eliminate latency. Large PDF merges happen in milliseconds because the heavy lifting is done by your device's own hardware.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">One Codebase, Two Souls</h3>
            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">
              Our "Chameleon Mode" allows the same logic to power both this Web Dashboard and our native Android APK. We use Capacitor to bridge the gap between web and native.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <Smartphone size={24} />
            </div>
            <h3 className="text-xl font-bold mb-4 dark:text-white">Offline by Default</h3>
            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm">
              Because we don't rely on APIs, PaperKnife works perfectly without an internet connection once the page is loaded. Absolute privacy, even in Airplane mode.
            </p>
          </div>
        </div>

        {/* Support Section */}
        <section className="bg-rose-500 rounded-[3rem] p-8 md:p-16 text-white text-center shadow-2xl shadow-rose-500/20">
          <Heart className="mx-auto mb-6 opacity-80" size={48} fill="currentColor" />
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Support the Project</h2>
          <p className="text-rose-100 mb-10 max-w-xl mx-auto leading-relaxed text-lg">
            PaperKnife is 100% free and open-source. We never sell your data because we never see it. If you find this tool useful, consider supporting its development.
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

      <footer className="py-12 text-center text-gray-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-widest">
        <p>© 2026 PaperKnife • Built for absolute privacy</p>
      </footer>
    </div>
  )
}
