"use client"

import { WifiOff, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-neutral-50 px-4 text-center dark:bg-neutral-900">
      <div className="rounded-full bg-neutral-200 p-6 dark:bg-neutral-800">
        <WifiOff className="h-12 w-12 text-neutral-500 dark:text-neutral-400" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">You are offline</h1>
      <p className="mt-2 max-w-sm text-neutral-600 dark:text-neutral-400">
        It looks like you lost your internet connection. We can&apos;t search for new services right now.
      </p>

      <div className="mt-8 w-full max-w-md space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Emergency Contacts</h3>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">You can still call these numbers:</p>

          <ul className="space-y-4">
            <li className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-medium text-neutral-900 dark:text-white">AMHS-KFLA Crisis Line</p>
                <p className="text-xs text-neutral-500">24/7 Mental Health</p>
              </div>
              <a
                href="tel:6135444229"
                className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            </li>
            <li className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-medium text-neutral-900 dark:text-white">Emergency</p>
                <p className="text-xs text-neutral-500">Police / Fire / Ambulance</p>
              </div>
              <a
                href="tel:911"
                className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
              >
                <Phone className="h-4 w-4" />
                911
              </a>
            </li>
          </ul>
        </div>

        <div className="flex justify-center">
          <Button variant="link" onClick={() => window.location.reload()}>
            Try connecting again
          </Button>
        </div>
      </div>
    </div>
  )
}
