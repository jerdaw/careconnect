"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useTranslations } from "next-intl"

interface PrintButtonProps {
    className?: string
}

export function PrintButton({ className }: PrintButtonProps) {
    const t = useTranslations("Common")

    const handlePrint = () => {
        window.print()
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className={className}
            data-print-hide
        >
            <Printer className="mr-2 h-4 w-4" />
            {t("printResults")}
        </Button>
    )
}
