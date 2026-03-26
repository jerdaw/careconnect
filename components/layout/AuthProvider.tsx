"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, Session } from "@supabase/supabase-js"
import { hasSupabaseCredentials, supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const authEnabled = hasSupabaseCredentials()

  useEffect(() => {
    if (!authEnabled) {
      setLoading(false)
      return
    }

    let isMounted = true
    let unsubscribe = () => {}

    // Check active session
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!isMounted) {
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!isMounted) {
            return
          }

          setSession(nextSession)
          setUser(nextSession?.user ?? null)
          setLoading(false)
          router.refresh()
        })

        unsubscribe = () => subscription.unsubscribe()
      } catch (error) {
        logger.warn("Supabase auth unavailable; continuing without session support", {
          component: "AuthProvider",
          error,
        })

        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void initSession()

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [authEnabled, router])

  const signOut = async () => {
    if (!authEnabled) {
      return
    }

    await supabase.auth.signOut()
    router.refresh()
  }

  return <AuthContext.Provider value={{ user, session, loading, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
