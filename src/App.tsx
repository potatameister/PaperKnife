import { useState, useEffect, lazy, Suspense } from 'react'
import { 
  Layers, Scissors, Zap, Smartphone, Monitor, Lock, Unlock, 
  RotateCw, Type, Hash, Tags, FileText, ArrowUpDown, PenTool, 
  Wrench, ImagePlus, FileImage
} from 'lucide-react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { Theme, ViewMode, Tool } from './types'
import Layout from './components/Layout'
import { PipelineProvider } from './utils/pipelineContext'
import { clearActivity, updateLastSeen, getLastSeen } from './utils/recentActivity'

// Lazy load views
const WebView = lazy(() => import('./components/WebView'))
const AndroidView = lazy(() => import('./components/AndroidView'))
const AndroidToolsView = lazy(() => import('./components/AndroidToolsView'))
const AndroidHistoryView = lazy(() => import('./components/AndroidHistoryView'))
const MergeTool = lazy(() => import('./components/tools/MergeTool'))
const SplitTool = lazy(() => import('./components/tools/SplitTool'))
const ProtectTool = lazy(() => import('./components/tools/ProtectTool'))
const CompressTool = lazy(() => import('./components/tools/CompressTool'))
const UnlockTool = lazy(() => import('./components/tools/UnlockTool'))
const PdfToImageTool = lazy(() => import('./components/tools/PdfToImageTool'))
const RotateTool = lazy(() => import('./components/tools/RotateTool'))
const PdfToTextTool = lazy(() => import('./components/tools/PdfToTextTool'))
const RearrangeTool = lazy(() => import('./components/tools/RearrangeTool'))
const WatermarkTool = lazy(() => import('./components/tools/WatermarkTool'))
const PageNumberTool = lazy(() => import('./components/tools/PageNumberTool'))
const MetadataTool = lazy(() => import('./components/tools/MetadataTool'))
const ImageToPdfTool = lazy(() => import('./components/tools/ImageToPdfTool'))
const SignatureTool = lazy(() => import('./components/tools/SignatureTool'))
const RepairTool = lazy(() => import('./components/tools/RepairTool'))
const About = lazy(() => import('./components/About'))
const Thanks = lazy(() => import('./components/Thanks'))
const SettingsView = lazy(() => import('./components/Settings'))

const tools: Tool[] = [
  { title: 'Merge PDF', desc: 'Combine multiple PDF files into one document.', icon: Layers, implemented: true, path: '/merge', category: 'Edit' },
  { title: 'Split PDF', desc: 'Visually extract specific pages or ranges.', icon: Scissors, implemented: true, path: '/split', category: 'Edit' },
  { title: 'Compress PDF', desc: 'Optimize your file size for easier sharing.', icon: Zap, implemented: true, path: '/compress', category: 'Optimize' },
  { title: 'Protect PDF', desc: 'Secure your documents with strong encryption.', icon: Lock, implemented: true, path: '/protect', category: 'Secure' },
  { title: 'Signature', desc: 'Add your electronic signature to any document.', icon: PenTool, implemented: true, path: '/signature', category: 'Edit' },
  { title: 'Unlock PDF', desc: 'Remove passwords from your protected files.', icon: Unlock, implemented: true, path: '/unlock', category: 'Secure' },
  { title: 'Image to PDF', desc: 'Convert JPG, PNG, and WebP into a professional PDF.', icon: ImagePlus, implemented: true, path: '/image-to-pdf', category: 'Convert' },
  { title: 'PDF to Image', desc: 'Convert document pages into high-quality images.', icon: FileImage, implemented: true, path: '/pdf-to-image', category: 'Convert' },
  { title: 'Rotate PDF', desc: 'Fix page orientation permanently.', icon: RotateCw, implemented: true, path: '/rotate-pdf', category: 'Edit' },
  { title: 'Watermark', desc: 'Overlay custom text for branding or security.', icon: Type, implemented: true, path: '/watermark', category: 'Edit' },
  { title: 'Page Numbers', desc: 'Add numbering to your documents automatically.', icon: Hash, implemented: true, path: '/page-numbers', category: 'Edit' },
  { title: 'Metadata', desc: 'Edit document properties for better privacy.', icon: Tags, implemented: true, path: '/metadata', category: 'Secure' },
  { title: 'Repair PDF', desc: 'Attempt to fix corrupted or unreadable documents.', icon: Wrench, implemented: true, path: '/repair', category: 'Optimize' },
  { title: 'PDF to Text', desc: 'Extract plain text from your PDF documents.', icon: FileText, implemented: true, path: '/pdf-to-text', category: 'Convert' },
  { title: 'Rearrange PDF', desc: 'Drag and drop pages to reorder them.', icon: ArrowUpDown, implemented: true, path: '/rearrange-pdf', category: 'Edit' },
]

