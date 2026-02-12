/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useNavigate } from 'react-router-dom'
import { 
  ChevronRight as ChevronRightIcon,
  FileText as FileTextIcon,
  Layers as LayersIcon, 
  Zap as ZapIcon, 
  Scissors as ScissorsIcon, 
  Lock as LockIcon,
  Moon as MoonIcon, 
  Sun as SunIcon, 
  Upload as UploadIcon,
  LayoutGrid as LayoutGridIcon, 
  ClipboardList
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getRecentActivity, ActivityEntry } from '../utils/recentActivity'
import { PaperKnifeLogo } from './Logo'

interface AndroidViewProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  onFileSelect?: (file: File) => void
}

export default function AndroidView({ theme, toggleTheme, onFileSelect }: AndroidViewProps) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getRecentActivity(3).then(setHistory)
  }, [])

  const quickActions = [
    { title: 'Merge', icon: LayersIcon, path: '/merge', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', sub: 'Combine' },
    { title: 'Compress', icon: ZapIcon, path: '/compress', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', sub: 'Optimize' },
    { title: 'Split', icon: ScissorsIcon, path: '/split', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', sub: 'Extract' },
    { title: 'Protect', icon: LockIcon, path: '/protect', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', sub: 'Secure' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-black transition-colors pb-24 text-left">
      <input 
        type="file" 
        accept=".pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      {/* Minimal Header */}
      <header className="px-6 pt-safe pb-2 sticky top-0 z-50 bg-[#FAFAFA]/95 dark:bg-black/95 backdrop-blur-xl border-b border-transparent">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
             <PaperKnifeLogo size={24} iconColor="#F43F5E" partColor="currentColor" />
             <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                   <span className="text-lg font-black tracking-tighter text-gray-900 dark:text-white leading-none">PaperKnife</span>
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </div>
                <span className="text-[7px] font-black text-rose-500 uppercase tracking-[0.2em] mt-0.5">Secure Engine</span>
             </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-zinc-800 transition-colors"
          >
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>
        </div>
      </header>

      <main className="px-4 py-2 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
        
        {/* Command Center Hero */}
        <section>
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-zinc-900 dark:bg-zinc-100 rounded-[2.25rem] p-6 text-left relative overflow-hidden shadow-xl shadow-zinc-900/10 dark:shadow-[0_0_30px_rgba(244,63,94,0.15)] group active:scale-[0.98] transition-all duration-100"
           >
              {/* Static Background Pattern */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-[80px] -mr-20 -mt-20 opacity-20 dark:opacity-[0.08] pointer-events-none" />
              
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-12">
                    <div className="p-3.5 bg-white/10 dark:bg-black/5 rounded-2xl backdrop-blur-md text-white dark:text-black border border-white/5 dark:border-black/5">
                       <UploadIcon size={28} strokeWidth={2.5} />
                    </div>
                    <div className="px-3 py-1.5 bg-rose-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                       Start Session
                    </div>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-white dark:text-black tracking-tight leading-none mb-2">Select PDF</h2>
                    <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-tight">Tap to load from device storage</p>
                 </div>
              </div>
           </button>
        </section>

        {/* Clipboard History Section */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center justify-between px-2 mb-3">
               <div className="flex items-center gap-2">
                  <ClipboardList size={12} className="text-gray-400" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none">History Clipboard</h3>
               </div>
               <button onClick={() => navigate('/android-history')} className="text-[9px] font-black uppercase text-rose-500 tracking-wider">View All</button>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm divide-y divide-gray-50 dark:divide-white/5 overflow-hidden">
              {history.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => navigate('/android-history')}
                  className="w-full p-4 flex items-center gap-4 active:bg-gray-50 dark:active:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-400 dark:text-zinc-500 shrink-0">
                    <FileTextIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-gray-900 dark:text-white leading-tight mb-0.5">{item.name}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] text-rose-500 font-black uppercase tracking-tight">{item.tool}</span>
                       <span className="text-[14px] text-gray-200 dark:text-zinc-800 leading-none">•</span>
                       <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{(item.size / (1024*1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <ChevronRightIcon size={14} className="text-gray-300" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Static Bento Grid */}
        <section>
           <div className="px-2 mb-3 flex items-center justify-between">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Core Engines</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
             {quickActions.map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col justify-between h-32 shadow-sm active:bg-gray-50 dark:active:bg-white/5 transition-colors text-left relative overflow-hidden"
                >
                  <div className={`w-10 h-10 ${action.bg} ${action.color} rounded-xl flex items-center justify-center mb-2`}>
                    <action.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10">
                     <span className="text-sm font-black text-gray-900 dark:text-white block leading-none mb-1">{action.title}</span>
                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{action.sub}</span>
                  </div>
                </button>
              ))}

              <button
                onClick={() => navigate('/android-tools')}
                className="col-span-2 p-5 bg-rose-500 text-white rounded-[2rem] flex items-center justify-between shadow-lg shadow-rose-500/20 active:bg-rose-600 transition-colors group relative overflow-hidden"
              >
                 <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
                    <LayoutGridIcon size={100} />
                 </div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                       <LayoutGridIcon size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                       <span className="text-sm font-black block leading-none mb-1">More Engines</span>
                       <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Full Catalog</span>
                    </div>
                 </div>
                 <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center relative z-10">
                    <ChevronRightIcon size={16} />
                 </div>
              </button>
           </div>
        </section>

        {/* Minimal Footer */}
        <div className="flex flex-col items-center gap-2 py-8 opacity-20">
           <p className="text-[8px] font-black uppercase tracking-[0.4em] dark:text-white text-center">PaperKnife v1.0.5</p>
        </div>

      </main>
    </div>
  )
}
