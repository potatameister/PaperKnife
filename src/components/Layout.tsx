import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  Shield, Download, 
  Moon, Sun, 
  History, Upload, ChevronRight, ChevronDown,
  Plus, Trash2, CheckCircle2, Home, Info, ArrowLeft, Layers
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = async () => {
    await clearActivity()
    setActivity([])
  }

  // Drag and Drop Logic
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
      
      {/* Global Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-rose-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl border-4 border-dashed border-rose-500 animate-in zoom-in duration-300">
            <Upload size={64} className="text-rose-500 animate-bounce" />
            <p className="mt-4 font-black uppercase tracking-widest text-rose-500 text-center text-sm">Drop PDF to start</p>
          </div>
        </div>
      )}

      {/* Unified Top Header */}
      <header className="flex items-center justify-between px-4 md:px-8 h-16 md:h-20 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-[100] transition-colors">
        <div className="flex items-center gap-2 md:gap-4">
          {!isHome && (
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors text-gray-500 hover:text-rose-500 mr-1"
              title="Back to Home"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PaperKnifeLogo size={28} />
            <span className="font-black tracking-tighter text-lg md:text-xl dark:text-white hidden sm:block">PaperKnife</span>
          </Link>
          
          <div className="h-6 w-[1px] bg-gray-200 dark:bg-zinc-800 mx-1 md:mx-2" />

          {/* Tool Dropdown Selector */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-black text-xs md:text-sm uppercase tracking-widest ${isDropdownOpen ? 'bg-rose-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900'}`}
            >
              {isHome ? 'All Tools' : activeTool?.title || 'Tool'}
              <ChevronDown size={16} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-3 w-64 md:w-80 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] shadow-2xl py-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 max-h-[80vh] overflow-y-auto scrollbar-hide">
                {Object.entries(
                  tools.filter(t => t.implemented).reduce((acc, tool) => {
                    if (!acc[tool.category]) acc[tool.category] = []
                    acc[tool.category].push(tool)
                    return acc
                  }, {} as Record<string, Tool[]>)
                ).map(([category, categoryTools]) => {
                  const colors = categoryColors[category as ToolCategory]
                  return (
                    <div key={category} className="mb-4">
                      <div className="px-6 py-2">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.text} opacity-60`}>{category}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 px-2">
                        {categoryTools.map((tool, i) => {
                          const Icon = tool.icon
                          const isActive = activeTool?.title === tool.title && !isHome
                          return (
                            <button
                              key={i}
                              onClick={() => { navigate(tool.path || '/'); setIsDropdownOpen(false); }}
                              className={`flex items-center gap-4 p-3 rounded-2xl transition-all text-left group ${isActive ? `${colors.bg} ${colors.text}` : `hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400`}`}
                            >
                              <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white dark:bg-zinc-800' : `${colors.iconBg} ${colors.text} opacity-70 group-hover:opacity-100`}`}>
                                <Icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase tracking-tight">{tool.title}</p>
                                <p className="text-[10px] opacity-60 truncate">{tool.desc}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                
                <div className="mt-2 pt-4 border-t border-gray-50 dark:border-zinc-800 px-4">
                  <button onClick={() => { navigate('/'); setIsDropdownOpen(false); }} className="w-full flex items-center justify-center gap-2 p-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors">
                    <Home size={14} /> Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <Link 
            to="/about"
            className={`p-2 md:px-4 md:py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${location.pathname.includes('about') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900'}`}
          >
            <Info size={18} />
            <span className="hidden md:block">About</span>
          </Link>
          
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-rose-500 transition-colors" title="Toggle Light/Dark">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            onClick={() => setShowHistory(true)} 
            className={`p-2 transition-colors relative ${showHistory ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
            title="View History"
          >
            <History size={20} />
            {activity.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-black" />}
          </button>

          <div className="hidden lg:flex items-center gap-2 ml-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-full border border-emerald-100 dark:border-emerald-900/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Secure Node</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 ${isNative ? 'pb-24 md:pb-0' : ''}`}>
        {children}
      </main>

      {/* Refined Material 3 Bottom Navigation */}
      {showMobileNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-[#F3EDF7] dark:bg-[#1C1B1F] border-t border-black/5 dark:border-white/5 flex items-center justify-around px-2 z-[100] pb-safe transition-all shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
          {/* Home Tab */}
          <button 
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 flex-1 relative group active:scale-90 transition-transform duration-200"
          >
            <div className={`px-5 py-1 rounded-full transition-all duration-300 ${isHome ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}>
              <Home size={22} strokeWidth={isHome ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-black tracking-tight ${isHome ? 'text-rose-600 dark:text-rose-400' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}>Home</span>
          </button>

          {/* Tools Tab */}
          <button 
            onClick={() => navigate('/android-tools')}
            className="flex flex-col items-center gap-1 flex-1 relative group active:scale-90 transition-transform duration-200"
          >
            <div className={`px-5 py-1 rounded-full transition-all duration-300 ${location.pathname === '/android-tools' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}>
              <Layers size={22} strokeWidth={location.pathname === '/android-tools' ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-black tracking-tight ${location.pathname === '/android-tools' ? 'text-rose-600 dark:text-rose-400' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}>Tools</span>
          </button>

          {/* Central Process Button (Enhanced FAB) */}
          <div className="flex-1 flex flex-col items-center -mt-10">
             <button 
               onClick={() => navigate('/android-tools')}
               className="w-14 h-14 bg-rose-500 text-white rounded-[1.25rem] shadow-lg shadow-rose-500/30 flex items-center justify-center active:scale-95 active:rotate-12 transition-all border-[6px] border-[#FDFDFD] dark:border-[#1C1B1F]"
             >
               <Plus size={32} strokeWidth={3} />
             </button>
             <span className="text-[10px] font-black tracking-tighter text-rose-500 mt-1.5 uppercase">Process</span>
          </div>
          
          {/* History Tab */}
          <button 
            onClick={() => navigate('/android-history')}
            className="flex flex-col items-center gap-1 flex-1 relative group active:scale-90 transition-transform duration-200"
          >
            <div className={`px-5 py-1 rounded-full transition-all duration-300 ${location.pathname === '/android-history' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}>
              <History size={22} strokeWidth={location.pathname === '/android-history' ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-black tracking-tight ${location.pathname === '/android-history' ? 'text-rose-600 dark:text-rose-400' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}>History</span>
          </button>

          {/* Privacy Tab */}
          <Link 
            to="/about"
            className="flex flex-col items-center gap-1 flex-1 relative group active:scale-90 transition-transform duration-200 no-underline"
          >
            <div className={`px-5 py-1 rounded-full transition-all duration-300 ${location.pathname.includes('about') ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}>
              <Shield size={22} strokeWidth={location.pathname.includes('about') ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-black tracking-tight ${location.pathname.includes('about') ? 'text-rose-600 dark:text-rose-400' : 'text-[#49454F] dark:text-[#CAC4D0]'}`}>Privacy</span>
          </Link>
        </nav>
      )}

      {/* Recent Activity Sidebar (Drawer) */}
      <aside className={`fixed top-0 right-0 h-screen w-full sm:w-80 bg-white dark:bg-zinc-950 border-l border-gray-100 dark:border-zinc-800 z-[150] shadow-2xl transition-transform duration-500 ease-out transform ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <History className="text-rose-500" size={24} />
              <h2 className="text-xl font-black tracking-tight dark:text-white">Activity</h2>
            </div>
            <div className="flex items-center gap-2">
              {activity.length > 0 && (
                <button onClick={handleClear} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500 rounded-xl transition-colors" title="Clear History">
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {activity.length === 0 ? (
              <div className="text-center py-20 opacity-40">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={24} className="rotate-45" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No recent files</p>
                <p className="text-[10px] mt-2 text-gray-400 px-8">Your processed files will appear here locally.</p>
              </div>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800 group relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{item.tool} • {(item.size / (1024*1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold">
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    {item.resultUrl && (
                      <a href={item.resultUrl} download={item.name} className="text-rose-500 hover:underline flex items-center gap-1">
                        <Download size={10} /> Re-download
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-gray-50 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-rose-500/50 tracking-widest">
              <Shield size={12} />
              100% On-Device History
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for Sidebar */}
      {showHistory && (
        <div 
          onClick={() => setShowHistory(false)}
          className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-[140] animate-in fade-in duration-300"
        />
      )}
    </div>
  )
}
