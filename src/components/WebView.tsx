/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useMemo, useEffect } from 'react'
import { 
  Search, ChevronRight, Clock, Shield, Zap, Download, 
  Heart, Trash2, File as FileIcon, Github
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Tool, ToolCategory } from '../types'
import { getRecentActivity, clearActivity, ActivityEntry } from '../utils/recentActivity'
import { usePipeline } from '../utils/pipelineContext'
import { PaperKnifeLogo } from './Logo'

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const categoryColors: Record<ToolCategory, { bg: string, text: string, border: string, hover: string, glow: string }> = {
  Edit: { 
    bg: 'bg-rose-50 dark:bg-rose-900/20', 
    text: 'text-rose-500', 
    border: 'border-rose-100 dark:border-rose-900/30',
    hover: 'group-hover:bg-rose-500',
    glow: 'dark:hover:shadow-rose-900/20'
  },
  Secure: { 
    bg: 'bg-indigo-50 dark:bg-indigo-900/20', 
    text: 'text-indigo-500', 
    border: 'border-indigo-100 dark:border-indigo-900/30',
    hover: 'group-hover:bg-indigo-500',
    glow: 'dark:hover:shadow-indigo-900/20'
  },
  Convert: { 
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
    text: 'text-emerald-500', 
    border: 'border-emerald-100 dark:border-emerald-900/30',
    hover: 'group-hover:bg-emerald-500',
    glow: 'dark:hover:shadow-emerald-900/20'
  },
  Optimize: { 
    bg: 'bg-amber-50 dark:bg-amber-900/20', 
    text: 'text-amber-500', 
    border: 'border-amber-100 dark:border-amber-900/30',
    hover: 'group-hover:bg-amber-500',
    glow: 'dark:hover:shadow-amber-900/20'
  }
}

