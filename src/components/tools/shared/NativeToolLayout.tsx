import React from 'react'
import { ArrowLeft, MoreVertical } from 'lucide-react'
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
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-black transition-colors">
      {/* Ultra-Compact Native AppBar */}
      <header className="px-4 pt-safe pb-1 flex items-center justify-between sticky top-0 z-50 bg-[#FAFAFA]/95 dark:bg-black/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2 h-14">
          <button 
            onClick={onBack || (() => navigate(-1))}
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-900 transition-colors -ml-1"
          >
            <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
          </button>
          <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white ml-1">{title}</h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full active:bg-zinc-100 dark:active:bg-zinc-900 transition-colors">
          <MoreVertical size={20} className="text-zinc-400" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Web View Header (Only Visible on Desktop) */}
        <div className="hidden md:block mb-8">
           <ToolHeader title={title} description={description} />
        </div>

        {/* Content Wrapper */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Grounded Bottom Action Bar (Native Only) */}
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
