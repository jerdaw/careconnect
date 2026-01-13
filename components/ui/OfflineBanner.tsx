"use client"

import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { WifiOff, RotateCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { syncOfflineData } from "@/lib/offline/sync"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus()
  const t = useTranslations("Offline")
  const [isSyncing, setIsSyncing] = useState(false)

  const handleRefresh = async () => {
    setIsSyncing(true)
    await syncOfflineData(true)
    // If we're truly offline, sync won't really work, but we can try
    // Just a simulated delay if offline
    if (isOffline) {
        await new Promise(r => setTimeout(r, 1000))
    }
    setIsSyncing(false)
  }

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
           initial={{ height: 0, opacity: 0 }}
           animate={{ height: "auto", opacity: 1 }}
           exit={{ height: 0, opacity: 0 }}
           className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800"
        >
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between text-sm">
             <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
               <WifiOff className="h-4 w-4" />
               <span>
                 {t("bannerMessage")}
               </span>
             </div>
             
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={handleRefresh}
               disabled={isSyncing}
               className="h-auto py-1 px-2 text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 dark:text-amber-300 dark:hover:bg-amber-800/50"
             >
               <RotateCw className={`mr-1 h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
               {t("checkConnection")}
             </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
