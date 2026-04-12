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

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      setSourceFile(file)
    }
  }, [])

  const handleUnlocked = async (decryptedBuffer: Uint8Array, file: File) => {
    const fileName = `unlocked-${file.name}`
    const blob = new Blob([decryptedBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    setUnlockedData({ buffer: decryptedBuffer, name: fileName })
    setDownloadUrl(url)
    
    addActivity({ 
      name: fileName, 
      tool: 'Unlock', 
      size: blob.size, 
      resultUrl: url, 
      buffer: decryptedBuffer 
    })
  }

  return (
    <NativeToolLayout 
      title="Unlock PDF" 
      description="Remove password protection and encryption from your PDF permanently."
    >
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && setSourceFile(e.target.files[0])} 
      />
      
      {!downloadUrl ? (
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
      ) : (
        <div className="animate-in zoom-in duration-300">
          <SuccessState 
            message="Decryption Complete!" 
            downloadUrl={downloadUrl} 
            fileName={unlockedData?.name || 'unlocked.pdf'} 
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
