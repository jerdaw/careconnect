"use client"

import { useState, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { Network } from "@capacitor/network"

export interface NetworkStatus {
  isOnline: boolean
  isOffline: boolean
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown'
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isOffline: false,
    connectionType: 'unknown'
  })

  useEffect(() => {
    // 1. Initial Check
    const checkStatus = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
           const nativeStatus = await Network.getStatus()
           setStatus({
             isOnline: nativeStatus.connected,
             isOffline: !nativeStatus.connected,
             connectionType: nativeStatus.connectionType
           })
        } else {
           // Web Fallback
           setStatus({
             isOnline: navigator.onLine,
             isOffline: !navigator.onLine,
             connectionType: 'unknown'
           })
        }
      } catch (e) {
        console.warn("Failed to check network status:", e)
      }
    }

    checkStatus()

    // 2. Event Listeners
    if (Capacitor.isNativePlatform()) {
      const handleNativeChange = (status: { connected: boolean; connectionType: string }) => {
         setStatus({
            isOnline: status.connected,
            isOffline: !status.connected,
            connectionType: status.connectionType as unknown as NetworkStatus['connectionType']
         })
      }
      
      const listener = Network.addListener('networkStatusChange', handleNativeChange)
      
      return () => {
        listener.then(l => l.remove())
      }
    } else {
       // Web Listeners
       const handleOnline = () => setStatus(s => ({ ...s, isOnline: true, isOffline: false }))
       const handleOffline = () => setStatus(s => ({ ...s, isOnline: false, isOffline: true }))
       
       window.addEventListener('online', handleOnline)
       window.addEventListener('offline', handleOffline)
       
       return () => {
         window.removeEventListener('online', handleOnline)
         window.removeEventListener('offline', handleOffline)
       }
    }
  }, [])

  return status
}
