"use client"

import { useState, useEffect, useRef } from "react"
import { Zap, ShieldCheck } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

const messages = [
  { iconComponent: ShieldCheck, text: "Privacy First • No Tracking • Open Source", color: "text-green-600 dark:text-green-500" },
  { iconComponent: Zap, text: "Private Neural Search Active", color: "text-green-600 dark:text-green-500" },
]

// Synced to half of the 10-second spin cycle
const HALF_CYCLE_DURATION = 5000 // 5 seconds

interface ModelStatusProps {
  isReady: boolean
  progress: number | null
}

export default function ModelStatus({ isReady }: ModelStatusProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  
  // Use a ref to access the latest isReady value in the interval callback
  const isReadyRef = useRef(isReady)
  useEffect(() => {
    isReadyRef.current = isReady
  }, [isReady])
  
  // Ref to store the interval for proper cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start the checkpoint timer immediately on mount
  // At each checkpoint, check if we should switch
  useEffect(() => {
    // Initial sync point at 4.35 seconds from mount
    const FIRST_CHECKPOINT_DELAY = 4350
    
    const firstCheckpointTimeout = setTimeout(() => {
      // First checkpoint: check if ready and start cycling
      if (isReadyRef.current) {
        setMessageIndex(1) // Switch to "Neural Search Active"
      }
      
      // Continue checking at each subsequent checkpoint (every 5 seconds)
      intervalRef.current = setInterval(() => {
        if (!isReadyRef.current) {
          // Not ready yet, stay on message 0
          return
        }
        
        // Ready: cycle between messages
        setMessageIndex((prev) => (prev + 1) % messages.length)
      }, HALF_CYCLE_DURATION)
    }, FIRST_CHECKPOINT_DELAY)
    
    return () => {
      clearTimeout(firstCheckpointTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const currentMessage = messages[messageIndex % messages.length]

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
          <currentMessage.iconComponent className="h-3 w-3" />
          <span>{currentMessage.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}



