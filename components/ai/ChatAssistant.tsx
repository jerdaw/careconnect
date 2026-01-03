"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useAI } from "@/hooks/useAI"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, X, Send, Loader2, Sparkles, ChevronDown, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { useTranslations } from "next-intl"
import { aiEngine } from "@/lib/ai/engine"
import { AiDisclaimer } from "@/components/chat/AiDisclaimer"

interface Message {
  role: "user" | "assistant"
  content: string
}

const IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 Minutes
const MAX_CONTEXT_MESSAGES = 10 // Limit context window

export default function ChatAssistant() {
  const t = useTranslations("AI")
  const { isReady, isLoading, progress, text, error, initAI, chat } = useAI()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  // Hydrate Vector DB
  useEffect(() => {
    import("@/lib/search/lifecycle").then((mod) => mod.initializeVectorStore())
  }, [])

  // VRAM Management: Idle Timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)

    // If chat is closed, set a timer to unload the model
    if (!isOpen && isReady) {
      idleTimerRef.current = setTimeout(() => {
        console.log("[AI] Unloading model due to inactivity...")
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

  const handleSend = async () => {
    if (!input.trim() || isThinking) return

    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setIsThinking(true)

    try {
      // Build conversation history for the context (Limit to last N messages)
      const history = messages.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({ role: m.role, content: m.content }))

      // RAG: Perform a local search to find relevant services
      // We dynamic import to avoid bundling search logic if not needed initially
      const { searchServices } = await import("@/lib/search")
      const searchResults = await searchServices(userMsg, { limit: 3, useAIExpansion: true })

      // Format context
      const contextIntro = t("contextIntro") // Localized intro
      const noMatches = t("noMatches")

      const contextText =
        searchResults.length > 0
          ? `${contextIntro}\n${searchResults
              .map((r) => ` - ${r.service.name}: ${r.service.description} (Category: ${r.service.intent_category})`)
              .join("\n")}`
          : noMatches

      // System prompt + Context to ground the AI
      // We pull the localized system prompt from messages
      const systemPromptContent = t("systemPrompt")
      const crisisPrompt = t("crisisPrompt")

      const systemPrompt = {
        role: "system" as const,
        content: `${systemPromptContent}
                
CONTEXT from database:
${contextText}

INSTRUCTIONS:
- Answer based on the CONTEXT provided above if possible.
- If the context matches the user's need, recommend those specific services.
- Be kind, concise, and safe.
- ${crisisPrompt}`,
      }

      const fullContext = [systemPrompt, ...history, { role: "user" as const, content: userMsg }]

      const reply = await chat(fullContext)
      setMessages((prev) => [...prev, { role: "assistant", content: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("errorThinking") }])
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
                    onClick={() => setMessages([])}
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

              {/* Content Area */}
              <div
                className="flex-1 space-y-4 overflow-y-auto bg-neutral-50 p-4 dark:bg-neutral-900/50"
                ref={scrollRef}
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
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
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
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isReady ? t("placeholderReady") : t("placeholderWaiting")}
                    disabled={!isReady || isThinking}
                    className="focus:ring-primary-500 flex-1 rounded-full border-none bg-neutral-100 px-4 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50 dark:bg-neutral-800"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!isReady || !input.trim() || isThinking}
                    className="h-9 w-9 shrink-0 rounded-full"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
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