const ToolCard = ({ title, desc, icon: Icon, implemented = false, onClick, onFileDrop, category }: Tool & { onClick?: () => void, onFileDrop?: (file: File) => void }) => {
  const colors = categoryColors[category]
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (implemented) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (implemented && onFileDrop && e.dataTransfer.files?.[0]) {
      onFileDrop(e.dataTransfer.files[0])
    }
  }
  
  return (
    <div 
      onClick={implemented ? onClick : undefined}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        rounded-[2.5rem] border transition-all duration-500 group overflow-hidden flex flex-col p-8 relative h-full
        ${implemented 
          ? `cursor-pointer bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:shadow-xl ${colors.glow} hover:border-transparent hover:-translate-y-0.5` 
          : 'cursor-not-allowed opacity-60 saturate-0 bg-gray-50 dark:bg-zinc-950 border-transparent'}
        ${isDragging ? 'ring-4 ring-rose-500 ring-inset border-transparent scale-[0.98]' : ''}
      `}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-rose-500/10 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center pointer-events-none border-4 border-rose-500 rounded-[2.5rem] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-2xl animate-bounce mb-4">
            <Icon className="text-rose-500" size={32} />
          </div>
          <p className="text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-lg">Drop to start</p>
        </div>
      )}
      
      <div className={`
        ${colors.bg} ${colors.text} rounded-2xl flex items-center justify-center transition-all duration-500 mb-6 w-14 h-14
        ${implemented ? `${colors.hover} group-hover:text-white` : ''}
      `}>
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-gray-900 dark:text-white text-xl tracking-tight">{title}</h3>
          {implemented ? (
            <div className={`${colors.text} opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0`}>
              <ChevronRight size={18} />
            </div>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-gray-400">Soon</span>
          )}
        </div>
        <p className="text-gray-500 dark:text-zinc-400 leading-relaxed text-sm font-medium">{desc}</p>
      </div>
      
      {/* Subtle Category Badge */}
      <div className={`absolute top-8 right-8 text-[8px] font-black uppercase tracking-[0.2em] ${colors.text} opacity-10 group-hover:opacity-40 transition-opacity`}>
        {category}
      </div>
    </div>
  )
}

export default function WebView({ tools }: { tools: Tool[] }) {
  const navigate = useNavigate()
  const { setPipelineFile } = usePipeline()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All')
  const [history, setHistory] = useState<ActivityEntry[]>([])

  useEffect(() => {
    const limitSetting = localStorage.getItem('historyLimit')
    const limit = limitSetting === '999' ? 50 : parseInt(limitSetting || '5')
    getRecentActivity(limit).then(setHistory)
  }, [])

  const handleClearHistory = async () => {
    await clearActivity()
    setHistory([])
  }

  const categories: (ToolCategory | 'All')[] = ['All', 'Edit', 'Secure', 'Convert', 'Optimize']

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || tool.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [tools, searchQuery, activeCategory])

  // Handle Tool Click
  const handleToolClick = (tool: Tool) => {
    if (!tool.implemented) return;
    if (tool.path) {
      navigate(tool.path)
    }
  }

  // Handle direct file drop on a tool card
  const handleToolFileDrop = async (tool: Tool, file: File) => {
    if (!tool.implemented || !tool.path) return
    
    if (file.type !== 'application/pdf' && tool.path !== '/image-to-pdf') {
      toast.error('Only PDF files are supported for this tool.')
      return
    }

    if (tool.path === '/image-to-pdf' && !file.type.startsWith('image/')) {
        toast.error('Only images are supported for this tool.')
        return
    }

    toast.loading(`Loading ${file.name} into ${tool.title}...`, { duration: 1000 })
    
    // Set in pipeline
    const buffer = await file.arrayBuffer()
    setPipelineFile({
      buffer: new Uint8Array(buffer),
      name: file.name
    })

    navigate(tool.path)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 font-sans selection:bg-rose-100 dark:selection:bg-rose-900 selection:text-rose-600 transition-colors duration-300 ease-out">
      <main className="max-w-6xl mx-auto px-6 py-10 md:py-20">
        <div className="text-center mb-10 md:mb-20">
          <span className="inline-block px-4 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] md:text-xs font-bold rounded-full mb-6 border border-rose-100 dark:border-rose-900/30 uppercase tracking-widest">
            LOCAL PROCESSING • 100% PRIVATE
          </span>
          <h2 className="text-4xl md:text-7xl font-black mb-6 md:mb-8 tracking-tight text-gray-900 dark:text-white">
            Stop Uploading <br/>
            <span className="text-rose-500">Your Privacy.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
            The professional PDF utility that lives in your browser. <br className="hidden md:block"/>
            No uploads, no servers, just your data staying yours.
          </p>

          {/* Search & Tabs */}
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-rose-500 transition-colors">
                <Search size={20} />
              </div>
              <input 
                type="text"
                placeholder="Search tools (e.g. merge, compress, protect...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] py-5 pl-14 pr-6 shadow-xl shadow-gray-200/50 dark:shadow-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-bold text-lg"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none' : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800 hover:border-rose-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard 
                  key={tool.title} 
                  {...tool} 
                  onClick={() => handleToolClick(tool)}
                  onFileDrop={(file) => handleToolFileDrop(tool, file)}
                />
              ))}
              {filteredTools.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-xl font-bold text-gray-400">No tools found matching your search.</p>
                  <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-4 text-rose-500 font-black uppercase tracking-widest text-xs hover:underline">Clear Filters</button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 p-8 shadow-sm h-fit">
              <div className="flex justify-between items-center mb-6">
                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Clock size={14} /> Recent Files
                </h4>
                {history.length > 0 && (
                  <button onClick={handleClearHistory} className="text-gray-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-relaxed">No recent activity.<br/>Processed files appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="group relative">
                      <div className="flex items-start gap-3 p-3 rounded-2xl border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all">
                        <div className="w-10 h-10 bg-gray-50 dark:bg-black rounded-xl flex items-center justify-center text-gray-400 group-hover:text-rose-500 transition-colors shrink-0">
                          <FileIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate dark:text-zinc-200">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 rounded">{item.tool}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{formatSize(item.size)}</span>
                          </div>
                        </div>
                        {item.resultUrl && (
                          <a 
                            href={item.resultUrl} 
                            download={item.name}
                            className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                            title="Download again"
                          >
                            <Download size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-[8px] text-center text-gray-400 uppercase font-black tracking-widest pt-4 border-t border-gray-100 dark:border-zinc-800">
                    Auto-deleted after 10 files
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-900/10 rounded-[2.5rem] p-8 border border-rose-100 dark:border-rose-900/30 shadow-sm shadow-rose-200/20 dark:shadow-none">
              <Heart className="mb-4 text-rose-500" fill="currentColor" size={24} />
              <h4 className="font-black text-lg mb-2 text-gray-900 dark:text-white">PaperKnife Supporter</h4>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 leading-relaxed mb-6">Support privacy-first tools. Your help keeps the engine independent and ad-free.</p>
              <a href="https://github.com/sponsors/potatameister" target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-rose-500 text-white rounded-2xl text-center text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-rose-500/20">
                Sponsor Now
              </a>
            </div>
          </aside>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-100 dark:border-zinc-800 pt-20">
          {[
            { icon: Shield, title: 'Zero Cloud', desc: "Your files never leave your memory. We don't have a server, and we don't want your data." },
            { icon: Zap, title: 'Instant Speed', desc: "By processing locally, there's no upload or download delay. Large files are handled in seconds." },
            { icon: Download, title: 'Install Anywhere', desc: "Use it as a web app or download the APK for a full native experience on your Android device." }
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-50 dark:border-zinc-800 shadow-sm">
              <div className="text-rose-500 mb-6"><feature.icon size={32} strokeWidth={2.5} /></div>
              <h4 className="font-bold text-lg mb-3 dark:text-white">{feature.title}</h4>
              <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-100 dark:border-zinc-900 mt-32 bg-white dark:bg-black transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-6">
                <PaperKnifeLogo size={24} />
                <span className="font-black tracking-tighter text-xl">PaperKnife</span>
              </div>
              <p className="text-gray-500 dark:text-zinc-400 text-sm max-w-sm leading-relaxed mb-8">
                Absolute privacy for your documents. We process everything in your browser memory. No servers, no tracking, just precision tools.
              </p>
              <div className="flex gap-4">
                <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 dark:bg-zinc-900 rounded-2xl hover:bg-rose-500 hover:text-white transition-all text-gray-600 dark:text-zinc-400">
                  <Github size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-6">Resources</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-600 dark:text-zinc-400">
                <li><Link to="/" className="hover:text-rose-500 transition">All Tools</Link></li>
                <li><Link to="/about" className="hover:text-rose-500 transition">Privacy Protocol</Link></li>
                <li><Link to="/thanks" className="hover:text-rose-500 transition">Special Thanks</Link></li>
                <li><a href="#" className="hover:text-rose-500 transition">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-6">Support</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-600 dark:text-zinc-400">
                <li><a href="https://github.com/sponsors/potatameister" className="flex items-center gap-2 hover:text-rose-500 transition"><Heart size={14} className="text-rose-500" /> Sponsor Project</a></li>
                <li><a href="#" className="flex items-center gap-2 hover:text-rose-500 transition">Report an Issue</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
              <p>© 2026 PaperKnife.</p>
              <p className="hidden md:block">•</p>
              <p>Built with ❤️ by <a href="https://github.com/potatameister" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">potatameister</a></p>
            </div>
            
            {/* Offline Indicator */}
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-full border border-emerald-100 dark:border-emerald-900/20">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] text-emerald-600 dark:text-emerald-400">100% Offline • Privacy Node</span>
            </div>

            <div className="flex gap-8">
              <a href="#" className="hover:text-rose-500 transition">Terms</a>
              <a href="#" className="hover:text-rose-500 transition">License</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}