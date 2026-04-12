import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Theme, Tool, ViewMode } from './types'
import Layout from './components/Layout'
import WebView from './components/WebView'
import AndroidView from './components/AndroidView'
import AndroidToolsView from './components/AndroidToolsView'
import AndroidHistoryView from './components/AndroidHistoryView'
import Settings from './components/Settings'
import About from './components/About'
import Sponsor from './components/Sponsor'
import HallOfFame from './components/HallOfFame'
import PrivacyPolicy from './components/PrivacyPolicy'
import Libraries from './components/Libraries'
import Thanks from './components/Thanks'
import { PipelineProvider } from './utils/pipelineContext'
import { ViewModeProvider } from './utils/viewModeContext'
import { setSystemUI } from './utils/systemUI'
import { Toaster } from 'sonner'

// Tools
import CompressTool from './components/tools/CompressTool'
import ExtractImagesTool from './components/tools/ExtractImagesTool'
import GrayscaleTool from './components/tools/GrayscaleTool'
import ImageToPdfTool from './components/tools/ImageToPdfTool'
import MergeTool from './components/tools/MergeTool'
import MetadataTool from './components/tools/MetadataTool'
import PageNumberTool from './components/tools/PageNumberTool'
import PdfToImageTool from './components/tools/PdfToImageTool'
import PdfToTextTool from './components/tools/PdfToTextTool'
import ProtectTool from './components/tools/ProtectTool'
import RearrangeTool from './components/tools/RearrangeTool'
import RepairTool from './components/tools/RepairTool'
import RotateTool from './components/tools/RotateTool'
import SignatureTool from './components/tools/SignatureTool'
import SplitTool from './components/tools/SplitTool'
import UnlockTool from './components/tools/UnlockTool'
import WatermarkTool from './components/tools/WatermarkTool'
import { FileDown, FileUp, FileText, Image, FileSignature, Split, Settings2, Hash, Layers, Droplet, Wrench, RefreshCw, EyeOff, Lock, Unlock as UnlockIcon } from 'lucide-react'

const tools: Tool[] = [
  { title: 'Merge PDF', desc: 'Combine multiple PDFs into one', icon: Layers, path: '/merge', category: 'Edit', implemented: true },
  { title: 'Split PDF', desc: 'Extract pages from your PDF', icon: Split, path: '/split', category: 'Edit', implemented: true },
  { title: 'Compress PDF', desc: 'Reduce file size while maintaining quality', icon: FileDown, path: '/compress', category: 'Optimize', implemented: true },
  { title: 'Protect PDF', desc: 'Add a password to your PDF', icon: Lock, path: '/protect', category: 'Security', implemented: true },
  { title: 'Unlock PDF', desc: 'Remove PDF password permanently', icon: UnlockIcon, path: '/unlock', category: 'Security', implemented: true },
  { title: 'PDF to Image', desc: 'Convert PDF pages to JPG/PNG', icon: Image, path: '/pdf-to-image', category: 'Convert', implemented: true },
  { title: 'Image to PDF', desc: 'Convert images to PDF document', icon: FileUp, path: '/image-to-pdf', category: 'Convert', implemented: true },
  { title: 'Add Watermark', desc: 'Stamp text or image on PDF', icon: Droplet, path: '/watermark', category: 'Edit', implemented: true },
  { title: 'Page Numbers', desc: 'Add page numbers to document', icon: Hash, path: '/page-numbers', category: 'Edit', implemented: true },
  { title: 'Extract Images', desc: 'Get all images from PDF', icon: Image, path: '/extract-images', category: 'Convert', implemented: true },
  { title: 'Grayscale PDF', desc: 'Convert PDF to black & white', icon: EyeOff, path: '/grayscale', category: 'Optimize', implemented: true },
  { title: 'PDF to Text', desc: 'Extract text from PDF', icon: FileText, path: '/pdf-to-text', category: 'Convert', implemented: true },
  { title: 'Rearrange Pages', desc: 'Reorder or delete pages', icon: RefreshCw, path: '/rearrange', category: 'Edit', implemented: true },
  { title: 'Repair PDF', desc: 'Fix corrupted PDF files', icon: Wrench, path: '/repair', category: 'Optimize', implemented: true },
  { title: 'Rotate PDF', desc: 'Rotate pages in document', icon: RefreshCw, path: '/rotate', category: 'Edit', implemented: true },
  { title: 'Sign PDF', desc: 'Add signature to document', icon: FileSignature, path: '/sign', category: 'Edit', implemented: true },
  { title: 'Edit Metadata', desc: 'Change author, title, etc.', icon: Settings2, path: '/metadata', category: 'Edit', implemented: true },
]

export default function App() {
  const [theme, setTheme] = useState<Theme>('system')
  const [viewMode, setViewMode] = useState<ViewMode>(Capacitor.isNativePlatform() ? 'android' : 'web')

  useEffect(() => {
    const updateTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', isDark)
      setSystemUI(isDark ? 'dark' : 'light')
    }
    
    updateTheme()
    
    // Listen for system theme changes when in 'system' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => theme === 'system' && updateTheme()
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light')
  }

  return (
    <PipelineProvider>
      <ViewModeProvider viewMode={viewMode} setViewMode={setViewMode}>
        <BrowserRouter>
          <Toaster position="bottom-center" />
          <Layout theme={theme} toggleTheme={toggleTheme} tools={tools} viewMode={viewMode}>
            <Routes>
              <Route path="/" element={viewMode === 'android' ? <AndroidView theme={theme} toggleTheme={toggleTheme} onFileSelect={() => {}} /> : <WebView tools={tools} />} />
              <Route path="/android-tools" element={<AndroidToolsView tools={tools} />} />
              <Route path="/android-history" element={<AndroidHistoryView />} />
              <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} />} />
              <Route path="/about" element={<About />} />
              <Route path="/sponsor" element={<Sponsor />} />
              <Route path="/hall-of-fame" element={<HallOfFame />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/libraries" element={<Libraries />} />
              <Route path="/thanks" element={<Thanks />} />
              
              <Route path="/compress" element={<CompressTool />} />
              <Route path="/extract-images" element={<ExtractImagesTool />} />
              <Route path="/grayscale" element={<GrayscaleTool />} />
              <Route path="/image-to-pdf" element={<ImageToPdfTool />} />
              <Route path="/merge" element={<MergeTool />} />
              <Route path="/metadata" element={<MetadataTool />} />
              <Route path="/page-numbers" element={<PageNumberTool />} />
              <Route path="/pdf-to-image" element={<PdfToImageTool />} />
              <Route path="/pdf-to-text" element={<PdfToTextTool />} />
              <Route path="/protect" element={<ProtectTool />} />
              <Route path="/rearrange" element={<RearrangeTool />} />
              <Route path="/repair" element={<RepairTool />} />
              <Route path="/rotate" element={<RotateTool />} />
              <Route path="/sign" element={<SignatureTool />} />
              <Route path="/split" element={<SplitTool />} />
              <Route path="/unlock" element={<UnlockTool />} />
              <Route path="/watermark" element={<WatermarkTool />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ViewModeProvider>
    </PipelineProvider>
  )
}
