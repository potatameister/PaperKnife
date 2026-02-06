import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Capacitor } from '@capacitor/core'

interface ToolHeaderProps {
  title: string
  highlight?: string
  description: string
}

export default function ToolHeader({ title, highlight, description }: ToolHeaderProps) {
  const navigate = useNavigate()
  const isNative = Capacitor.isNativePlatform()

  return (
    <div className="relative text-center mb-8 md:mb-12">
      {isNative && (
        <button 
          onClick={() => navigate('/')}
          className="absolute left-0 top-0 p-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl text-gray-500 hover:text-rose-500 transition-colors md:hidden"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 dark:text-white px-10">
        {title} <span className="text-rose-500">{highlight}.</span>
      </h2>
      <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  )
}
