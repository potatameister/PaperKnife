/**
 * PaperKnife - Standalone Protect Tool
 * Copyright (C) 2026 potatameister
 */

import React, { useState, useRef, useEffect } from 'react'
import { Lock, FileUp, Loader2, ShieldCheck, Key } from 'lucide-react'
import { toast } from 'sonner'

import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import PrivacyBadge from './shared/PrivacyBadge'
import { NativeToolLayout } from './shared/NativeToolLayout'
import { PdfSecurity } from '../../utils/pdfSecurity'

export default function ProtectTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [protectedName, setProtectedName] = useState('')

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      setSourceFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setSourceFile(file)
      setProtectedName(`protected-${file.name.replace('.pdf', '')}`)
      setDownloadUrl(null)
    }
  }

  const applyProtection = async () => {
    if (!sourceFile || !password) return
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    setIsProcessing(true)
    try {
      const arrayBuffer = await sourceFile.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      
      const result = await PdfSecurity.lock(bytes, password)
      
      if (result.success && result.data) {
        const blob = new Blob([result.data as any], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const fileName = protectedName.endsWith('.pdf') ? protectedName : `${protectedName}.pdf`
        
        setDownloadUrl(url)
        
        addActivity({ 
          name: fileName, 
          tool: 'Protect', 
          size: blob.size, 
          resultUrl: url, 
          buffer: result.data 
        })
        
        toast.success('File Encrypted Successfully')
      } else {
        toast.error('Encryption failed. This PDF structure might be incompatible.')
      }
    } catch (e: any) {
      console.error(e)
      toast.error(`Encryption failed: ${e.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <NativeToolLayout 
      title="Protect PDF" 
      description="Add a master password to your document to prevent unauthorized access."
    >
      <input 
        type="file" 
        accept=".pdf" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />
      
      {!sourceFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">Select PDF to Lock</h3>
          <p className="text-sm text-gray-400">Tap to start protecting</p>
        </div>
      ) : !downloadUrl ? (
        <div className="max-w-md mx-auto animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-zinc-800">
               <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
               </div>
               <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-gray-400">Target File</p>
                  <p className="text-sm font-bold dark:text-white truncate">{sourceFile.name}</p>
               </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-1">Output Filename</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={protectedName}
                    onChange={(e) => setProtectedName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white shadow-inner transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-1">Set Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold dark:text-white shadow-inner transition-all pl-12"
                  />
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 px-1">Confirm Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password..."
                    className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold dark:text-white shadow-inner transition-all pl-12"
                  />
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>

              <button 
                onClick={applyProtection}
                disabled={!password || !confirmPassword || isProcessing}
                className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                Protect Document
              </button>

              <button 
                onClick={() => setSourceFile(null)}
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
            message="Document Protected!" 
            downloadUrl={downloadUrl} 
            fileName={protectedName.endsWith('.pdf') ? protectedName : `${protectedName}.pdf`} 
            onStartOver={() => {
              setSourceFile(null)
              setPassword('')
              setConfirmPassword('')
              setDownloadUrl(null)
            }} 
          />
        </div>
      )}
      
      <PrivacyBadge />
    </NativeToolLayout>
  )
}
