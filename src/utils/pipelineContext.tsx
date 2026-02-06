import { createContext, useContext, useState, ReactNode } from 'react'

interface PipelinedFile {
  buffer: Uint8Array
  name: string
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
