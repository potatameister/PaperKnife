import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  ChevronRight,
  FileText,
  Layers, Zap, Scissors, Lock,
  Moon, Sun, Upload, Cpu, ShieldCheck, Database,
  Palette, FileImage, LayoutGrid
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

  const categories = [
    { name: 'Edit', icon: Palette, color: 'bg-rose-500' },
    { name: 'Convert', icon: FileImage, color: 'bg-emerald-500' },
    { name: 'Optimize', icon: Zap, color: 'bg-amber-500' },
    { name: 'Secure', icon: Lock, color: 'bg-indigo-500' },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-black transition-colors">
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

      <main className="px-4 py-4 space-y-6 flex-1 overflow-y-auto pb-32">
        
        {/* Hero: Quick Action Card */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-[2/1] bg-zinc-900 dark:bg-zinc-100 rounded-[2.5rem] relative overflow-hidden shadow-2xl group active:scale-[0.98] transition-all flex flex-col justify-between p-6"
        >
           <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-[80px] -mr-20 -mt-20 opacity-40 dark:opacity-30 group-active:opacity-50 transition-opacity" />
           
           <div className="relative z-10 flex justify-between items-start w-full">
              <div className="p-3 bg-white/10 dark:bg-black/5 rounded-2xl backdrop-blur-sm text-white dark:text-black">
                 <Upload size={28} />
              </div>
              <div className="px-3 py-1.5 bg-white/10 dark:bg-black/5 rounded-full backdrop-blur-md">
                 <span className="text-[10px] font-black uppercase tracking-widest text-white dark:text-black">Local Node</span>
              </div>
           </div>

           <div className="relative z-10 text-left">
              <h2 className="text-3xl font-black text-white dark:text-black tracking-tight leading-none mb-1">Select File</h2>
              <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600">Tap to process a PDF instantly</p>
           </div>
        </button>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
           {categories.map(cat => (
             <button 
              key={cat.name}
              onClick={() => navigate('/android-tools')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-gray-100 dark:border-zinc-800 shadow-sm shrink-0 active:scale-95 transition-transform"
             >
                <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                <span className="text-xs font-bold dark:text-white">{cat.name}</span>
             </button>
           ))}
        </div>

        {/* Engine Status Card */}
        <section className="bg-emerald-500 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-lg shadow-emerald-500/20">
           <div className="absolute top-0 right-0 p-8 text-white/10 -mr-4 -mt-4">
              <ShieldCheck size={100} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-4 opacity-80">
                 <Cpu size={14} /> Privacy Engine Active
              </div>
              <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Zero-Server Node</h3>
              <p className="text-xs font-medium text-emerald-100 leading-relaxed max-w-[200px]">
                 All processing is happening locally on your device. No data is being transmitted.
              </p>
           </div>
        </section>

        {/* Essentials Grid */}
        <section>
          <div className="flex items-center justify-between px-2 mb-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Essentials</h3>
            <button onClick={() => navigate('/android-tools')} className="text-xs font-bold text-rose-500">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="p-4 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex flex-col gap-3 shadow-sm active:scale-95 transition-all"
              >
                <div className={`w-10 h-10 ${action.bg} ${action.color} rounded-2xl flex items-center justify-center`}>
                  <action.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white text-left">{action.title}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Activity List */}
        {history.length > 0 && (
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2 mb-3">Recent Activity</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 p-2 shadow-sm">
              {history.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => navigate('/android-history')}
                  className="w-full p-3 flex items-center gap-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{item.tool}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Privacy Badge */}
        <div className="flex flex-col items-center gap-2 py-6 opacity-50">
           <Shield size={16} className="text-emerald-500" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Privacy Guard Active</p>
        </div>

      </main>
    </div>
  )
}
