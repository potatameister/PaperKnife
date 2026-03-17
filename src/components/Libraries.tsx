import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'

const libraries = [
  { name: 'pdf-lib', desc: 'PDF manipulation', url: 'https://github.com/hopding/pdf-lib' },
  { name: 'pdfjs-dist', desc: 'PDF rendering', url: 'https://mozilla.github.io/pdf.js/' },
  { name: 'JSZip', desc: 'ZIP file handling', url: 'https://github.com/Stuk/jszip' },
  { name: 'tesseract.js', desc: 'OCR text extraction', url: 'https://tesseract.projectnaptha.com/' },
  { name: 'React', desc: 'UI framework', url: 'https://react.dev/' },
  { name: 'Vite', desc: 'Build tool', url: 'https://vite.dev/' },
  { name: 'Tailwind CSS', desc: 'Styling', url: 'https://tailwindcss.com/' },
  { name: 'Capacitor', desc: 'Native app wrapper', url: 'https://capacitorjs.com/' },
  { name: 'Sonner', desc: 'Toast notifications', url: 'https://sonner.emilkowal.com/' },
  { name: 'Lucide', desc: 'Icons', url: 'https://lucide.dev/' },
  { name: 'dnd-kit', desc: 'Drag & drop', url: 'https://dndkit.com/' },
  { name: 'pdf-lib', desc: 'PDF encryption', url: 'https://github.com/aleen42/node_modules/tree/master/packages/pdfsmaller' },
]

export default function Libraries() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black pb-32 transition-colors">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-500 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
                <Package size={24} strokeWidth={2.5} />
             </div>
             <div>
                <h2 className="text-xl font-black dark:text-white tracking-tighter leading-none mb-1">Libraries</h2>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Open Source Dependencies</p>
             </div>
          </div>
        </div>

        {/* Libraries List */}
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden">
            {libraries.map((lib, i) => (
              <a 
                key={i}
                href={lib.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{lib.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{lib.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pb-6">
          <p className="text-center text-[10px] text-gray-400 font-medium">
            PaperKnife uses these open source libraries to provide PDF functionality. 
            Thank you to all the maintainers and contributors!
          </p>
        </div>

      </div>
    </div>
  )
}
