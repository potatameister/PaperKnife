import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  Download, 
  Moon, Sun, 
  History, Upload, ChevronRight, ChevronDown,
  Plus, Trash2, CheckCircle2, Home, Info, ArrowLeft,
  LayoutGrid, Settings
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Theme, Tool, ToolCategory, ViewMode } from '../types'
import { PaperKnifeLogo } from './Logo'
import { ActivityEntry, getRecentActivity, clearActivity } from '../utils/recentActivity'

interface LayoutProps {
  children: React.ReactNode
  theme: Theme
  toggleTheme: () => void
  tools: Tool[]
  onFileDrop?: (files: FileList) => void
  viewMode: ViewMode
}

const categoryColors: Record<ToolCategory, { bg: string, text: string, hover: string, iconBg: string }> = {
  Edit: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500', hover: 'hover:bg-rose-50 dark:hover:bg-rose-900/10', iconBg: 'bg-rose-100 dark:bg-rose-900/30' },
  Secure: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-500', hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/10', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  Convert: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500', hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  Optimize: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500', hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/10', iconBg: 'bg-amber-100 dark:bg-amber-900/30' }
}

export default function Layout({ children, theme, toggleTheme, tools, onFileDrop, viewMode }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isDragging, setIsDragging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isNative = Capacitor.isNativePlatform()
  const showMobileNav = isNative || viewMode === 'android'

  useEffect(() => {
    if (showHistory) {
      getRecentActivity().then(setActivity)
    }
  }, [showHistory])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (onFileDrop) setIsDragging(true)
    }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDragging(false)
      }
    }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (onFileDrop && e.dataTransfer?.files) {
        onFileDrop(e.dataTransfer.files)
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [onFileDrop])

  const activeTool = tools.find(t => {
    const path = `/${t.title.split(' ')[0].toLowerCase()}`
    return location.pathname.includes(path)
  })

  const isHome = location.pathname === '/' || location.pathname === '/PaperKnife/'

  return (
    <div className={`min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 transition-colors duration-300`}>
      
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-rose-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl border-4 border-dashed border-rose-500 animate-in zoom-in duration-300">
            <Upload size={64} className="text-rose-500 animate-bounce" />
            <p className="mt-4 font-black uppercase tracking-widest text-rose-500 text-center text-sm">Drop PDF to start</p>
          </div>
        </div>
      )}

      {/* Web Header */}
      {!showMobileNav && (
        <header className="flex items-center justify-between px-8 h-20 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-[100]">
          <div className="flex items-center gap-4">
            {!isHome && (
              <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors text-gray-500 hover:text-rose-500 mr-1"><ArrowLeft size={20} /></button>
            )}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <PaperKnifeLogo size={28} />
              <span className="font-black tracking-tighter text-xl dark:text-white">PaperKnife</span>
            </Link>
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-zinc-800 mx-2" />
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-black text-sm uppercase tracking-widest ${isDropdownOpen ? 'bg-rose-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900'}`}>
                {isHome ? 'All Tools' : activeTool?.title || 'Tool'}
                <ChevronDown size={16} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-3 w-80 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] shadow-2xl py-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 max-h-[80vh] overflow-y-auto scrollbar-hide">
                  {Object.entries(tools.filter(t => t.implemented).reduce((acc, tool) => { if (!acc[tool.category]) acc[tool.category] = []; acc[tool.category].push(tool); return acc }, {} as Record<string, Tool[]>)).map(([category, categoryTools]) => {
                    const colors = categoryColors[category as ToolCategory]
                    return (
                      <div key={category} className="mb-4">
                        <div className="px-6 py-2"><span className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.text} opacity-60`}>{category}</span></div>
                        <div className="grid grid-cols-1 gap-1 px-2">
                          {categoryTools.map((tool, i) => {
                            const Icon = tool.icon; const isActive = activeTool?.title === tool.title && !isHome
                            return (
                              <button key={i} onClick={() => { navigate(tool.path || '/'); setIsDropdownOpen(false); }} className={`flex items-center gap-4 p-3 rounded-2xl transition-all text-left group ${isActive ? `${colors.bg} ${colors.text}` : `hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400`}`}>
                                <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white dark:bg-zinc-800' : `${colors.iconBg} ${colors.text} opacity-70 group-hover:opacity-100`}`}><Icon size={18} /></div>
                                <div className="flex-1 min-w-0"><p className="text-xs font-black uppercase tracking-tight">{tool.title}</p><p className="text-[10px] opacity-60 truncate">{tool.desc}</p></div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/about" className={`p-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${location.pathname.includes('about') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900'}`}><Info size={18} />About</Link>
            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
            <button onClick={() => setShowHistory(true)} className={`p-2 transition-colors relative ${showHistory ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}><History size={20} />{activity.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-black" />}</button>
          </div>
        </header>
      )}

      <main className={`flex-1 min-w-0 ${isNative ? 'pb-24' : ''}`}>
        {children}
      </main>

      {/* Titan Bottom Navigation (Solid, Grounded) */}
      {showMobileNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-800 flex items-end justify-between px-6 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <button 
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${location.pathname === '/' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600'}`}
          >
            <Home size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          <button 
            onClick={() => navigate('/android-tools')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${location.pathname === '/android-tools' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600'}`}
          >
            <LayoutGrid size={24} strokeWidth={location.pathname === '/android-tools' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Tools</span>
          </button>

          {/* Floating Action Button - Lifted */}
          <div className="relative -top-8">
             <button 
               onClick={() => {
                 const input = document.createElement('input')
                 input.type = 'file'
                 input.accept = '.pdf'
                 input.onchange = (e) => {
                   const file = (e.target as HTMLInputElement).files?.[0]
                   if (file) onFileDrop?.([file] as any)
                 }
                 input.click()
               }}
               className="w-14 h-14 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-500/40 flex items-center justify-center active:scale-90 transition-transform ring-4 ring-white dark:ring-black"
             >
               <Plus size={32} strokeWidth={3} />
             </button>
          </div>
          
          <button 
            onClick={() => navigate('/android-history')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${location.pathname === '/android-history' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600'}`}
          >
            <History size={24} strokeWidth={location.pathname === '/android-history' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">History</span>
          </button>

          <Link 
            to="/about"
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all no-underline ${location.pathname.includes('about') ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600'}`}
          >
            <Settings size={24} strokeWidth={location.pathname.includes('about') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Settings</span>
          </Link>
        </nav>
      )}

      {/* Sidebar History Drawer */}
      <aside className={`fixed top-0 right-0 h-screen w-full sm:w-80 bg-white dark:bg-zinc-950 border-l border-gray-100 dark:border-zinc-800 z-[150] shadow-2xl transition-transform duration-500 ease-out transform ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <History className="text-rose-500" size={24} />
              <h2 className="text-xl font-black dark:text-white">Activity</h2>
            </div>
            <div className="flex items-center gap-2">
              {activity.length > 0 && (
                <button 
                  onClick={async () => { await clearActivity(); setActivity([]); }}
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
            {activity.length === 0 ? (<div className="text-center py-20 opacity-40"><p className="text-xs font-bold uppercase tracking-widest text-gray-400">No recent files</p></div>) : (
              activity.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800 group relative">
                  <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg flex items-center justify-center"><CheckCircle2 size={16} /></div><div className="flex-1 min-w-0"><p className="text-xs font-bold truncate dark:text-white">{item.name}</p><p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{item.tool}</p></div></div>
                  <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold"><span>{new Date(item.timestamp).toLocaleTimeString()}</span>{item.resultUrl && (<a href={item.resultUrl} download={item.name} className="text-rose-500 hover:underline flex items-center gap-1"><Download size={10} /> Redownload</a>)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
      {showHistory && (<div onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-[140] animate-in fade-in duration-300" />)}
    </div>
  )
}
