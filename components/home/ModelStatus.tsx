"use client"

import { useState, useEffect } from "react"
import { Loader2, Shield } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

interface ModelStatusProps {
  isReady: boolean
  progress: number | null
}

const messages = [
  { icon: "⚡", text: "Private Neural Search Active", color: "text-green-600 dark:text-green-500" },
  { icon: null, iconComponent: Shield, text: "Privacy First • No Tracking • Open Source", color: "text-primary-600 dark:text-primary-400" },
]

export default function ModelStatus({ isReady, progress }: ModelStatusProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!isReady) return

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isReady])

  if (!isReady && progress !== null && progress < 100) {
    return (
      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Enhancing search capability... {Math.round(progress)}%</span>
      </div>
    )
  }

  if (isReady) {
    const currentMessage = messages[messageIndex]
    if (!currentMessage) return null

    return (
      <div className="mt-2 h-5 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center justify-center gap-1 text-xs ${currentMessage.color}`}
          >
            {currentMessage.icon && <span>{currentMessage.icon}</span>}
            {currentMessage.iconComponent && <currentMessage.iconComponent className="h-3 w-3" />}
            <span>{currentMessage.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return null
}
