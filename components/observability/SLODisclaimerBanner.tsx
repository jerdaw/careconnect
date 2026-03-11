"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SLO_STATUS } from "@/lib/config/slo-targets"

/**
 * Provisional SLO Disclaimer Banner
 *
 * Displays when SLO targets are in PROVISIONAL status,
 * prompting user to review and confirm targets.
 */
export function SLODisclaimerBanner() {
  // Only show if provisional
  if (SLO_STATUS !== "PROVISIONAL") {
    return null
  }

  return (
    <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">SLO Targets are Provisional</AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        Current targets use recommended defaults from the{" "}
        <a
          href="https://github.com/yourusername/helpbridge-ca/blob/main/docs/planning/v18-0-phase-3-slo-decision-guide.md"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline hover:text-blue-600 dark:hover:text-blue-300"
        >
          SLO Decision Guide
        </a>
        . Review and adjust based on production data and business requirements. Update{" "}
        <code className="text-sm">lib/config/slo-targets.ts</code> to confirm.
      </AlertDescription>
    </Alert>
  )
}
