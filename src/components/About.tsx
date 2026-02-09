/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { 
  Heart, ShieldCheck, Code, Scale, 
  Globe, Cpu, Layers, Terminal, Github, ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'

export default function About() {
  const isNative = Capacitor.isNativePlatform()

  const content = (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* Dynamic Themed Hero Icon Section */}
      <section className="text-center py-12 px-6">
        <div className="inline-flex flex-col items-center mb-8">
          {/* 
             Icon Logic requested: 
             Light Mode: Black BG, Pink/White Icon
             Dark Mode: White BG, Pink/Black Icon 
          */}
          <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl transition-all bg-zinc-950 dark:bg-white">
            <PaperKnifeLogo 
              size={48} 
              className="dark:filter dark:invert-0" 
              iconColor="#F43F5E" 
            />
          </div>
          <h1 className="text-5xl font-black tracking-tighter dark:text-white mb-2 leading-none">PaperKnife</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 opacity-80">v1.0.0-beta • Final Node</p>
        </div>
        
        <div className="max-w-2xl mx-auto space-y-6 text-left md:text-center">
          <h2 className="text-2xl font-black dark:text-white leading-tight">Your data belongs to you. Not some random cloud server.</h2>
          <p className="text-base text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
            Most "free" PDF tools online work by uploading your private files—contracts, bank statements, and IDs—to their servers. We think that's a massive privacy risk. 
            <br/><br/>
            PaperKnife was built to be different. It's a professional-grade engine that runs <b>entirely inside your phone or browser</b>. Once the app loads, you could literally turn off your internet and it would still work perfectly.
          </p>
        </div>
      </section>

      {/* Philosophy Cards */}
      <section className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck size={24} />
          </div>
          <h4 className="text-xl font-black dark:text-white mb-3">Absolute Privacy</h4>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
            We don't have a database. We don't have a backend. We don't have tracking scripts. Your files are loaded into your device's temporary memory (RAM), processed, and wiped the second you close the app.
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
            <Cpu size={24} />
          </div>
          <h4 className="text-xl font-black dark:text-white mb-3">Local Power</h4>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
            By leveraging high-performance Web Workers, PaperKnife uses your own device's CPU to do the heavy lifting. This means faster processing for you and zero risk of your data being intercepted over a network.
          </p>
        </div>
      </section>

      {/* Quick Links Group */}
      <section className="px-4 mb-12">
         <div className="bg-zinc-950 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-10 -mr-8 -mt-8">
               <Code size={120} />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Open Source <br/>Integrity</h3>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-xs">
                    PaperKnife is open-source. Anyone can audit the code to verify our privacy claims. We believe transparency is the only way to build true security.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                     <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Github size={14} /> Source
                     </a>
                     <a href="https://github.com/potatameister/PaperKnife/blob/main/LICENSE" target="_blank" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        <Scale size={14} /> License
                     </a>
                  </div>
               </div>

               <div className="space-y-4 flex flex-col justify-end">
                  <div className="flex flex-col gap-3">
                     <a href="https://github.com/sponsors/potatameister" target="_blank" className="flex items-center justify-center gap-3 bg-rose-500 hover:bg-rose-600 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95">
                        <Heart size={16} fill="currentColor" /> Sponsor Project
                     </a>
                     <Link to="/thanks" className="flex items-center justify-center gap-3 bg-white text-black px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95">
                        <Globe size={16} /> Meet Supporters
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Technical Protocol Group */}
      <section className="mb-12">
        <div className="px-6 mb-6 flex items-center gap-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">The Stack</h3>
          <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5" />
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border-y border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 shadow-sm">
          {[
            { title: 'Affero GPL v3', icon: Scale, desc: 'A copyleft license that ensures the project remains open and any network-hosted versions share their source code.', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { title: 'Core Orchestration', icon: Layers, desc: 'Powered by pdf-lib and PDF.js, providing lossless document manipulation and high-fidelity rendering.', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { title: 'Chameleon Runtime', icon: Terminal, desc: 'An adaptive UI architecture built with React and Tailwind that shifts perfectly between mobile and desktop.', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' }
          ].map((spec, i) => (
            <div key={i} className="p-6 flex gap-5">
              <div className={`w-12 h-12 ${spec.bg} ${spec.color} rounded-[1.25rem] flex items-center justify-center shrink-0`}>
                <spec.icon size={22} />
              </div>
              <div>
                <h4 className="text-sm font-black dark:text-white uppercase tracking-tight mb-1">{spec.title}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">{spec.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 opacity-30">
         <PaperKnifeLogo size={24} iconColor="#F43F5E" className="mx-auto mb-4" />
         <p className="text-[9px] font-black uppercase tracking-[0.5em]">Built with privacy by potatameister</p>
      </footer>
    </div>
  )

  if (isNative) {
    return (
      <NativeToolLayout title="About" description="Our privacy protocol" actions={null}>
        {content}
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