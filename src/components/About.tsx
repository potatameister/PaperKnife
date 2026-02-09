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
  Globe, Cpu, Layers, Terminal
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'

export default function About() {
  const isNative = Capacitor.isNativePlatform()

  const content = (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* Hero Section */}
      <section className="text-center py-12 px-6">
        <div className="inline-flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-rose-500 text-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-rose-500/30">
            <PaperKnifeLogo size={48} iconColor="#FFFFFF" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter dark:text-white mb-2 leading-none">PaperKnife</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 opacity-80">Orchestration Engine v1.0.0-beta</p>
        </div>
        <p className="text-lg text-gray-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
          The industry-standard for private PDF manipulation. Built on the principle of <b>Absolute Sovereignty</b>—where your data never leaves the local runtime.
        </p>
      </section>

      {/* Architecture Cards */}
      <section className="px-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { title: 'Local Compute', icon: Cpu, desc: 'Heavy-lifting happens on your hardware, not a remote server farm.' },
          { title: 'Zero-Server Logic', icon: ShieldCheck, desc: 'Files are loaded into volatile RAM. No part of your document is ever uploaded.' },
          { title: 'Stateless Ops', icon: Globe, desc: 'Zero persistence of your documents. When you close the session, we forget.' }
        ].map((item, i) => (
          <div key={i} className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center mb-4">
              <item.icon size={20} />
            </div>
            <h4 className="font-bold text-sm dark:text-white mb-2">{item.title}</h4>
            <p className="text-xs text-gray-500 dark:text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Technical Protocol Group */}
      <section className="mb-12">
        <div className="px-6 mb-6 flex items-center gap-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Technical Protocol</h3>
          <div className="h-[1px] flex-1 bg-gray-100 dark:bg-white/5" />
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border-y border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5 shadow-sm">
          {[
            { title: 'Zero-Server Logic', icon: ShieldCheck, desc: 'Files are loaded into volatile RAM as ArrayBuffers. No part of your document is ever uploaded or cached on any network infrastructure.', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { title: 'Direct DOM Rendering', icon: Layers, desc: 'PDF previews are generated using PDF.js workers, rendering directly to HTML5 Canvas without intermediary server-side rasterization.', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { title: 'OpenLink Encryption', icon: Code, desc: 'Security tools utilize standard cryptographic primitives compliant with AGPL v3. Passwords are destroyed immediately after session termination.', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' }
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

      {/* Links & License */}
      <section className="px-4 grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 -mr-4 -mt-4 group-hover:scale-110 transition-transform">
            <Scale size={80} />
          </div>
          <div className="relative z-10">
            <Scale className="text-rose-500 mb-4" size={32} />
            <h4 className="text-xl font-black mb-2 leading-tight">AGPL v3 <br/>Open Source</h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-medium">Verified privacy claims via public audit. The entire engine is open for inspection.</p>
          </div>
          <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="relative z-10 text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2 hover:translate-x-1 transition-transform">
            View Source Code <Terminal size={12} />
          </a>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col justify-between group relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform">
            <Heart size={80} />
          </div>
          <div className="relative z-10">
            <Heart className="text-rose-500 mb-4" size={32} />
            <h4 className="text-xl font-black dark:text-white mb-2 leading-tight">Community <br/>Driven</h4>
            <p className="text-xs text-gray-500 dark:text-zinc-500 leading-relaxed mb-6 font-medium">Independent, ad-free, and supported by users who believe in data privacy.</p>
          </div>
          <Link to="/thanks" className="relative z-10 text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2 hover:translate-x-1 transition-transform">
            Meet Supporters <Globe size={12} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-12 opacity-30">
         <PaperKnifeLogo size={24} iconColor="#F43F5E" className="mx-auto mb-4" />
         <p className="text-[9px] font-black uppercase tracking-[0.5em]">PaperKnife Node v1.0.0-beta</p>
      </footer>
    </div>
  )

  if (isNative) {
    return (
      <NativeToolLayout title="About Engine" description="System specifications" actions={null}>
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
