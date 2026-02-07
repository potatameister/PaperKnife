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
    <div className="flex flex-col min-h-screen bg-[#FDFDFD] dark:bg-[#1C1B1F]">
      {/* Native-style AppBar */}
      <header className="px-4 pt-safe pb-2 flex items-center justify-between sticky top-0 z-50 bg-white/80 dark:bg-[#1C1B1F]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 md:hidden">
        <div className="flex items-center gap-4 py-2">
          <button 
            onClick={onBack || (() => navigate(-1))}
            className="p-2 rounded-full active:bg-gray-100 dark:active:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} className="dark:text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-tight dark:text-white">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full active:bg-gray-100 dark:active:bg-white/10 transition-colors">
            <Share2 size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-full active:bg-gray-100 dark:active:bg-white/10 transition-colors">
            <MoreVertical size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Web Header (Hidden on Mobile/Native) */}
        <div className="hidden md:block mb-8">
           <ToolHeader title={title} description={description} />
        </div>

        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Native-style bottom action bar if provided */}
      {actions && (
        <div className="md:hidden sticky bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#1C1B1F]/80 backdrop-blur-md border-t border-gray-100 dark:border-white/5 pb-safe">
           {actions}
        </div>
      )}
    </div>
  )
}
