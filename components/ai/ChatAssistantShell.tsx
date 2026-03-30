"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { MessageSquare } from "lucide-react"

const ChatAssistant = dynamic(() => import("@/components/ai/ChatAssistant"), {
  ssr: false,
  loading: () => null,
})

export function ChatAssistantShell() {
  const [shouldLoadAssistant, setShouldLoadAssistant] = useState(false)

  if (shouldLoadAssistant) {
    return <ChatAssistant initialOpen />
  }

  return (
    <aside
      role="complementary"
      aria-label="AI Chat Assistant"
      className="fixed right-6 bottom-6 z-50 flex flex-col items-end"
    >
      <button
        type="button"
        onClick={() => setShouldLoadAssistant(true)}
        className="pointer-events-auto z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-accent-600)] text-white shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </aside>
  )
}
