import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  Shield, Download, 
  Moon, Sun, 
  History, Upload, ChevronRight, ChevronDown,
  Plus, Trash2, CheckCircle2, Home, Info, ArrowLeft
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Theme, Tool } from '../types'
import { PaperKnifeLogo } from './Logo'
import { ActivityEntry, getRecentActivity, clearActivity } from '../utils/recentActivity'

interface LayoutProps {
  children: React.ReactNode
  theme: Theme
  toggleTheme: () => void
  tools: Tool[]
  onFileDrop?: (files: FileList) => void
}

export default function Layout({ children, theme, toggleTheme, tools, onFileDrop }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isDragging, setIsDragging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isNative = Capacitor.isNativePlatform()

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
    <div className={`min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-black transition-colors duration-300`}>
      
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
              <div className="absolute top-full left-0 mt-3 w-64 md:w-80 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] shadow-2xl py-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="px-6 py-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Switch Tool</span>
                </div>
                <div className="grid grid-cols-1 gap-1 px-2">
                  {tools.filter(t => t.implemented).map((tool, i) => {
                    const Icon = tool.icon
                    const isActive = activeTool?.title === tool.title && !isHome
                    const path = `/${tool.title.split(' ')[0].toLowerCase()}`
                    return (
                      <button
                        key={i}
                        onClick={() => { navigate(path); setIsDropdownOpen(false); }}
                        className={`flex items-center gap-4 p-3 rounded-2xl transition-all text-left group ${isActive ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400'}`}
                      >
                        <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 group-hover:text-rose-500'}`}>
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
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800 px-4">
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
          
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
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
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 ${isNative ? 'pb-24 md:pb-0' : ''}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation (APK ONLY) */}
      {isNative && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800 flex items-center justify-around px-4 z-50 pb-safe">
          <button 
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 ${isHome ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <Home size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>
          
          <button 
            onClick={() => setShowHistory(true)}
            className={`flex flex-col items-center gap-1 ${showHistory ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <History size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>

          <Link 
            to="/about"
            className={`flex flex-col items-center gap-1 ${location.pathname.includes('about') ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <Shield size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Privacy</span>
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

          <div className="mt-auto pt-6 border-t border-gray-50 dark:border-zinc-900">
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
