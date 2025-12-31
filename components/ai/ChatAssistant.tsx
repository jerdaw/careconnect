"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, X, Send, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatAssistant() {
    const { isReady, isLoading, progress, text, error, initAI, chat } = useAI();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    // Hydrate Vector DB
    useEffect(() => {
        import('@/lib/search/lifecycle').then(mod => mod.initializeVectorStore());
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsThinking(true);

        try {
            // Build conversation history for the context
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            // RAG: Perform a local search to find relevant services
            // We dynamic import to avoid bundling search logic if not needed initially
            const { searchServices } = await import('@/lib/search');
            const searchResults = await searchServices(userMsg, { limit: 3 });

            // Format context
            const contextText = searchResults.length > 0
                ? `Here are some relevant local services I found:\n${searchResults.map(r => ` - ${r.service.name}: ${r.service.description} (Category: ${r.service.intent_category})`).join('\n')}`
                : "No direct matches found in our database.";

            // System prompt + Context to ground the AI
            const systemPrompt = {
                role: 'system' as const,
                content: `You are a helpful assistant for Kingston Care Connect. You help people find social services in Kingston, Ontario.
                
CONTEXT from database:
${contextText}

INSTRUCTIONS:
- Answer based on the CONTEXT provided above if possible.
- If the context matches the user's need, recommend those specific services.
- Be kind, concise, and safe.
- If the user is in crisis, urge them to call 911.`
            };

            const fullContext = [
                systemPrompt,
                ...history,
                { role: 'user' as const, content: userMsg }
            ];

            const reply = await chat(fullContext);
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble thinking right now. Please try searching instead." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-80 sm:w-96 pointer-events-auto"
                    >
                        <Card className="flex flex-col h-[500px] shadow-2xl border-primary-200 dark:border-primary-800 overflow-hidden bg-white/95 backdrop-blur-sm dark:bg-neutral-900/95">
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-300" />
                                    <h3 className="font-semibold text-sm">Care Assistant</h3>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-white hover:bg-white/20"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-900/50" ref={scrollRef}>
                                {!isReady ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
                                        {isLoading ? (
                                            <>
                                                <div className="w-16 h-16 relative">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-neutral-200 dark:text-neutral-700" />
                                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-primary-500 transition-all duration-300" strokeDasharray={175} strokeDashoffset={175 - (175 * progress)} />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                                                        {Math.round(progress * 100)}%
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Initializing AI Brain...</p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[200px]">{text}</p>
                                                </div>
                                            </>
                                        ) : error ? (
                                            <div className="text-center text-red-500">
                                                <p className="text-sm font-bold">Initialization Failed</p>
                                                <p className="text-xs mt-1">{error}</p>
                                                <Button size="sm" variant="outline" onClick={initAI} className="mt-4">Retry</Button>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <Sparkles className="w-12 h-12 text-primary-300 mx-auto" />
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium">Privacy-First AI</p>
                                                    <p className="text-xs text-neutral-500">
                                                        This assistant runs 100% on your device. No data is sent to the cloud. It requires a ~2GB download once.
                                                    </p>
                                                </div>
                                                <Button onClick={initAI} className="w-full">
                                                    Enable Assistant
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {messages.length === 0 && (
                                            <div className="text-center py-8 text-neutral-500 text-sm">
                                                <p>👋 Hi! I can help you find services.</p>
                                                <p className="text-xs mt-2 opacity-70">Try asking: &quot;Where can I find food?&quot; or &quot;I need youth shelter.&quot;</p>
                                            </div>
                                        )}
                                        {messages.map((m, i) => (
                                            <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                                    m.role === 'user'
                                                        ? "bg-primary-600 text-white rounded-br-none"
                                                        : "bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-none border border-neutral-100 dark:border-neutral-700"
                                                )}>
                                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                        {isThinking && (
                                            <div className="flex justify-start">
                                                <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-neutral-100 dark:border-neutral-700">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={isReady ? "Type a message..." : "Waiting for AI..."}
                                        disabled={!isReady || isThinking}
                                        className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!isReady || !input.trim() || isThinking}
                                        className="rounded-full h-9 w-9 shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
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
                    "pointer-events-auto h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-colors duration-300 z-50",
                    isOpen
                        ? "bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
                        : "bg-gradient-to-r from-primary-600 to-accent-600 text-white"
                )}
                aria-label="Toggle AI Assistant"
            >
                {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>
        </div>
    );
}
