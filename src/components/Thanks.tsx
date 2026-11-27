import { Github as GHIcon, Heart as HeartIcon, Sparkles } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'
import { t } from '../i18n'

const supporters = [
  'Kalyan', 'For the Planet', '1260er', 'Sushant Sangle', 'Bittu Shaw',
  '@chetly96', 'Andreil', 'Csaba Gal', 'Jason', 'Vishnumahanthy Mohan',
  'Maurin', 'Moh', 'Balboc', 'Winkewinke', 'Akalollo',
  'Loïc', 'Johannes', 'yogs', 'Vincent', 'onyks',
]

export default function Thanks() {
  const isNative = Capacitor.isNativePlatform()


  const content = (
    <div className="animate-in fade-in duration-700">
      <section className={isNative ? "mb-8 text-center py-2" : "mb-12 text-center"}>
        <div className="flex items-center justify-center gap-2 text-rose-500 font-black text-[9px] uppercase tracking-[0.4em] mb-4">
          <Sparkles size={12} /> {t("Acknowledgments")}
        </div>
        <h2 className={isNative ? "text-3xl font-black tracking-tighter dark:text-white leading-tight mb-3" : "text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-[1.1] mb-6"}>
          {t("The")} <span className="text-rose-500">{t("Supporters.")}</span>
        </h2>
        <p className="text-base md:text-lg text-gray-500 dark:text-zinc-400 leading-relaxed font-medium max-w-xl mx-auto px-4">
          {t("PaperKnife is a self-funded labor of love. These are the people who keep it free and private.")}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 mb-12">
        {/* Main Supporter Card / Hall of Fame - Compact */}
        <div className="p-10 bg-zinc-900 text-white rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center gap-10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-1000">
            <HeartIcon size={160} fill="currentColor" />
          </div>
          
          <div className="w-20 h-20 bg-rose-500 text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20 animate-pulse relative z-10">
            <HeartIcon size={32} fill="currentColor" />
          </div>
          
          <div className="flex-1 text-center md:text-left relative z-10">
            <h3 className="text-3xl font-black tracking-tighter mb-2">{t("Hall of Fame")}</h3>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-lg mb-8 mx-auto md:mx-0">
              {t("The heroes who fuel the engine. Your support ensures PaperKnife stays free and private forever. Sponsors receive a permanent shout-out here.")}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <a href="https://potatameister.github.io/support" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-3.5 bg-white text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-lg">
                <HeartIcon size={14} fill="currentColor" /> {t("Support PaperKnife")}
              </a>
              <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-3.5 bg-zinc-950 dark:bg-white text-white dark:text-black border border-white/20 dark:border-transparent rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-lg">
                <GHIcon size={14} /> {t("Source Code")}
              </a>
            </div>
          </div>
        </div>

        {/* Supporters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {supporters.map((name) => (
            <span
              key={name}
              className="px-5 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm font-bold text-sm dark:text-white"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <footer className="text-center py-8 opacity-20">
         <PaperKnifeLogo size={24} iconColor="#F43F5E" partColor="currentColor" className="mx-auto mb-4" />
         <p className="text-[8px] font-black uppercase tracking-[0.5em]">{t("PaperKnife Protocol v1.1.0")}</p>
      </footer>
    </div>
  )

  if (isNative) {
    return (
      <NativeToolLayout title={t("Credits")} description={t("Hall of Fame & Ecosystem")} actions={null}>
        <div className="pb-20">
          {content}
        </div>
      </NativeToolLayout>
    )
  }

  return (
    <div className="min-h-full bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {content}
      </main>
    </div>
  )
}
