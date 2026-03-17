import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Award, Star } from 'lucide-react'

const supporters = [
  { name: 'For the Planet!' },
  { name: '1260er' },
  { name: 'Kalyan' },
]

export default function HallOfFame() {
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
             <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-white shrink-0">
                <Award size={24} strokeWidth={2.5} />
             </div>
             <div>
                <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none mb-1">Hall of Fame</h2>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Supporters</p>
             </div>
          </div>
        </div>

        {/* Hero Star */}
        <div className="px-6 pb-6 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-[3rem] flex items-center justify-center shadow-lg">
            <Star 
              size={48} 
              className="text-amber-500 fill-amber-500 animate-pulse" 
              style={{ animationDuration: '1.5s' }}
            />
          </div>
        </div>

        {/* Supporters */}
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden">
            {supporters.map((person, i) => (
              <div key={i} className="p-5 flex items-center gap-4 border-b border-gray-50 dark:border-white/5 last:border-0">
                <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Star size={20} className="text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{person.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Button */}
        <div className="px-6">
          <button 
            onClick={() => navigate('/sponsor')}
            className="w-full flex items-center justify-center gap-3 p-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-500/20"
          >
            <Star size={18} className="fill-white" />
            Join Hall of Fame
          </button>
        </div>

      </div>
    </div>
  )
}
