export const IS_UNLOCK_WASM_DISABLED = import.meta.env.VITE_DISABLE_UNLOCK_WASM === 'true'

let runnerPromise: Promise<any> | null = null

const getRunner = () => {
  if (!runnerPromise) {
    runnerPromise = (async () => {
      const { createQpdfRunner } = await import('qpdf-run')
      const base = `${import.meta.env.BASE_URL}qpdf/`
      return createQpdfRunner({
        qpdfJsUrl: base + 'qpdf.js',
        wasmUrl: base + 'qpdf.wasm',
        workerUrl: base + 'worker.js',
        timeoutMs: 60000
      })
    })()
  }
  return runnerPromise
}

/**
 * Real vector decrypt via qpdf WASM. Web only — never bundled into APKs
 * (public/qpdf/ is populated for Pages deploys, empty for APK builds).
 */
export const qpdfDecrypt = async (data: Uint8Array, password: string): Promise<Uint8Array> => {
  if (IS_UNLOCK_WASM_DISABLED) throw new Error('WASM_DISABLED')
  const runner = await getRunner()
  try {
    return await runner.runOne({
      input: data,
      inputName: 'input.pdf',
      outputName: 'output.pdf',
      args: ['--password=' + password, '--decrypt', '--', 'input.pdf', 'output.pdf']
    })
  } catch (e: any) {
    const detail = [...(e?.stderr || []), ...(e?.stdout || []), e?.message || ''].join(' ').toLowerCase()
    if (detail.includes('password')) throw new Error('INCORRECT_PASSWORD')
    if (e?.code === 'QPDF_TIMEOUT') throw new Error('Timed out while unlocking.')
    throw new Error(e?.message || 'Could not decrypt file.')
  }
}
