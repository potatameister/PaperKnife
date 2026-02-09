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
  ChevronRight,
  FileText,
  Layers, Zap, Scissors, Lock,
  Moon, Sun, Upload,
  LayoutGrid, Sparkles, Clock
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
    { title: 'Merge', icon: Layers, path: '/merge', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { title: 'Compress', icon: Zap, path: '/compress', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Split', icon: Scissors, path: '/split', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Protect', icon: Lock, path: '/protect', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-black transition-colors pb-32">
      <input 
        type="file" 
        accept=".pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      {/* Titan Minimal Header */}
      <header className="px-6 pt-safe pb-2 sticky top-0 z-50 bg-[#FAFAFA]/90 dark:bg-black/90 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
             <PaperKnifeLogo size={24} iconColor="#F43F5E" />
             <span className="text-lg font-black tracking-tighter text-gray-900 dark:text-white">PaperKnife</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main className="px-4 py-2 space-y-5 flex-1 overflow-y-auto scrollbar-hide">
        
        {/* Compact Hero: Sleek Upload Section */}
        <section className="relative">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-zinc-900 dark:bg-zinc-100 rounded-[2rem] p-6 text-left relative overflow-hidden shadow-xl group active:scale-[0.98] transition-all"
           >
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500 rounded-full blur-[60px] -mr-16 -mt-16 opacity-40 dark:opacity-20 group-active:opacity-60 transition-opacity" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                 <div className="flex justify-between items-start mb-8">
                    <div className="p-3 bg-white/10 dark:bg-black/5 rounded-xl backdrop-blur-md text-white dark:text-black">
                       <Upload size={24} strokeWidth={2.5} />
                    </div>
                    <div className="px-3 py-1.5 bg-rose-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/40">
                       100% LOCAL
                    </div>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-white dark:text-black tracking-tight leading-none mb-1.5">Select PDF</h2>
                    <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">Tap to begin local session</p>
                 </div>
              </div>
           </button>
        </section>

        {/* History Section - Now prioritized below Select */}
        <section>
          <div className="flex items-center justify-between px-2 mb-3">
             <div className="flex items-center gap-2">
                <Clock size={12} className="text-gray-400" />
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Stream</h3>
             </div>
             {history.length > 0 && (
                <button onClick={() => navigate('/android-history')} className="text-[9px] font-black uppercase text-rose-500">History</button>
             )}
          </div>
          
          {history.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 p-1 shadow-sm">
              {history.slice(0, 3).map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => navigate('/android-history')}
                  className="w-full p-3.5 flex items-center gap-3.5 rounded-[1.5rem] active:bg-gray-50 dark:active:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0 text-gray-400 dark:text-zinc-500">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold truncate text-gray-900 dark:text-white leading-tight">{item.name}</p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{item.tool} • {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[2rem]">
               <p className="text-[9px] font-black text-gray-300 dark:text-zinc-700 uppercase tracking-[0.2em]">Vault is Empty</p>
            </div>
          )}
        </section>

        {/* Engine Dashboard */}
        <section className="grid grid-cols-2 gap-2.5">
           <div className="col-span-2 px-2 mb-1 flex items-center justify-between">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Core Engines</h3>
              <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase tracking-widest">
                 Live RAM Node
              </div>
           </div>
           
           {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="p-4 bg-white dark:bg-zinc-900 rounded-[1.75rem] border border-gray-100 dark:border-white/5 flex flex-col gap-3 shadow-sm active:scale-95 transition-all group"
              >
                <div className={`w-10 h-10 ${action.bg} ${action.color} rounded-xl flex items-center justify-center group-active:scale-110 transition-transform`}>
                  <action.icon size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                   <span className="text-xs font-bold text-gray-900 dark:text-white block">{action.title}</span>
                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">System Utility</span>
                </div>
              </button>
            ))}

            <button
              onClick={() => navigate('/android-tools')}
              className="p-4 bg-rose-500 text-white rounded-[1.75rem] flex flex-col gap-3 shadow-lg shadow-rose-500/20 active:scale-95 transition-all col-span-2 relative overflow-hidden group"
            >
               <div className="absolute right-0 top-0 p-6 opacity-20 -mr-4 -mt-4 group-active:scale-110 transition-transform">
                  <LayoutGrid size={64} />
               </div>
               <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center relative z-10">
                  <Sparkles size={20} strokeWidth={2.5} />
               </div>
               <div className="text-left relative z-10">
                  <span className="text-sm font-black block">More Engines</span>
                  <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Full Catalog Access</span>
               </div>
            </button>
        </section>

        {/* Minimal Footer */}
        <div className="flex flex-col items-center gap-2 py-6 opacity-30">
           <PaperKnifeLogo size={18} iconColor="#F43F5E" />
           <p className="text-[8px] font-black uppercase tracking-[0.4em] dark:text-white text-center">Encrypted Session Node <br/> v1.0.0-beta</p>
        </div>

      </main>
    </div>
  )
}
