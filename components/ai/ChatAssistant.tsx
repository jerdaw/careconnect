"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useAI } from "@/hooks/useAI"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  ChevronDown,
  Trash2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  StopCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { useTranslations } from "next-intl"
import { aiEngine } from "@/lib/ai/engine"
import { AiDisclaimer } from "@/components/chat/AiDisclaimer"
import { EmergencyModal } from "@/components/ui/EmergencyModal"
import { detectCrisis } from "@/lib/search/crisis"
import { logger } from "@/lib/logger"

interface Message {
  role: "user" | "assistant"
  content: string
  feedback?: "up" | "down"
}

const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 Minutes

export default function ChatAssistant({ initialOpen = false }: { initialOpen?: boolean }) {
  const t = useTranslations("AI")
  const { isReady, isLoading, progress, text, error, initAI, stop } = useAI()
  const { isOffline } = useNetworkStatus()
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isStoppingRef = useRef(false)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  // VRAM Management: Idle Timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

    // If chat is closed, set a timer to unload the model
    if (!isOpen && isReady) {
      idleTimerRef.current = setTimeout(() => {
        logger.info("Unloading AI model due to inactivity", { component: "ChatAssistant", action: "idle_unload" })
        aiEngine.unload()
      }, IDLE_TIMEOUT_MS)
    }
  }, [isOpen, isReady])

  // Monitor open state for idle timer
  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [isOpen, resetIdleTimer])

  const prevOpenRef = useRef(false)

  // Focus management: Return focus to toggle button ONLY when closing the chat
  useEffect(() => {
    if (prevOpenRef.current && !isOpen && toggleButtonRef.current) {
      toggleButtonRef.current.focus()
    }
    prevOpenRef.current = isOpen
  }, [isOpen])

  const handleStop = useCallback(async () => {
    if (!isThinking) return
    isStoppingRef.current = true
    try {
      await stop()
    } catch (err) {
      logger.warn("Failed to stop generation", { component: "ChatAssistant", action: "stop_generation", error: err })
    }
  }, [isThinking, stop])

  const handleFeedback = (index: number, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((msg, i) => {
        if (i !== index) return msg
        // Toggle off if clicking same type, else switch to new type
        const newFeedback = msg.feedback === type ? undefined : type
        return { ...msg, feedback: newFeedback }
      })
    )
  }

  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMsg = input.trim()

    // --- CRISIS CIRCUIT BREAKER (Client-Side) ---
    // Deterministic safety: prevents the request from ever reaching the LLM (Good Samaritan Defense).
    if (detectCrisis(userMsg)) {
      setInput("")
      // 1. Show user message so they feel heard (but blocked)
      setMessages((prev) => [...prev, { role: "user", content: userMsg }])

      // 2. Inject System Message explaining the block
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("crisisBlocked"),
          },
        ])
      }, 500)

      // 3. Trigger Modal
      setIsEmergencyModalOpen(true)
      return
    }
    // ---------------------------------------------

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setIsThinking(true)
    isStoppingRef.current = false

    try {
      // "Smarter search" flow:
      // 1) (Optional) LLM rewrites/expands the query (JSON), not user-facing.
      // 2) Local search runs on the refined query.
      // 3) UI renders deterministic results (no LLM answers shown).

      let searchQuery = userMsg
      if (isReady) {
        try {
          const refined = await aiEngine.refineSearchQuery(userMsg)
          if (refined && !isStoppingRef.current) {
            const combined = [refined.query, ...refined.terms].join(" ").trim()
            if (combined) searchQuery = combined
          }
        } catch (err) {
          logger.warn("[ChatAssistant] Query refinement failed; falling back to raw query", { err })
        }
      }

      if (isStoppingRef.current) return

      const { searchServices } = await import("@/lib/search")
      // CRITICAL: Disable AI Expansion inside search to avoid recursion (LLM calling search that calls LLM).
      const searchResults = await searchServices(searchQuery, { limit: 3, useAIExpansion: false })
      if (isStoppingRef.current) return

      const noMatches = t("noMatches")

      if (searchResults.length === 0) {
        const message = `${noMatches}\n\n${t("clarifyQuestion")}`
        setMessages((prev) => [...prev, { role: "assistant", content: message }])
        setIsThinking(false)
        return
      }

      const finalDisplay = `${t("resultsIntro")}\n${searchResults
        .slice(0, 3)
        .map((r) => `- [${r.service.name}](/service/${r.service.id}) — ${r.service.description.substring(0, 180)}…`)
        .join("\n")}`

      setMessages((prev) => [...prev, { role: "assistant", content: finalDisplay }])
    } catch (error) {
      logger.error("Error in chat handleSend", error, { component: "ChatAssistant", action: "send_message" })
      const message = t("errorThinking")
      setMessages((prev) => [...prev, { role: "assistant", content: message }])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <aside
      role="complementary"
      aria-label="AI Chat Assistant"
      className="fixed right-6 bottom-6 z-50 flex flex-col items-end"
    >
      <EmergencyModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto mb-4 w-80 sm:w-96"
          >
            <Card className="border-primary-200 dark:border-primary-800 flex h-[500px] flex-col overflow-hidden bg-white/95 shadow-2xl backdrop-blur-sm dark:bg-neutral-900/95">
              {/* Header */}
              <div className="from-primary-600 to-primary-500 flex items-center justify-between bg-gradient-to-r p-4 text-white shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                  <h3 className="text-sm font-semibold">{t("title")}</h3>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={() => {
                      setMessages([])
                      aiEngine.reset()
                    }}
                    title={t("clearChat")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Persistent Disclaimer Banner */}
              <div className="flex shrink-0 items-center justify-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">{t("verifyBanner")}</span>
              </div>

              {/* Content Area */}
              <div
                className="flex-1 space-y-4 overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-900/50"
                ref={scrollRef}
                aria-live="polite"
                aria-atomic="false"
              >
                {!isReady ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-4 p-4 text-center">
                    {isLoading ? (
                      <>
                        <div className="relative h-16 w-16">
                          <svg className="h-full w-full -rotate-90 transform">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-neutral-200 dark:text-neutral-700"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-primary-500 transition-all duration-300"
                              strokeDasharray={175}
                              strokeDashoffset={175 - 175 * progress}
                            />
                          </svg>
                          <div className="text-primary-600 dark:text-primary-400 absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {Math.round(progress * 100)}%
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {t("initializing")}
                          </p>
                          <p className="max-w-[200px] text-xs text-neutral-500 dark:text-neutral-400">{text}</p>
                        </div>
                      </>
                    ) : error ? (
                      <div className="text-center text-red-500">
                        <p className="text-sm font-bold">{t("initFailed")}</p>
                        <p className="mt-1 text-xs">{error}</p>
                        <Button size="sm" variant="outline" onClick={initAI} className="mt-4">
                          {t("retry")}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 text-center">
                        <Sparkles className="text-primary-300 mx-auto h-12 w-12" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{t("privacyNote")}</p>
                          <p className="text-xs text-neutral-500">{t("privacyDesc")}</p>
                        </div>
                        <Button onClick={initAI} className="w-full">
                          {t("enable")}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {messages.length === 0 && (
                      <div className="py-8 text-center text-sm text-neutral-500">
                        <div className="px-4 text-left">
                          <AiDisclaimer />
                        </div>
                        <p>{t("welcome")}</p>
                        <p className="mt-2 text-xs opacity-70">{t("suggestion")}</p>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            m.role === "user"
                              ? "bg-primary-600 rounded-br-none text-white"
                              : "rounded-bl-none border border-neutral-100 bg-white text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                          )}
                        >
                          <ReactMarkdown
                            components={{
                              a: ({ ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:text-primary-700 font-medium underline"
                                />
                              ),
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                        {/* Outcome Feedback Loop (Visual Only) */}
                        {m.role === "assistant" && (
                          <div className="mt-1 flex gap-1 px-2 opacity-40 transition-opacity hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-6 w-6 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                m.feedback === "up" && "bg-green-50 text-green-600 dark:bg-green-900/20"
                              )}
                              title="Helpful"
                              onClick={() => handleFeedback(i, "up")}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-6 w-6 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                m.feedback === "down" && "bg-red-50 text-red-600 dark:bg-red-900/20"
                              )}
                              title="Not Helpful"
                              onClick={() => handleFeedback(i, "down")}
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-none border border-neutral-100 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                          <Loader2 className="text-primary-500 h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-neutral-100 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    ref={inputRef}
                    autoFocus
                    autoComplete="off"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isOffline ? t("unavailableOffline") : isReady ? t("placeholderReady") : t("placeholderWaiting")
                    }
                    aria-label={t("title")}
                    disabled={!isReady || isThinking || isOffline}
                    className="focus:ring-primary-500 flex-1 rounded-full border-none bg-neutral-100 px-4 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50 dark:bg-neutral-800"
                  />
                  <Button
                    size="icon"
                    type={isThinking ? "button" : "submit"}
                    onClick={isThinking ? handleStop : undefined}
                    disabled={!isReady || (isThinking ? false : !input.trim()) || isOffline}
                    className="h-9 w-9 shrink-0 rounded-full"
                    aria-label={isThinking ? t("ariaStopGenerating") : t("ariaSendMessage")}
                  >
                    {isThinking ? <StopCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        ref={toggleButtonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-colors duration-300",
          isOpen
            ? "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
            : "from-primary-600 to-accent-600 bg-gradient-to-r text-white"
        )}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <ChevronDown className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>
    </aside>
  )
}
