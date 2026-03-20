/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISABLE_OCR: string;
  readonly VITE_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*?url' {
  const content: string;
  export default content;
}
