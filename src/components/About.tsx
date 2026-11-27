/**
 * PaperKnife - About
 * What the app is, how it handles your files, and the open-source
 * libraries it is built with.
 */

import { useState } from 'react'
import {
  Heart as HeartIcon,
  Code as CodeIcon,
  Cpu as CpuIcon,
  Github as GHIcon,
  Shield as ShieldIcon,
  ChevronDown as ChevronDownIcon,
  ExternalLink as ExternalLinkIcon,
  ChevronRight as ChevronRightIcon,
  HardDrive as DiskIcon,
  EyeOff as PrivacyIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'
import { ViewMode } from '../types'
import { t } from '../i18n'

// --- UI COMPONENTS ---
const SpecItem = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 dark:border-zinc-800 last:border-0 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/10'}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <h4 className="font-black text-xs md:text-sm uppercase tracking-[0.2em] text-gray-900 dark:text-white transition-colors">{title}</h4>
        </div>
        <div className={`p-2 rounded-full transition-all ${isOpen ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-300'}`}>
          <ChevronDownIcon size={18} className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="pb-8 pl-16 pr-6 text-sm md:text-base text-gray-500 dark:text-zinc-400 font-medium leading-relaxed animate-in slide-in-from-top-4 duration-500">
          {children}
        </div>
      )}
    </div>
  )
}

const libraries = [
  { name: 'pdf-lib', url: 'https://github.com/Hopding/pdf-lib', desc: t("Reads, edits, and writes PDF files locally.") },
  { name: 'PDF.js', url: 'https://github.com/mozilla/pdf.js', desc: t("Renders PDF pages on screen.") },
  { name: 'Tesseract.js', url: 'https://github.com/naptha/tesseract.js', desc: t("Reads text from scanned pages, offline.") },
  { name: 'JSZip', url: 'https://github.com/Stuk/jszip', desc: t("Bundles exported files into ZIP archives.") },
  { name: 'Lucide', url: 'https://github.com/lucide-icons/lucide', desc: t("The icons used throughout the app.") },
  { name: 'Capacitor', url: 'https://github.com/ionic-team/capacitor', desc: t("Bridge between the web app and Android.") },
]

