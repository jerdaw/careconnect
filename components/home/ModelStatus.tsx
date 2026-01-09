"use client"

import { useState, useEffect, useRef } from "react"
import { Zap, ShieldCheck } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

interface ModelStatusProps {
  isReady: boolean
  progress: number | null
}

const messages = [
  { iconComponent: ShieldCheck, text: "Privacy First • No Tracking • Open Source", color: "text-green-600 dark:text-green-500" },
  { iconComponent: Zap, text: "Private Neural Search Active", color: "text-green-600 dark:text-green-500" },
]

// Synced to half of the 10-second spin cycle
const HALF_CYCLE_DURATION = 5000 // 5 seconds

export default function ModelStatus({ isReady }: ModelStatusProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [minDisplayTimeElapsed, setMinDisplayTimeElapsed] = useState(false)
  const [shouldCycle, setShouldCycle] = useState(false)
  
  const cycleStartTimeRef = useRef<number | null>(null)

  // Initial wait before cycling can start (show Privacy First for at least 4s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinDisplayTimeElapsed(true)
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  // Enable cycling when ready
  useEffect(() => {
    if (minDisplayTimeElapsed && isReady) {
      setMessageIndex(1)
      setShouldCycle(true)
      cycleStartTimeRef.current = Date.now()
    }
  }, [minDisplayTimeElapsed, isReady])

  // Cycling logic: switch every 5 seconds (half of the 10s spin), starting at the middle point
  useEffect(() => {
    if (!shouldCycle) return

    // Calculate time until next middle point (every 5 seconds, offset by 2.5s from spin start)
    const MIDDLE_OFFSET = 2500 // 2.5s offset to hit the "middle" of each half-cycle
    const now = Date.now()
    const cycleStart = cycleStartTimeRef.current ?? now
    const elapsed = (now - cycleStart) % HALF_CYCLE_DURATION
    const timeUntilNext = (HALF_CYCLE_DURATION + MIDDLE_OFFSET - elapsed) % HALF_CYCLE_DURATION || HALF_CYCLE_DURATION

    const initialTimeout = setTimeout(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
      
      // Then continue at regular 5-second intervals
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length)
      }, HALF_CYCLE_DURATION)

      ;(window as unknown as Record<string, unknown>).__modelStatusInterval = interval
    }, timeUntilNext)

    return () => {
      clearTimeout(initialTimeout)
      const interval = (window as unknown as Record<string, unknown>).__modelStatusInterval as ReturnType<typeof setInterval> | undefined
      if (interval) clearInterval(interval)
    }
  }, [shouldCycle])

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


