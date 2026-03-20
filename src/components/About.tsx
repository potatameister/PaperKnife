import React, { useState } from 'react'
import { 
  ArrowLeft,
  Cpu, 
  Shield, 
  Code, 
  ServerOff, 
  EyeOff,
  HardDrive,
  Github,
  ExternalLink,
  Star
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PaperKnifeLogo } from './Logo'

const SpecItem = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 dark:border-white/5 last:border-0 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 px-4 flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOpen ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 group-hover:text-rose-500'}`}>
            <Icon size={18} strokeWidth={2.5} />
          </div>
          <h4 className="text-sm font-black text-gray-900 dark:text-white">{title}</h4>
        </div>
        <div className={`flex-shrink-0 ${isOpen ? 'text-rose-500' : 'text-gray-300'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="pb-4 px-4 pl-[4.5rem] text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black pb-32">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-500 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 text-white shrink-0">
                <Shield size={24} strokeWidth={2.5} />
             </div>
             <div>
                <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none mb-1">About</h2>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Privacy Protocol</p>
             </div>
          </div>
        </div>

        {/* Logo & Intro */}
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PaperKnifeLogo size={36} iconColor="#F43F5E" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">PaperKnife</h3>
            <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider">v1.1.0 • 100% Client-Side</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">How It Works</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              <SpecItem title="Local Processing" icon={Cpu} defaultOpen={true}>
                Every action—merging, splitting, encrypting—happens locally on your device. Your PDF is processed by your device's CPU using <span className="text-rose-500 font-bold">pdf-lib</span> and <span className="text-rose-500 font-bold">WebAssembly</span>. No data ever leaves your device.
              </SpecItem>

              <SpecItem title="Zero Servers" icon={ServerOff}>
                We operate a <span className="text-rose-500 font-bold">zero-server architecture</span>. There is no backend, no database, no cloud. Your phone is the laboratory—documents stay in your hands.
              </SpecItem>

              <SpecItem title="RAM Only" icon={EyeOff}>
                Your files exist only in <span className="text-rose-500 font-bold">volatile memory (RAM)</span> during processing. Once you close the app or navigate away, the data is permanently destroyed.
              </SpecItem>

              <SpecItem title="Metadata Clean" icon={HardDrive}>
                Privacy isn't just about servers. PaperKnife's <span className="text-rose-500 font-bold">Deep Clean</span> protocol removes identifying metadata (Producer, Creator, XMP) to ensure documents are truly anonymous.
              </SpecItem>

              <SpecItem title="Open Source" icon={Code}>
                PaperKnife is <span className="text-rose-500 font-bold">100% open source</span> under <span className="text-rose-500 font-bold">GNU AGPL v3</span>. You can audit every line of code—the engine remains free and auditable forever.
              </SpecItem>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="px-6 space-y-3">
          <a 
            href="https://github.com/potatameister/PaperKnife"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                <Github size={18} className="text-gray-900 dark:text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">Source Code</p>
                <p className="text-[10px] text-gray-400">AGPL v3 License</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-gray-300" />
          </a>

          <button 
            onClick={() => navigate('/hall-of-fame')}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Star size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">Hall of Fame</p>
                <p className="text-[10px] text-gray-400">Our Supporters</p>
              </div>
            </div>
            <ExternalLink size={16} className="text-gray-300" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pt-8 pb-4">
          <p className="text-center text-[8px] text-gray-400 font-black uppercase tracking-widest">
            Made with ❤️ by potatameister
          </p>
        </div>

      </div>
    </div>
  )
}
