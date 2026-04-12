/**
 * PaperKnife - Standalone Unlock Tool
 * Copyright (C) 2026 potatameister
 */

import { useState, useRef, useEffect } from 'react'
import { Unlock, FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { SecurePDFGate } from '../shared/SecurePDFGate'

export default function UnlockTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [unlockedData, setUnlockedData] = useState<{ buffer: Uint8Array, name: string } | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('')

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      setSourceFile(file)
    }
  }, [])

  const handleUnlocked = async (decryptedBuffer: Uint8Array, file: File) => {
    const fileName = `unlocked-${file.name.replace('.pdf', '')}`
    setUnlockedData({ buffer: decryptedBuffer, name: fileName })
    setCustomFileName(fileName)
  }

  const saveUnlockedPdf = () => {
    if (!unlockedData) return
    
    const finalName = customFileName.endsWith('.pdf') ? customFileName : `${customFileName}.pdf`
    const blob = new Blob([unlockedData.buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    setDownloadUrl(url)
    
    addActivity({ 
      name: finalName, 
      tool: 'Unlock', 
      size: blob.size, 
      resultUrl: url, 
      buffer: unlockedData.buffer 
    })
    toast.success('File Unlocked Successfully')
  }

  const ActionButton = () => (
    <button onClick={saveUnlockedPdf} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20">
      <Unlock size={20} /> Save Unlocked PDF
    </button>
  )

  return (
    <NativeToolLayout 
      title="Unlock PDF" 
      description="Remove password protection and encryption from your PDF permanently."
      actions={unlockedData && !downloadUrl && <ActionButton />}
    >
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && setSourceFile(e.target.files[0])} 
      />
      
      {!unlockedData ? (
        <SecurePDFGate 
          file={sourceFile} 
          onUnlocked={handleUnlocked} 
          onCancel={() => setSourceFile(null)}
        >
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
          >
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <FileUp size={32} />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">Select Locked PDF</h3>
            <p className="text-sm text-gray-400">Tap to browse and decrypt</p>
          </div>
        </SecurePDFGate>
      ) : !downloadUrl ? (
        <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl space-y-6">
            <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
               <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Unlock size={20} />
               </div>
               <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Successfully Decrypted</p>
                  <p className="text-sm font-bold dark:text-white truncate">{sourceFile?.name}</p>
               </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-1">Output Filename</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white shadow-inner transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={() => { setSourceFile(null); setUnlockedData(null); }}
                className="w-full text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors pt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in zoom-in duration-300">
          <SuccessState 
            message="Saved Successfully!" 
            downloadUrl={downloadUrl} 
            fileName={customFileName.endsWith('.pdf') ? customFileName : `${customFileName}.pdf`} 
            onStartOver={() => {
              setSourceFile(null)
              setUnlockedData(null)
              setDownloadUrl(null)
            }} 
          />
        </div>
      )}
      
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
