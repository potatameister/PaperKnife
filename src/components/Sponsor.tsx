import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Coffee, Github } from 'lucide-react'

export default function Sponsor() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black pb-32 transition-colors">
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
                <Heart size={24} strokeWidth={2.5} />
             </div>
             <div>
                <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none mb-1">Sponsor</h2>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Support Development</p>
             </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 p-5">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Your support helps keep PaperKnife <span className="font-black text-rose-500">free</span> and <span className="font-black text-rose-500">open source</span>. 
              Every contribution goes towards:
            </p>
            <ul className="mt-4 space-y-2">
              {[
                'Development time & effort',
                'New features & improvements',
                'Play Store/App Store fees'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* GitHub Sponsor */}
        <div className="px-6 pb-4">
          <a 
            href="https://github.com/sponsors/potatameister"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-5 bg-gradient-to-r from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-[1.5rem] border border-gray-700 dark:border-gray-600 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
                <Github size={28} className="text-black" />
              </div>
              <div className="flex-1">
                <p className="text-base font-black text-white">GitHub Sponsors</p>
                <p className="text-[10px] text-gray-400 font-medium">Monthly support • Get featured</p>
              </div>
            </div>
          </a>
        </div>

        {/* Buy Me a Coffee */}
        <div className="px-6 pb-6">
          <a 
            href="https://buymeacoffee.com/potatameister"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[1.5rem] border border-amber-300 shadow-lg shadow-amber-500/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
                <Coffee size={28} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-base font-black text-white">Buy me a coffee</p>
                <p className="text-[10px] text-amber-100 font-medium">One-time support • Fuel development</p>
              </div>
            </div>
          </a>
        </div>

        {/* Footer Note */}
        <div className="px-6">
          <p className="text-center text-[10px] text-gray-400 font-medium">
            Thank you for supporting independent developers! 🙏
          </p>
        </div>

      </div>
    </div>
  )
}
