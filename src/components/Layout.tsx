import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  Shield, Download, 
  Moon, Sun, 
  History, Upload, ChevronRight,
  Plus, Trash2, CheckCircle2, Home
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
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    if (showHistory) {
      getRecentActivity().then(setActivity)
    }
  }, [showHistory])

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
    <div className={`min-h-screen flex bg-[#FAFAFA] dark:bg-black transition-colors duration-300`}>
      
      {/* Global Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-rose-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl border-4 border-dashed border-rose-500 animate-in zoom-in duration-300">
            <Upload size={64} className="text-rose-500 animate-bounce" />
            <p className="mt-4 font-black uppercase tracking-widest text-rose-500 text-center text-sm">Drop PDF to start</p>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Navigation Rail) */}
      <aside className="hidden md:flex flex-col w-20 border-r border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 h-screen z-50 transition-colors shadow-sm">
        <div className="p-4 flex flex-col items-center gap-8 py-8">
          <Link to="/" title="Home" className={`p-3 rounded-2xl transition-all ${isHome ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}>
            <Home size={20} />
          </Link>
          
          <nav className="flex flex-col gap-4">
            {tools.filter(t => t.implemented).map((tool, i) => {
              const Icon = tool.icon
              const isActive = activeTool?.title === tool.title && !isHome
              const path = `/${tool.title.split(' ')[0].toLowerCase()}`
              
              return (
                <button
                  key={i}
                  onClick={() => navigate(path)}
                  className={`p-3 rounded-2xl transition-all group relative ${isActive ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                  title={tool.title}
                >
                  <Icon size={20} />
                  <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100]">
                    {tool.title}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-4 flex flex-col items-center gap-4 pb-8">
          <button onClick={toggleTheme} className="p-3 rounded-2xl text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 rounded-2xl transition-all ${showHistory ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
            title="Recent Activity"
          >
            <History size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div class={`flex-1 flex flex-col min-w-0 ${isNative ? 'pb-24 md:pb-0' : ''}`}>
        {/* Universal Top Header (Visible when not on Home) */}
// ...
        {children}

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
      </div>

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