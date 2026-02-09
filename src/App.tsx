import { useState, useEffect, lazy, Suspense } from 'react'
import { 
  Layers, Scissors, Zap, Smartphone, Monitor, Lock, Unlock, 
  RotateCw, Type, Hash, Tags, FileText, ArrowUpDown, PenTool, 
  Wrench, ImagePlus, FileImage, Palette, X, ChevronDown
} from 'lucide-react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { Filesystem } from '@capacitor/filesystem'
import { Theme, ViewMode, Tool } from './types'
import Layout from './components/Layout'
import { PipelineProvider, usePipeline } from './utils/pipelineContext'
import { clearActivity, updateLastSeen, getLastSeen } from './utils/recentActivity'
import ScrollToTop from './components/ScrollToTop'

// Main views - No lazy loading for critical navigation to prevent import errors on Android
import WebView from './components/WebView'
import AndroidView from './components/AndroidView'
import AndroidToolsView from './components/AndroidToolsView'
import AndroidHistoryView from './components/AndroidHistoryView'

// Lazy load tools
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
const ExtractImagesTool = lazy(() => import('./components/tools/ExtractImagesTool'))
const GrayscaleTool = lazy(() => import('./components/tools/GrayscaleTool'))
const About = lazy(() => import('./components/About'))
const Thanks = lazy(() => import('./components/Thanks'))
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'))
const SettingsView = lazy(() => import('./components/Settings'))

const tools: Tool[] = [
  { title: 'Merge PDF', desc: 'Combine multiple PDF files into one document.', icon: Layers, implemented: true, path: '/merge', category: 'Edit' },
  { title: 'Split PDF', desc: 'Visually extract specific pages or ranges.', icon: Scissors, implemented: true, path: '/split', category: 'Edit' },
  { title: 'Compress PDF', desc: 'Optimize your file size for easier sharing.', icon: Zap, implemented: true, path: '/compress', category: 'Optimize' },
  { title: 'Protect PDF', desc: 'Secure your documents with strong encryption.', icon: Lock, implemented: true, path: '/protect', category: 'Secure' },
  { title: 'Unlock PDF', desc: 'Remove passwords from your protected files.', icon: Unlock, implemented: true, path: '/unlock', category: 'Secure' },
  { title: 'Rotate PDF', desc: 'Fix page orientation permanently.', icon: RotateCw, implemented: true, path: '/rotate-pdf', category: 'Edit' },
  { title: 'Rearrange PDF', desc: 'Drag and drop pages to reorder them.', icon: ArrowUpDown, implemented: true, path: '/rearrange-pdf', category: 'Edit' },
  { title: 'Page Numbers', desc: 'Add numbering to your documents automatically.', icon: Hash, implemented: true, path: '/page-numbers', category: 'Edit' },
  { title: 'Watermark', desc: 'Overlay custom text for branding or security.', icon: Type, implemented: true, path: '/watermark', category: 'Edit' },
  { title: 'Metadata', desc: 'Edit document properties for better privacy.', icon: Tags, implemented: true, path: '/metadata', category: 'Secure' },
  { title: 'Signature', desc: 'Add your electronic signature to any document.', icon: PenTool, implemented: true, path: '/signature', category: 'Edit' },
  { title: 'Grayscale', desc: 'Convert all document pages to black and white.', icon: Palette, implemented: true, path: '/grayscale', category: 'Optimize' },
  { title: 'PDF to Image', desc: 'Convert document pages into high-quality images.', icon: FileImage, implemented: true, path: '/pdf-to-image', category: 'Convert' },
  { title: 'Image to PDF', desc: 'Convert JPG, PNG, and WebP into a professional PDF.', icon: ImagePlus, implemented: true, path: '/image-to-pdf', category: 'Convert' },
  { title: 'Extract Images', desc: 'Pull out all original images embedded in a PDF.', icon: FileImage, implemented: true, path: '/extract-images', category: 'Convert' },
  { title: 'PDF to Text', desc: 'Extract plain text from your PDF documents.', icon: FileText, implemented: true, path: '/pdf-to-text', category: 'Convert' },
  { title: 'Repair PDF', desc: 'Attempt to fix corrupted or unreadable documents.', icon: Wrench, implemented: true, path: '/repair', category: 'Optimize' },
]

