/**
 * PaperKnife - Privacy Protocol
 * Absolute data sovereignty and zero-telemetry specification.
 */

import { Shield, EyeOff, ServerOff, Database as DatabaseIcon, History as HistoryIcon, ExternalLink, Lock, Trash2, Cpu } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'

// --- WEB VERSION (TITAN HIGH-DENSITY) ---
const PrivacyWeb = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white p-6 md:p-12 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          <div className="md:col-span-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 md:p-16 border border-gray-100 dark:border-white/5 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
               <Shield size={300} strokeWidth={0.5} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-6 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                <Shield size={12} /> Certified Local Engine
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter dark:text-white leading-[0.9] mb-6">
                Architecture <br/>
                <span className="text-emerald-500 font-black">of Silence.</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-zinc-400 font-medium max-w-lg leading-relaxed">
                PaperKnife isn't just "private" by policy; it's private by architecture. We've eliminated the server entirely, ensuring that "No Data Found" is a technical reality, not just a promise.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 bg-zinc-900 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/5 shadow-2xl">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <Lock size={120} />
             </div>
             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <ServerOff size={32} className="text-emerald-400" />
             </div>
             <h2 className="text-2xl font-black tracking-tighter relative z-10 mb-1 leading-none">Zero Server</h2>
             <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 relative z-10">Absolute Sovereignty</p>
          </div>
        </div>

        {/* Protocol Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest dark:text-white">RAM Processing</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
              Files are streamed into your browser's volatile memory (RAM). We do not use disk-based caching or temporary cloud storage.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
              <EyeOff size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest dark:text-white">Zero Telemetry</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
              No tracking pixels. No cookies. No user IDs. We have no way of knowing how many files you process or who you are.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.25rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest dark:text-white">Auto-Wipe</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
              Processing data is purged as soon as you close the tab. The only data that persists is your local configuration (stored in your browser).
            </p>
          </div>
        </div>

        {/* Integrity Footer */}
        <div className="p-10 bg-emerald-500 text-white rounded-[3rem] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-2xl shadow-emerald-500/20">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
           <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
              <HistoryIcon size={32} />
           </div>
           <div className="flex-1 text-center md:text-left relative z-10">
              <h3 className="text-3xl font-black tracking-tighter mb-2">Local Persistence.</h3>
              <p className="text-emerald-50 font-medium text-base mb-6 max-w-2xl leading-relaxed">
                 Recent activity logs are stored exclusively in your browser's <span className="font-black">IndexedDB</span>. This data never touches a network. You remain the sole custodian of your history.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                 <a href="https://github.com/potatameister/PaperKnife" target="_blank" className="px-8 py-3 bg-white text-emerald-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
                    <Shield size={14} /> Audit Engine
                 </a>
              </div>
           </div>
        </div>

        <div className="pt-12 text-center opacity-30">
           <PaperKnifeLogo size={32} iconColor="#10B981" partColor="currentColor" className="mx-auto mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Privacy Protocol v1.0.7 Stable</p>
        </div>
      </div>
    </div>
  )
}

// --- APK VERSION (TITAN MOBILE NATIVE) ---
const PrivacyAPK = () => {
  return (
    <NativeToolLayout title="Privacy" description="Data Security Spec" actions={null}>
      <div className="px-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
        
        {/* Status Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner">
            <Shield size={28} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tighter dark:text-white leading-none mb-1">Local Secure</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Zero-Server Enabled</p>
          </div>
        </div>

        {/* Protocol List */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-white/5">
           <PrivacyItem 
             icon={ServerOff} 
             title="No Cloud Compute" 
             desc="All PDF logic runs on your phone's CPU. No document data is ever uploaded to any server." 
             color="text-rose-500 bg-rose-50 dark:bg-rose-900/20"
           />
           <PrivacyItem 
             icon={EyeOff} 
             title="No Telemetry" 
             desc="We use zero tracking, analytics, or user identifiers. Your usage is completely invisible to us." 
             color="text-blue-500 bg-blue-50 dark:bg-blue-900/20"
           />
           <PrivacyItem 
             icon={DatabaseIcon} 
             title="RAM Isolation" 
             desc="Documents stay in volatile memory. They vanish immediately when the application is closed." 
             color="text-amber-500 bg-amber-50 dark:bg-amber-900/20"
           />
           <PrivacyItem 
             icon={HistoryIcon} 
             title="Local-Only Logs" 
             desc="History is stored in your device storage (IndexedDB) and can be cleared instantly in settings." 
             color="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
           />
        </div>

        {/* Pledge Card */}
        <div className="bg-zinc-900 text-white rounded-[2rem] p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-10">
              <Lock size={80} />
           </div>
           <h3 className="text-lg font-black uppercase tracking-tight mb-3">Integrity Pledge</h3>
           <p className="text-xs text-zinc-400 leading-relaxed font-medium mb-6">
              PaperKnife is a transparent document workspace. We believe your data belongs to you, and we build tools that make that technically enforceable.
           </p>
           <a 
             href="https://github.com/potatameister/PaperKnife" 
             target="_blank" 
             className="flex items-center justify-center gap-2 py-3.5 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform"
           >
              Audit Source Code <ExternalLink size={14} />
           </a>
        </div>

        <p className="text-[8px] font-black uppercase text-center text-gray-400 tracking-[0.5em] pt-8">Handcrafted for Security</p>
      </div>
    </NativeToolLayout>
  )
}

const PrivacyItem = ({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) => (
  <div className="p-6 flex gap-5">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} strokeWidth={2.5} />
    </div>
    <div className="min-w-0">
      <h4 className="text-[13px] font-black dark:text-white uppercase tracking-tight mb-1">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
)

// --- MAIN ROUTER ---
export default function PrivacyPolicy() {
  const isNative = Capacitor.isNativePlatform()
  const isAndroidView = isNative || document.body.classList.contains('android-mode') || window.location.pathname.includes('android')

  return isAndroidView ? <PrivacyAPK /> : <PrivacyWeb />
}