/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { createContext, useContext, useState, ReactNode } from 'react'

interface PipelinedFile {
  buffer: Uint8Array
  name: string
  type?: string
  originalBuffer?: Uint8Array // To store the source before processing (e.g. for comparison)
}

interface PipelineContextType {
  pipelinedFile: PipelinedFile | null
  lastPipelinedFile: PipelinedFile | null
  setPipelineFile: (file: PipelinedFile | null) => void
  consumePipelineFile: () => PipelinedFile | null
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined)

export function PipelineProvider({ children }: { children: ReactNode }) {
  const [pipelinedFile, setPipelinedFile] = useState<PipelinedFile | null>(null)
  const [lastPipelinedFile, setLastPipelinedFile] = useState<PipelinedFile | null>(null)

  const setPipelineFile = (file: PipelinedFile | null) => {
    setPipelinedFile(file)
    if (file) setLastPipelinedFile(file)
  }

  const consumePipelineFile = () => {
    const file = pipelinedFile
    setPipelinedFile(null)
    return file
  }

  return (
    <PipelineContext.Provider value={{ pipelinedFile, lastPipelinedFile, setPipelineFile, consumePipelineFile }}>
      {children}
    </PipelineContext.Provider>
  )
}

export function usePipeline() {
  const context = useContext(PipelineContext)
  if (context === undefined) {
    throw new Error('usePipeline must be used within a PipelineProvider')
  }
  return context
}
