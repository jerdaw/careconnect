"use client"

import { useState, useRef } from "react"
import { Upload, FileText, Check, X, Download, AlertCircle, CheckCircle } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"
import { validateCSVBatch, normalizeCSVHeaders, type CSVRowValidationResult } from "@/lib/schemas/service-csv-import"

export default function BulkImportPage() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([])
  const [validationResults, setValidationResults] = useState<CSVRowValidationResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number } | null>(null)
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
      logger.warn("Invalid file type attempted", { fileType: file.type, fileName: file.name })
      setUploadStatus("error")
      return
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      logger.warn("File too large", { fileSize: file.size, maxSize, fileName: file.name })
      setUploadStatus("error")
      return
    }

    setFile(file)
    setUploadStatus("idle")
    parseCSV(file)
  }

  // CSV Parser with header normalization and validation
  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = function (e) {
      const text = e.target?.result as string
      if (!text) {
        logger.error("Failed to read CSV file", { fileName: file.name })
        return
      }

      try {
        const lines = text.split("\n")
        const rawHeaders = lines[0]?.split(",") || []

        // Normalize headers to canonical field names
        const headers = normalizeCSVHeaders(rawHeaders)

        // Check for required headers
        const hasName = headers.includes("name")
        const hasDescription = headers.includes("description")
        const hasCategory = headers.includes("intent_category")

        if (!hasName || !hasDescription || !hasCategory) {
          logger.error("CSV missing required headers", {
            headers,
            hasName,
            hasDescription,
            hasCategory,
          })
          setUploadStatus("error")
          return
        }

        const data: Record<string, string>[] = []

        // Parse all rows (not just preview) for validation
        // Limit to 100 rows for safety
        for (let i = 1; i < Math.min(lines.length, 101); i++) {
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

        // Validate all rows
        const results = validateCSVBatch(data)
        setValidationResults(results)

        logger.info("CSV parsed and validated", {
          fileName: file.name,
          totalRows: data.length,
          validRows: results.filter((r) => r.isValid).length,
          invalidRows: results.filter((r) => !r.isValid).length,
        })
      } catch (error) {
        logger.error("CSV parsing failed", {
          error: error instanceof Error ? error.message : String(error),
          fileName: file.name,
        })
        setUploadStatus("error")
      }
    }
    reader.readAsText(file)
  }

  const handleStartImport = async () => {
    setIsProcessing(true)
    let successCount = 0
    let errorCount = 0

    // Only import valid rows
    const validRows = validationResults.filter((r) => r.isValid && r.data)

    logger.info("Starting CSV import", {
      totalRows: validationResults.length,
      validRows: validRows.length,
      invalidRows: validationResults.length - validRows.length,
    })

    // Process sequentially to avoid rate limits
    for (const validationResult of validRows) {
      try {
        const payload = validationResult.data!

        const res = await fetch("/api/v1/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          successCount++
        } else {
          const errorText = await res.text()
          logger.warn("Failed to import service", {
            serviceName: payload.name,
            status: res.status,
            error: errorText,
            rowIndex: validationResult.rowIndex,
          })
          errorCount++
        }
      } catch (err) {
        logger.error("Import error", {
          error: err instanceof Error ? err.message : String(err),
          rowIndex: validationResult.rowIndex,
        })
        errorCount++
      }
    }

    setIsProcessing(false)
    setImportSummary({ success: successCount, failed: errorCount })
    setUploadStatus("success")
    setFile(null)
    setParsedData([])
    setValidationResults([])

    logger.info("CSV import completed", { successCount, errorCount })
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
          role="region"
          aria-label="File upload area"
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
                  setValidationResults([])
                }}
              >
                <X className="h-3 w-3" /> Remove File
              </Button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleChange}
            aria-label="Upload CSV file"
          />
        </div>
      )}

      {/* Error Message */}
      {uploadStatus === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <X className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-red-800 dark:text-red-300">Upload Failed</h3>
          <p className="mt-2 text-red-700 dark:text-red-400">
            The file could not be processed. Please ensure it&apos;s a valid CSV file with required headers (name,
            description, category).
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setUploadStatus("idle")
              setFile(null)
              setParsedData([])
              setValidationResults([])
            }}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Success Message */}
      {uploadStatus === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-green-800 dark:text-green-300">Import Complete</h3>
          {importSummary && (
            <div className="mt-4 space-y-1">
              <p className="text-green-700 dark:text-green-400">
                <strong>{importSummary.success}</strong> service{importSummary.success !== 1 ? "s" : ""} imported
                successfully
              </p>
              {importSummary.failed > 0 && (
                <p className="text-red-600 dark:text-red-400">
                  <strong>{importSummary.failed}</strong> service{importSummary.failed !== 1 ? "s" : ""} failed to
                  import
                </p>
              )}
            </div>
          )}
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setUploadStatus("idle")
              setImportSummary(null)
            }}
          >
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

      {/* Validation Summary */}
      {file && validationResults.length > 0 && uploadStatus === "idle" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Validation Results</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Valid Rows</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {validationResults.filter((r) => r.isValid).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Invalid Rows</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                  {validationResults.filter((r) => !r.isValid).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors List */}
      {file && validationResults.length > 0 && validationResults.some((r) => !r.isValid) && uploadStatus === "idle" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-900 dark:text-amber-300">Validation Errors</h3>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {validationResults
              .filter((r) => !r.isValid)
              .slice(0, 10)
              .map((result) => (
                <div
                  key={result.rowIndex}
                  className="rounded-lg border border-amber-300 bg-white p-3 dark:border-amber-700 dark:bg-neutral-800"
                >
                  <p className="mb-2 text-sm font-medium text-amber-900 dark:text-amber-300">Row {result.rowIndex}:</p>
                  <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-400">
                    {result.errors?.map((error, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 text-amber-600">•</span>
                        <span>
                          <strong>{error.field}:</strong> {error.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            {validationResults.filter((r) => !r.isValid).length > 10 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ... and {validationResults.filter((r) => !r.isValid).length - 10} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {/* Data Preview */}
      {file && parsedData.length > 0 && uploadStatus === "idle" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Data Preview</h3>
            <span className="text-xs text-neutral-500">Showing first 10 rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-neutral-500 uppercase">
                    Status
                  </th>
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
                {parsedData.slice(0, 10).map((row, i) => {
                  const validation = validationResults[i]
                  return (
                    <tr key={i} className={!validation?.isValid ? "bg-red-50 dark:bg-red-900/10" : ""}>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {validation?.isValid ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </td>
                      {Object.values(row).map((val: string, j) => (
                        <td
                          key={j}
                          className="px-6 py-4 text-sm whitespace-nowrap text-neutral-600 dark:text-neutral-400"
                        >
                          {val || <span className="text-neutral-400 italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between bg-neutral-50 px-6 py-4 dark:bg-neutral-800/50">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {validationResults.filter((r) => r.isValid).length} valid rows ready to import
            </p>
            <Button
              onClick={handleStartImport}
              disabled={isProcessing || validationResults.filter((r) => r.isValid).length === 0}
            >
              {isProcessing ? "Processing..." : `Import ${validationResults.filter((r) => r.isValid).length} Services`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