function QuickDropModal({ file, onClear }: { file: File, onClear: () => void }) {
  const navigate = useNavigate()
  
  const actions = [
    { title: 'Compress', icon: Zap, path: '/compress', color: 'text-amber-500' },
    { title: 'Protect', icon: Lock, path: '/protect', color: 'text-blue-500' },
    { title: 'Split', icon: Scissors, path: '/split', color: 'text-rose-500' },
    { title: 'Metadata', icon: Tags, path: '/metadata', color: 'text-purple-500' },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-8 text-center border-b border-gray-100 dark:border-zinc-800">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-black truncate dark:text-white">{file.name}</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{(file.size / (1024*1024)).toFixed(2)} MB • Quick Actions</p>
        </div>
        
        <div className="grid grid-cols-2 p-4 gap-3 bg-gray-50/50 dark:bg-black/20">
          {actions.map(action => (
            <button
              key={action.title}
              onClick={() => {
                onClear()
                navigate(action.path)
                toast.success(`Opening ${action.title}...`)
              }}
              className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl hover:border-rose-500 transition-all group"
            >
              <action.icon className={`${action.color} group-hover:scale-110 transition-transform`} size={24} />
              <span className="text-xs font-black uppercase tracking-widest dark:text-zinc-300">{action.title}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={onClear}
          className="w-full py-6 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-rose-500 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return Capacitor.isNativePlatform() ? 'android' : 'web'
  })
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme) return savedTheme
    }
    return 'system'
  })

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Improved Auto-Wipe Logic
  useEffect(() => {
    const isAutoWipeEnabled = localStorage.getItem('autoWipe') === 'true'
    const timerMinutes = parseInt(localStorage.getItem('autoWipeTimer') || '15')
    const lastSeen = getLastSeen()
    const now = Date.now()

    if (isAutoWipeEnabled) {
      const elapsedMinutes = (now - lastSeen) / (1000 * 60)
      
      // If timer is 0 (Immediate) or elapsed time is greater than timer
      if (timerMinutes === 0 || (lastSeen > 0 && elapsedMinutes >= timerMinutes)) {
        clearActivity().then(() => {
          console.log(`Auto-Wipe triggered (${elapsedMinutes.toFixed(1)}m inactivity).`)
        })
      }
    }

    // Update last seen now and on interval
    updateLastSeen()
    const interval = setInterval(updateLastSeen, 30000) // Every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    
    const applyTheme = (t: Theme) => {
      let resolvedTheme = t
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      
      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }

    applyTheme(theme)
    localStorage.setItem('theme', theme)

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
  }, [theme])

  const LoadingSpinner = () => (
    <div className="h-full w-full flex items-center justify-center bg-[#FAFAFA] dark:bg-black min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const handleGlobalDrop = (files: FileList) => {
    const file = files[0]
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please drop a valid PDF file.')
      return
    }
    setDroppedFile(file)
  }

  // Detect if we are in a Capacitor environment
  const isCapacitor = Capacitor.isNativePlatform()

  return (
    <BrowserRouter basename={isCapacitor ? '/' : '/PaperKnife/'}>
      <PipelineProvider>
        <Layout theme={theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme} toggleTheme={toggleTheme} tools={tools} onFileDrop={handleGlobalDrop} viewMode={viewMode}>
          <Toaster position="bottom-center" expand={true} richColors />
          
          {droppedFile && <QuickDropModal file={droppedFile} onClear={() => setDroppedFile(null)} />}

          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={
                viewMode === 'web' ? (
                  <WebView tools={tools} />
                ) : (
                  <AndroidView toggleTheme={toggleTheme} theme={theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme} />
                )
              } />
              <Route path="/android-tools" element={<AndroidToolsView tools={tools} />} />
              <Route path="/android-history" element={<AndroidHistoryView />} />
              <Route path="/merge" element={<MergeTool />} />
              <Route path="/split" element={<SplitTool />} />
              <Route path="/protect" element={<ProtectTool />} />
              <Route path="/unlock" element={<UnlockTool />} />
              <Route path="/compress" element={<CompressTool />} />
              <Route path="/pdf-to-image" element={<PdfToImageTool />} />
              <Route path="/rotate-pdf" element={<RotateTool />} />
              <Route path="/pdf-to-text" element={<PdfToTextTool />} />
              <Route path="/rearrange-pdf" element={<RearrangeTool />} />
              <Route path="/watermark" element={<WatermarkTool />} />
              <Route path="/page-numbers" element={<PageNumberTool />} />
              <Route path="/metadata" element={<MetadataTool />} />
              <Route path="/image-to-pdf" element={<ImageToPdfTool />} />
              <Route path="/signature" element={<SignatureTool />} />
              <Route path="/repair" element={<RepairTool />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings" element={<SettingsView theme={theme} setTheme={setTheme} />} />
              <Route path="/thanks" element={<Thanks />} />
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
        </Layout>
      </PipelineProvider>
    </BrowserRouter>
  )
}

export default App