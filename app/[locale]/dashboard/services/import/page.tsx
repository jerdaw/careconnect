"use client"

import { useState, useRef } from "react"
import { Upload, FileText, Check, X, Download } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"

export default function BulkImportPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type !== "text/csv") {
      alert("Only CSV files are allowed.")
      return
    }
    setFile(file)
    parseCSV(file)
  }

  // Quick & Dirty CSV Parser (Client Side)
  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = function (e) {
      const text = e.target?.result as string
      if (!text) return

      const lines = text.split("\n")
      const headers = lines[0]?.split(",") || []
      const data: Record<string, string>[] = []

      // Limit preview to 5 rows
      // Loop starts at 1 to skip header, check if line exists
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const line = lines[i]
        if (!line || !line.trim()) continue

        const row = line.split(",")
        if (row.length === headers.length) {
          const obj: Record<string, string> = {}
          headers.forEach((h, index) => {
            const key = h?.trim()
            if (key) {
              obj[key] = row[index]?.trim() || ""
            }
          })
          data.push(obj)
        }
      }
      setParsedData(data)
    }
    reader.readAsText(file)
  }

  const handleStartImport = async () => {
    setIsProcessing(true)
    let successCount = 0
    let errorCount = 0

    // Process sequentially to avoid rate limits
    for (const row of parsedData) {
      try {
        // Map CSV row to API schema
        // TODO: Robust mapping needed here. For now, assuming CSV headers match fields or close enough.
        const payload = {
          name: row.name || row.Name || "Untitled Service",
          description: row.description || row.Description || "",
          category: row.category || row.Category || "Other",
          // Defaulting required fields for V1
          address: row.address || row.Address || "",
          phone: row.phone || row.Phone || "",
          url: row.url || row.website || row.Website || "",
          eligibility: row.eligibility || "",
          fees: row.fees || "",
          email: row.email || "",
        }

        const res = await fetch("/api/v1/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          successCount++
        } else {
          console.warn(`Failed to import ${payload.name}:`, await res.text())
          errorCount++
        }
      } catch (err) {
        console.error("Import error", err)
        errorCount++
      }
    }

    setIsProcessing(false)
    setUploadStatus("success") // In a real app, show partial success/error report
    setFile(null)
    setParsedData([])

    if (errorCount > 0) {
      alert(`Import completed with ${successCount} successes and ${errorCount} failures.`)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="mb-2 flex items-center text-sm text-neutral-500">
            <Link href="/dashboard/services" className="transition-colors hover:text-neutral-900">
              My Services
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-neutral-900">Import</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Bulk Import Services</h1>
          <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
            Upload a CSV file to add multiple services at once.
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {uploadStatus === "idle" && (
        <div
          className={`relative flex h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <Upload className="mb-4 h-12 w-12 text-neutral-400" />
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Drag and drop your CSV file here, or{" "}
                <Button variant="link" className="h-auto p-0" onClick={() => inputRef.current?.click()}>
                  browse
                </Button>
              </p>
              <p className="mt-2 text-xs text-neutral-500">Supports: .csv (Max 5MB)</p>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <FileText className="mb-4 h-12 w-12 text-blue-600" />
              <p className="font-medium text-neutral-900 dark:text-white">{file.name}</p>
              <p className="mt-1 text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setFile(null)
                  setParsedData([])
                }}
              >
                <X className="h-3 w-3" /> Remove File
              </Button>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
        </div>
      )}

      {/* Success Message */}
      {uploadStatus === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-green-800 dark:text-green-300">Import Successful</h3>
          <p className="mt-2 text-green-700 dark:text-green-400">
            Your file has been uploaded and is being processed. You will be notified once the services are added.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => setUploadStatus("idle")}>
            Import Another
          </Button>
        </div>
      )}

      {/* Template Download */}
      <div className="flex justify-start">
        <a href="#" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500">
          <Download className="h-4 w-4" /> Download CSV Template
        </a>
      </div>

      {/* parsed Data Preview */}
      {file && parsedData.length > 0 && uploadStatus === "idle" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Data Preview</h3>
            <span className="text-xs text-neutral-500">Showing first 5 rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  {parsedData[0] &&
                    Object.keys(parsedData[0]).map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium tracking-wider text-neutral-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                {parsedData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val: string, j) => (
                      <td
                        key={j}
                        className="px-6 py-4 text-sm whitespace-nowrap text-neutral-600 dark:text-neutral-400"
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end bg-neutral-50 px-6 py-4 dark:bg-neutral-800/50">
            <Button onClick={handleStartImport} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Complete Import"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
