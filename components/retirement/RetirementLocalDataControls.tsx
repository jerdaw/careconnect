"use client"

import { useState } from "react"
import { Download, Trash2 } from "lucide-react"
import { clearRetirementUserData, collectRetirementUserData } from "@/lib/retirement/user-authored-data"

export interface RetirementLocalDataContent {
  clearConfirmation: string
  clearLocalData: string
  exportLocalData: string
  localDataCleared: string
  localDataDescription: string
  localDataError: string
  localDataExported: string
  localDataTitle: string
}

interface RetirementLocalDataControlsProps {
  content: RetirementLocalDataContent
}

const controlClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70"

export function RetirementLocalDataControls({ content }: RetirementLocalDataControlsProps) {
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  const exportData = async () => {
    setBusy(true)
    try {
      const data = await collectRetirementUserData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `careconnect-local-data-${data.exportedAt.slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(objectUrl)
      setStatus(content.localDataExported)
    } catch {
      setStatus(content.localDataError)
    } finally {
      setBusy(false)
    }
  }

  const clearData = async () => {
    if (!window.confirm(content.clearConfirmation)) return

    setBusy(true)
    try {
      await clearRetirementUserData()
      setStatus(content.localDataCleared)
    } catch {
      setStatus(content.localDataError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="local-data-title" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 id="local-data-title" className="text-xl font-bold">
        {content.localDataTitle}
      </h2>
      <p className="mt-2 max-w-3xl leading-7 text-slate-700">{content.localDataDescription}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void exportData()}
          className={`${controlClassName} border-slate-300 bg-white text-slate-950 hover:bg-slate-100 focus-visible:outline-slate-900`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {content.exportLocalData}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void clearData()}
          className={`${controlClassName} border-red-300 bg-red-50 text-red-950 hover:bg-red-100 focus-visible:outline-red-800`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {content.clearLocalData}
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-sm text-slate-700">
        {status}
      </p>
    </section>
  )
}
