import { useState, useRef } from 'react'
import { Download, Loader2, CheckCircle2, Info, Lock, Eye, Edit3, Trash2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'

type MetadataPdfData = {
  file: File
  pageCount: number
  isLocked: boolean
  password?: string
  currentMeta: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
  }
}

export default function MetadataTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pdfData, setPdfData] = useState<MetadataPdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-metadata')
  const [unlockPassword, setUnlockPassword] = useState('')
  
  // New Metadata State
  const [meta, setMeta] = useState({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: 'PaperKnife',
    producer: 'PaperKnife'
  })

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: unlockPassword } as any)
      
      const currentMeta = {
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords() || '',
        creator: pdfDoc.getCreator() || '',
        producer: pdfDoc.getProducer() || ''
      }

      setPdfData({
        ...pdfData,
        isLocked: false,
        pageCount: result.pageCount,
        password: unlockPassword,
        currentMeta
      })
      setMeta(currentMeta)
    } else {
      alert('Incorrect password')
    }
    setIsProcessing(false)
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return
    setIsProcessing(true)
    try {
      const metaRes = await getPdfMetaData(file)
      
      let currentMeta = { title: '', author: '', subject: '', keywords: '', creator: '', producer: '' }
      
      if (!metaRes.isLocked) {
        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        currentMeta = {
          title: pdfDoc.getTitle() || '',
          author: pdfDoc.getAuthor() || '',
          subject: pdfDoc.getSubject() || '',
          keywords: pdfDoc.getKeywords() || '',
          creator: pdfDoc.getCreator() || '',
          producer: pdfDoc.getProducer() || ''
        }
      }

      setPdfData({
        file,
        pageCount: metaRes.pageCount,
        isLocked: metaRes.isLocked,
        currentMeta
      })
      setMeta(currentMeta)
      setCustomFileName(`${file.name.replace('.pdf', '')}-metadata`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
      setDownloadUrl(null)
    }
  }

  const saveMetadata = async () => {
    if (!pdfData) return
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        password: pdfData.password || undefined,
        ignoreEncryption: true
      } as any)

      pdfDoc.setTitle(meta.title)
      pdfDoc.setAuthor(meta.author)
      pdfDoc.setSubject(meta.subject)
      pdfDoc.setKeywords(meta.keywords.split(',').map(k => k.trim()))
      pdfDoc.setCreator(meta.creator)
      pdfDoc.setProducer(meta.producer)

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)

      addActivity({
        name: `${customFileName}.pdf`,
        tool: 'Metadata',
        size: blob.size,
        resultUrl: url
      })
    } catch (error: any) {
      alert(`Error saving metadata: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const clearMetadata = () => {
    setMeta({
      title: '',
      author: '',
      subject: '',
      keywords: '',
      creator: '',
      producer: ''
    })
  }

  return (
    <div className="flex-1">
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-10">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 dark:text-white">Metadata <span className="text-rose-500">Editor.</span></h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400">Edit or wipe document properties for better privacy. <br className="hidden md:block"/>Processed entirely on your device.</p>
        </div>

        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

        {!pdfData ? (
          <div onClick={() => !isProcessing && fileInputRef.current?.click()} className={`border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 p-10 md:p-20 text-center hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}>
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 size={48} className="text-rose-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold mb-2">Reading PDF...</h3>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 md:w-24 md:h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <Edit3 size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Select PDF</h3>
                <p className="text-xs md:text-sm text-gray-400 dark:text-zinc-500">Tap to start editing</p>
              </>
            )}
          </div>
        ) : pdfData.isLocked ? (
          <div className="max-w-md mx-auto animate-in fade-in duration-500">
             <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">File is Protected</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">Unlock this file to read and edit metadata.</p>
              
              <div className="space-y-4">
                <input 
                  type="password" 
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-center transition-all"
                  autoFocus
                />
                <button 
                  onClick={handleUnlock}
                  disabled={!unlockPassword || isProcessing}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? 'Unlocking...' : 'Unlock PDF'}
                </button>
                <button 
                  onClick={() => setPdfData(null)}
                  className="w-full py-2 text-xs font-bold text-gray-400 hover:text-rose-500"
                >
                  Choose different file
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* File Info */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-6">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                <Info size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate dark:text-white">{pdfData.file.name}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 italic">Reading existing document properties...</p>
                <button onClick={() => setPdfData(null)} className="mt-1 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors">Change File</button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
              {!downloadUrl ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Title</label>
                      <input 
                        type="text" 
                        value={meta.title}
                        onChange={(e) => setMeta({...meta, title: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold focus:border-rose-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Author</label>
                      <input 
                        type="text" 
                        value={meta.author}
                        onChange={(e) => setMeta({...meta, author: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold focus:border-rose-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Subject</label>
                      <input 
                        type="text" 
                        value={meta.subject}
                        onChange={(e) => setMeta({...meta, subject: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold focus:border-rose-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Keywords (comma separated)</label>
                      <input 
                        type="text" 
                        value={meta.keywords}
                        onChange={(e) => setMeta({...meta, keywords: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold focus:border-rose-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Creator</label>
                      <input 
                        type="text" 
                        value={meta.creator}
                        onChange={(e) => setMeta({...meta, creator: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold focus:border-rose-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Producer</label>
                      <input 
                        type="text" 
                        value={meta.producer}
                        onChange={(e) => setMeta({...meta, producer: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-black rounded-2xl px-4 py-3 border border-gray-100 dark:border-zinc-800 font-bold focus:border-rose-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={saveMetadata}
                      disabled={isProcessing}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white p-6 rounded-3xl shadow-xl shadow-rose-200 dark:shadow-none font-black text-xl tracking-tight transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : <Edit3 />}
                      Update Metadata
                    </button>
                    <button 
                      onClick={clearMetadata}
                      className="w-full py-2 flex items-center justify-center gap-2 text-xs font-black uppercase text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} /> Wipe All Fields
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border border-green-100 dark:border-green-900/30">
                      <CheckCircle2 size={20} /> Success! Properties updated.
                   </div>
                   
                   <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => window.open(downloadUrl, '_blank')}
                        className="flex-1 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
                      >
                        <Eye size={20} /> Preview
                      </button>
                      
                      <a 
                        href={downloadUrl} 
                        download={`${customFileName}.pdf`}
                        className="flex-[2] bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all shadow-xl"
                      >
                        <Download size={24} /> Download PDF
                      </a>
                   </div>
                  
                  <button onClick={() => { setDownloadUrl(null); }} className="w-full py-2 text-xs font-black uppercase text-gray-400 hover:text-rose-500 tracking-[0.2em]">Edit Another</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          100% Client-Side Metadata Handling
        </div>
      </main>
    </div>
  )
}