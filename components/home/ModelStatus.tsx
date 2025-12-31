import { Loader2 } from "lucide-react"

interface ModelStatusProps {
  isReady: boolean
  progress: number | null
}

export default function ModelStatus({ isReady, progress }: ModelStatusProps) {
  if (!isReady && progress !== null && progress < 100) {
    return (
      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Enhancing search capability... {Math.round(progress)}%</span>
      </div>
    )
  }

  if (isReady) {
    return (
      <div className="animate-in fade-in mt-2 text-xs text-green-600 duration-1000 dark:text-green-500">
        ⚡ Private Neural Search Active
      </div>
    )
  }

  return null
}
