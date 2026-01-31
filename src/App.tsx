import { useState, useEffect, lazy, Suspense } from 'react'
import { FileText, Shield, Zap, Download, Smartphone, Monitor, Grid } from 'lucide-react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Theme, ViewMode, Tool } from './types'
import Layout from './components/Layout'

// Lazy load views for code splitting
const WebView = lazy(() => import('./components/WebView'))
const AndroidView = lazy(() => import('./components/AndroidView'))
const MergeTool = lazy(() => import('./components/tools/MergeTool'))
const SplitTool = lazy(() => import('./components/tools/SplitTool'))
const ProtectTool = lazy(() => import('./components/tools/ProtectTool'))
const CompressTool = lazy(() => import('./components/tools/CompressTool'))
const UnlockTool = lazy(() => import('./components/tools/UnlockTool'))
const About = lazy(() => import('./components/About'))

const tools: Tool[] = [
  { title: 'Merge PDF', desc: 'Combine multiple PDF files into a single document effortlessly.', icon: FileText, implemented: true },
  { title: 'Split PDF', desc: 'Extract specific pages or divide your PDF into separate files.', icon: Grid, implemented: true },
  { title: 'Compress PDF', desc: 'Optimize your file size for sharing without quality loss.', icon: Zap, implemented: true },
  { title: 'PDF to Image', desc: 'Convert document pages into high-quality JPG or PNG images.', icon: Download, implemented: false },
  { title: 'Protect PDF', desc: 'Secure your documents with strong password encryption.', icon: Shield, implemented: true },
  { title: 'Unlock PDF', desc: 'Remove passwords and restrictions from your PDF files.', icon: Shield, implemented: true },
  { title: 'Rotate PDF', desc: 'Rotate pages in your PDF document to the correct orientation.', icon: Smartphone, implemented: false },
  { title: 'PDF to Text', desc: 'Extract plain text from your PDF documents for easy editing.', icon: FileText, implemented: false },
  { title: 'Rearrange PDF', desc: 'Organize and reorder pages within a single PDF file.', icon: Grid, implemented: false },
]

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('web')
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme) return savedTheme
      
      // Default to system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    }
    return 'light'
  })

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const LoadingSpinner = () => (
    <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-black">
      <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const handleGlobalDrop = (files: FileList) => {
    const file = files[0]
    if (!file || file.type !== 'application/pdf') return
    console.log('Global drop:', file.name)
  }

  return (
    <BrowserRouter basename="/PaperKnife/">
      <Layout theme={theme} toggleTheme={toggleTheme} tools={tools} onFileDrop={handleGlobalDrop}>
        <div className={`${theme} w-full overflow-x-hidden min-h-screen transition-colors duration-300 ease-out`}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={
                viewMode === 'web' ? (
                  <WebView tools={tools} />
                ) : (
                  <AndroidView tools={tools} />
                )
              } />
              <Route path="/merge" element={<MergeTool />} />
              <Route path="/split" element={<SplitTool />} />
              <Route path="/protect" element={<ProtectTool />} />
              <Route path="/unlock" element={<UnlockTool />} />
              <Route path="/compress" element={<CompressTool />} />
              <Route path="/about" element={<About theme={theme} toggleTheme={toggleTheme} />} />
            </Routes>
          </Suspense>

          {/* Chameleon Toggle (Dev Only) */}
          {import.meta.env.DEV && (
            <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2">
              <button
                onClick={() => setViewMode(prev => prev === 'web' ? 'android' : 'web')}
                className="bg-gray-900 dark:bg-zinc-800 text-white p-4 rounded-3xl shadow-2xl hover:bg-rose-500 transition-all duration-300 flex items-center gap-3 border border-white/10 group active:scale-95"
                title="Toggle Chameleon Mode"
              >
                {viewMode === 'web' ? <Smartphone size={20} /> : <Monitor size={20} />}
                <span className="text-xs font-black uppercase tracking-tighter">{viewMode}</span>
              </button>
            </div>
          )}
        </div>
      </Layout>
    </BrowserRouter>
  )
}

export default App