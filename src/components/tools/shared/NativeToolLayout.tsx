import React from 'react'
import { ArrowLeft, MoreVertical, Share2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ToolHeader from './ToolHeader'

interface NativeToolLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  actions?: React.ReactNode
  onBack?: () => void
}

export const NativeToolLayout = ({ 
  title, 
  description, 
  children, 
  actions,
  onBack 
}: NativeToolLayoutProps) => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-black transition-colors">
      {/* M3 Style Compact TopAppBar */}
      <header className="px-4 pt-safe pb-2 flex items-center justify-between sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 md:hidden">
        <div className="flex items-center gap-4 py-2">
          <button 
            onClick={onBack || (() => navigate(-1))}
            className="p-2 rounded-full active:bg-gray-100 dark:active:bg-zinc-900 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
          </button>
          <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white leading-none">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full active:bg-gray-100 dark:active:bg-zinc-900 transition-colors">
            <Share2 size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-full active:bg-gray-100 dark:active:bg-zinc-900 transition-colors">
            <MoreVertical size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Web View Header */}
        <div className="hidden md:block mb-8">
           <ToolHeader title={title} description={description} />
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 pb-32">
          {children}
        </div>
      </main>

      {/* Persistent Bottom Action Bar (Native Only) */}
      {actions && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 z-[100] pb-[calc(env(safe-area-inset-bottom)+1rem)]">
           <div className="max-w-md mx-auto">
             {actions}
           </div>
        </div>
      )}
    </div>
  )
}