function QuickDropModal({ file, onClear }: { file: File, onClear: () => void }) {
  const navigate = useNavigate()
  const { setPipelineFile } = usePipeline()
  const [showMore, setShowMore] = useState(false)
  
  const essentials = [
    { title: 'Merge', icon: Layers, path: '/merge', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { title: 'Compress', icon: Zap, path: '/compress', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Split', icon: Scissors, path: '/split', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Protect', icon: Lock, path: '/protect', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ]

  const otherTools = tools.filter(t => !essentials.some(e => e.path === t.path))

  const handleAction = async (path: string, title: string) => {
    toast.loading(`Importing ${file.name}...`, { id: 'quick-load' })
    
    try {
      const buffer = await file.arrayBuffer()
      setPipelineFile({
        buffer: new Uint8Array(buffer),
        name: file.name,
        type: file.type || (file.name.endsWith('.zip') ? 'application/zip' : 'application/pdf')
      })

      onClear()
      navigate(path)
      toast.success(`Opened in ${title}`, { id: 'quick-load' })
    } catch (err) {
      toast.error('Failed to process file', { id: 'quick-load' })
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#FAFAFA] dark:bg-zinc-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-t border-x border-white/10 sm:border animate-in slide-in-from-bottom-full duration-500 ease-out">
        
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                   <FileText size={20} />
                </div>
                <div className="min-w-0">
                   <h3 className="text-lg font-black dark:text-white truncate max-w-[200px] leading-none mb-1">{file.name}</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{(file.size / (1024*1024)).toFixed(2)} MB • PDF Document</p>
                </div>
             </div>
             <button onClick={onClear} className="p-2 bg-gray-100 dark:bg-zinc-900 rounded-full text-gray-400 hover:text-rose-500 transition-colors"><X size={18}/></button>
          </div>
        </div>
        
        <div className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
           <div>
              <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-1">Essentials</h4>
              <div className="grid grid-cols-2 gap-2.5">
                 {essentials.map(tool => (
                   <button
                     key={tool.title}
                     onClick={() => handleAction(tool.path, tool.title)}
                     className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-800 active:scale-95 transition-all shadow-sm group"
                   >
                     <div className={`p-2 rounded-xl ${tool.bg} ${tool.color} group-active:scale-110 transition-transform`}>
                       <tool.icon size={18} strokeWidth={2.5} />
                     </div>
                     <span className="text-xs font-bold text-gray-900 dark:text-zinc-200">{tool.title}</span>
                   </button>
                 ))}
              </div>
           </div>

           <div>
              <button 
                onClick={() => setShowMore(!showMore)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-rose-500 transition-colors"
              >
                <span>All Tools</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`} />
              </button>
              
              {showMore && (
                <div className="grid grid-cols-2 gap-2.5 mt-3 animate-in slide-in-from-top-2 duration-300">
                   {otherTools.map(tool => (
                     <button
                       key={tool.title}
                       onClick={() => tool.path && handleAction(tool.path, tool.title)}
                       className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-800 active:scale-95 transition-all shadow-sm group"
                     >
                       <div className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 group-active:scale-110 transition-transform">
                         <tool.icon size={18} strokeWidth={2.5} />
                       </div>
                       <span className="text-xs font-bold text-gray-900 dark:text-zinc-200">{tool.title}</span>
                     </button>
                   ))}
                </div>
              )}
           </div>
        </div>
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
      if (timerMinutes === 0 || (lastSeen > 0 && elapsedMinutes >= timerMinutes)) {
        clearActivity().then(() => {
          console.log(`Auto-Wipe triggered (${elapsedMinutes.toFixed(1)}m inactivity).`)
        })
      }
    }

    updateLastSeen()
    const interval = setInterval(updateLastSeen, 30000)
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

  // Handle Intent Files (Android "Open With" / "Share to")
  useEffect(() => {
    const handleIntentFile = async (uri: string) => {
      try {
        toast.loading('Importing file...', { id: 'intent-load' })
        const fileContent = await Filesystem.readFile({ path: uri })
        const blob = await (await fetch(`data:application/pdf;base64,${fileContent.data}`)).blob()
        const fileName = uri.split('/').pop() || 'imported-file.pdf'
        const file = new File([blob], fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`, { type: 'application/pdf' })
        setDroppedFile(file)
        toast.success('File imported successfully!', { id: 'intent-load' })
      } catch (error) {
        console.error('Intent load error:', error)
        toast.error('Failed to import file.', { id: 'intent-load' })
      }
    }

    const onFileIntent = (e: any) => {
      if (e.detail?.uri) {
        handleIntentFile(e.detail.uri)
      }
    }

    window.addEventListener('fileIntent', onFileIntent)
    return () => window.removeEventListener('fileIntent', onFileIntent)
  }, [])

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

  const isCapacitor = Capacitor.isNativePlatform()

  return (
    <BrowserRouter basename={isCapacitor ? '/' : '/PaperKnife/'}>
      <ScrollToTop />
      <PipelineProvider>
        <Layout theme={theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme} toggleTheme={toggleTheme} tools={tools} onFileDrop={handleGlobalDrop} viewMode={viewMode}>
          <Toaster 
            position="bottom-center" 
            expand={true} 
            richColors 
            duration={2000}
            toastOptions={{
              className: 'dark:bg-zinc-900 dark:text-white dark:border-white/10'
            }}
          />
          
          {droppedFile && <QuickDropModal file={droppedFile} onClear={() => setDroppedFile(null)} />}

          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={
                viewMode === 'web' ? (
                  <WebView tools={tools} />
                ) : (
                  <AndroidView toggleTheme={toggleTheme} theme={theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme} onFileSelect={(file) => handleGlobalDrop([file] as any)} />
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
              <Route path="/extract-images" element={<ExtractImagesTool />} />
              <Route path="/grayscale" element={<GrayscaleTool />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
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