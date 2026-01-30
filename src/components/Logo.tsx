export const PaperKnifeLogo = ({ size = 24 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 4L21 12H9L4 4Z" fill="#F43F5E" />
    <path d="M4 20L21 12H9L4 20Z" className="fill-zinc-900 dark:fill-zinc-100 transition-colors duration-300" />
    <path d="M9 12L21 12" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
  </svg>
)
