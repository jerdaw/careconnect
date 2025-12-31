"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { transcribeAudio } from "@/lib/ai/transcriber"

type VoiceState = "idle" | "listening" | "processing" | "error"

interface UseVoiceInputResult {
    state: VoiceState
    isSupported: boolean
    startListening: () => void
    stopListening: () => void
    error: string | null
}

export function useVoiceInput(
    onResult: (text: string) => void
    // lang param removed as we rely on Whisper (en model for now)
): UseVoiceInputResult {
    const [state, setState] = useState<VoiceState>("idle")
    const [error, setError] = useState<string | null>(null)
    const [isSupported, setIsSupported] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        // Feature detection - Only need MediaRecorder now
        if (typeof window !== "undefined") {
            const hasMediaRecorder = "MediaRecorder" in window && "mediaDevices" in navigator
            setIsSupported(hasMediaRecorder)
        }
    }, [])

    const startListening = useCallback(async () => {
        setState("listening")
        setError(null)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            const chunks: Blob[] = []

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data)

            mediaRecorder.onstop = async () => {
                // If recording was very short or empty
                if (chunks.length === 0) {
                    setState("idle")
                    return
                }

                setState("processing")
                try {
                    const blob = new Blob(chunks, { type: "audio/webm" })
                    const text = await transcribeAudio(blob)
                    if (text && text.trim().length > 0) {
                        onResult(text)
                    }
                } catch (err) {
                    console.error("Transcription error", err)
                    setError("Failed to transcribe")
                } finally {
                    setState("idle")
                    // Cleanup tracks to release mic
                    stream.getTracks().forEach(t => t.stop())
                }
            }

            mediaRecorder.start()
        } catch (err) {
            console.error(err)
            setError("Microphone access denied")
            setState("error")
        }
    }, [onResult])

    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
        } else {
            setState("idle")
        }
    }, [])

    return {
        state,
        isSupported,
        startListening,
        stopListening,
        error
    }
}