const LibraryList = ({ compact = false }: { compact?: boolean }) => (
  <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-3`}>
    {libraries.map((lib) => (
      <a
        key={lib.name}
        href={lib.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-rose-500 transition-all shadow-sm flex items-center gap-4"
      >
        <div className="w-10 h-10 bg-gray-50 dark:bg-black rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors text-gray-400 shrink-0 border border-transparent dark:border-white/5">
          <GHIcon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-xs tracking-widest uppercase dark:text-white">{lib.name}</h4>
          <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium truncate">{lib.desc}</p>
        </div>
        <ExternalLinkIcon size={14} className="text-gray-300 group-hover:text-rose-500 transition-all shrink-0" />
      </a>
    ))}
  </div>
)

// --- WEB VERSION (landing page: hero, tool showcase, steps, libraries) ---
const popularTools = [
  { title: t("Merge PDFs"), desc: t("Combine files into one document."), path: '/merge' },
  { title: t("Compress"), desc: t("Shrink file size, keep quality."), path: '/compress' },
  { title: t("Split"), desc: t("Extract the pages you need."), path: '/split' },
  { title: t("Protect"), desc: t("Lock files with a password."), path: '/protect' },
  { title: t("Sign"), desc: t("Draw or upload your signature."), path: '/signature' },
  { title: t("Watermark"), desc: t("Stamp text across pages."), path: '/watermark' },
]

const steps = [
  { n: '01', title: t("Pick a tool"), desc: t("Choose what you want to do. No account, no install, no waiting room.") },
  { n: '02', title: t("Drop your file"), desc: t("It opens right in your browser. Nothing uploads — watch your network tab if you doubt it.") },
  { n: '03', title: t("Download the result"), desc: t("Processed on the spot, saved straight to your device.") },
]

const webPrivacyCards = [
  { icon: CpuIcon, title: t("Runs on your device"), desc: t("Every tool executes locally. Nothing is uploaded anywhere, ever.") },
  { icon: PrivacyIcon, title: t("Files live in memory"), desc: t("Documents stay in temporary memory (RAM). Closing the tab wipes them.") },
  { icon: DiskIcon, title: t("Metadata cleaning"), desc: t("Strip identifying details like Producer, Creator, and editing history.") },
  { icon: CodeIcon, title: t("Open source"), desc: t("100% open source under GNU AGPL v3. Anyone can audit the code.") },
]

const AboutWeb = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white pb-24">

      {/* Hero */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.07),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-[1.75rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-center mx-auto mb-6">
            <PaperKnifeLogo size={40} iconColor="#F43F5E" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter dark:text-white mb-4 leading-[0.95]">
            {t("PDF tools that")}<br />{t("never phone home.")}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium mb-8">
            {t("Merge, compress, sign, and protect PDFs right in your browser. Free, no accounts, no ads — your files never leave this tab.")}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <button onClick={() => navigate('/')} className="px-8 py-3.5 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-xl shadow-rose-500/20">
              {t("Browse Tools")}
            </button>
            <a href="https://potatameister.github.io/support" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-sm flex items-center gap-2">
              <HeartIcon size={14} className="text-rose-500" fill="currentColor" /> {t("Support")}
            </a>
          </div>
          <p className="inline-block text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-zinc-900 rounded-full px-4 py-1.5">{t("v1.1.0 • Works offline • AGPL v3")}</p>
        </div>
      </section>

      {/* Tool showcase */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1]">
            {t("What you can do.")}
          </h2>
          <button onClick={() => navigate('/')} className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors">
            {t("All tools")} <ChevronRightIcon size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {popularTools.map((tool) => (
            <button
              key={tool.title}
              onClick={() => navigate(tool.path)}
              className="group p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 hover:border-rose-500 transition-all shadow-sm text-left"
            >
              <h3 className="font-black text-base dark:text-white mb-1 group-hover:text-rose-500 transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{tool.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1] mb-8">
          {t("How it works.")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step) => (
            <div key={step.n} className="p-6 bg-zinc-950 dark:bg-white rounded-[2rem] text-white dark:text-black">
              <p className="text-[11px] font-black tracking-[0.3em] text-rose-500 mb-4">{step.n}</p>
              <h3 className="font-black text-lg mb-2">{step.title}</h3>
              <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy cards */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1] mb-8">
          {t("Private by construction.")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {webPrivacyCards.map((card) => (
            <div key={card.title} className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
                <card.icon size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-black text-sm dark:text-white mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Open-source libraries */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1] mb-3">
          {t("Built with open source.")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium mb-8 max-w-xl">
          {t("PaperKnife stands on these free libraries. Thank you to everyone who builds and maintains them.")}
        </p>
        <LibraryList />
      </section>

      {/* Support banner */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="bg-rose-500 text-white rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-xl shadow-rose-500/20">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
            <HeartIcon size={32} fill="currentColor" />
          </div>
          <div className="flex-1 text-center md:text-left relative z-10">
            <h3 className="text-3xl font-black tracking-tighter mb-3 leading-tight">{t("Keep it free.")}</h3>
            <p className="text-rose-100 font-medium text-base mb-6 max-w-xl leading-relaxed">
              {t("PaperKnife is self-funded. Your support keeps it free and private for everyone.")}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <a href="https://potatameister.github.io/support" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 bg-white text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-lg flex items-center gap-2">
                <HeartIcon size={14} fill="currentColor" /> {t("Support")}
              </a>
              <button onClick={() => navigate('/thanks')} className="px-8 py-3.5 bg-rose-600 text-white border border-rose-400/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition-colors">
                {t("Hall of Fame")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <section className="max-w-4xl mx-auto px-6 text-center border-t border-gray-100 dark:border-zinc-900 pt-16">
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors group">
            <GHIcon size={16} /> {t("Source Code")} <ExternalLinkIcon size={12} className="opacity-40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
          <button onClick={() => navigate('/thanks')} className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors group">
            {t("Hall of Fame")} <ChevronRightIcon size={12} className="opacity-40 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="opacity-20 hover:opacity-50 transition-opacity duration-700">
          <PaperKnifeLogo size={32} iconColor="#F43F5E" className="mx-auto mb-4" />
          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-400">potatameister</p>
        </div>
      </section>

    </div>
  )
}

// --- APK VERSION ---
const AboutAPK = () => {
  const navigate = useNavigate()
  return (
    <NativeToolLayout title={t("About")} description="PaperKnife" actions={null}>
      <div className="px-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">

        {/* App identity */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-black rounded-[1.5rem] flex items-center justify-center shadow-inner mb-4">
            <PaperKnifeLogo size={40} iconColor="#F43F5E" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter dark:text-white leading-none mb-1">PaperKnife</h2>
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">{t("v1.1.0 • Free and private")}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium leading-relaxed mt-3 max-w-xs">
            {t("PDF tools that run entirely on your phone. Your files never leave your hands.")}
          </p>
        </div>

        {/* Support */}
        <div className="bg-rose-500 text-white rounded-[2rem] p-6 relative overflow-hidden shadow-xl shadow-rose-500/20">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <HeartIcon size={100} fill="currentColor" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">{t("Keep it free")}</h3>
            <p className="text-sm font-medium text-rose-100 leading-relaxed mb-6">
              {t("PaperKnife is self-funded. Your support keeps it free for everyone.")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a href="https://potatameister.github.io/support" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 bg-white text-rose-600 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-sm active:scale-95 transition-transform">
                {t("Support")}
              </a>
              <button onClick={() => navigate('/thanks')} className="flex items-center justify-center gap-2 py-3 bg-rose-600 text-white border border-rose-400/50 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-transform">
                {t("Hall of Fame")}
              </button>
            </div>
          </div>
        </div>

        {/* How your files are handled */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-2 border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 dark:border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t("How your files are handled")}</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/5 px-2">
            <SpecItem title={t("Runs on your device")} icon={CpuIcon}>
              {t("Every tool runs locally on your phone. Nothing is uploaded anywhere, ever.")}
            </SpecItem>
            <SpecItem title={t("Files live in memory")} icon={PrivacyIcon}>
              {t("Your documents stay in temporary memory (RAM) while you work. Closing the app wipes them.")}
            </SpecItem>
            <SpecItem title={t("Metadata cleaning")} icon={DiskIcon}>
              {t("The metadata tool removes identifying details like Producer, Creator, and editing history from your files.")}
            </SpecItem>
            <SpecItem title={t("Open source")} icon={CodeIcon}>
              {t("PaperKnife is 100% open source under the GNU AGPL v3 license. Anyone can read and audit the code.")}
            </SpecItem>
            <SpecItem title={t("No servers")} icon={ShieldIcon}>
              {t("There is no backend, no database, and no cloud. The app works fully offline.")}
            </SpecItem>
          </div>
        </div>

        {/* Open-source libraries */}
        <div>
          <h3 className="px-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t("Open-source libraries")}</h3>
          <LibraryList compact />
        </div>

        {/* Action tiles */}
        <div className="grid grid-cols-1 gap-2 pt-2">
          <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2rem] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-black rounded-xl flex items-center justify-center">
                <GHIcon size={20} className="text-black dark:text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm dark:text-white">{t("Source Code")}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t("AGPL v3 License")}</p>
              </div>
            </div>
            <ExternalLinkIcon size={16} className="text-gray-300" />
          </a>

          <button onClick={() => navigate('/thanks')} className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2rem] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
                <HeartIcon size={20} className="text-rose-500" fill="currentColor" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm dark:text-white">{t("Hall of Fame")}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{t("Supporters")}</p>
              </div>
            </div>
            <ChevronRightIcon size={16} className="text-gray-300" />
          </button>
        </div>

        <p className="text-[8px] font-black uppercase text-center text-gray-400 tracking-[0.5em] pt-8 pb-4">{t("Handcrafted by potatameister")}</p>
      </div>
    </NativeToolLayout>
  )
}

// --- MAIN ROUTER ---
export default function About({ viewMode }: { viewMode?: ViewMode }) {
  const isAndroid = viewMode === 'android' || (viewMode === undefined && Capacitor.isNativePlatform())
  return isAndroid ? <AboutAPK /> : <AboutWeb />
}
