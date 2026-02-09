import { Shield, Lock, EyeOff, ServerOff, Database, History } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'

export default function PrivacyPolicy() {
  const isNative = Capacitor.isNativePlatform()

  const content = (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <section className="text-center py-8">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
          <Shield size={40} />
        </div>
        <h1 className="text-4xl font-black tracking-tighter dark:text-white mb-4">Privacy Policy</h1>
        <p className="text-gray-500 dark:text-zinc-400 font-medium">PaperKnife "Zero-Server" Architecture</p>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center">
              <ServerOff size={20} />
            </div>
            <h3 className="font-black dark:text-white uppercase tracking-tight">Zero Server</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            PaperKnife is 100% client-side. Your PDF files never leave your device. All processing (merging, splitting, encryption) happens in your browser's RAM or the app's local memory.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
              <EyeOff size={20} />
            </div>
            <h3 className="font-black dark:text-white uppercase tracking-tight">No Tracking</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            We do not use cookies, analytics, or telemetry. We don't know who you are, what you process, or how often you use the app.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl flex items-center justify-center">
              <Database size={20} />
            </div>
            <h3 className="font-black dark:text-white uppercase tracking-tight">Volatile Memory</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            When you close the app or the browser tab, all processed PDF data is wiped from memory (RAM). We only store your theme preferences and recent activity history locally on your device (IndexedDB).
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            <h3 className="font-black dark:text-white uppercase tracking-tight">Local History</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            Recent activity is stored locally for your convenience. You can clear this history at any time in the Settings dashboard or use the "Auto-Wipe" feature.
          </p>
        </div>
      </div>

      <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white">
        <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Integrity Pledge</h3>
        <p className="text-sm text-zinc-400 leading-relaxed font-medium">
          As an open-source project, PaperKnife's source code is publicly available for auditing. We believe that privacy is a fundamental human right, and our architecture reflects that.
        </p>
      </div>
    </div>
  )

  if (isNative) {
    return (
      <NativeToolLayout title="Privacy" description="Our privacy commitment" actions={null}>
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
