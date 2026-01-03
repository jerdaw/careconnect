"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ShieldCheck, Mail } from "lucide-react"

interface ClaimFlowProps {
  serviceId: string
  serviceName: string
}

export function ClaimFlow({ serviceName }: ClaimFlowProps) {
  const t = useTranslations("ClaimFlow")
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [agreed, setAgreed] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) return
    setIsSubmitting(true)
    
    // Simulating API call since backend isn't ready
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsOpen(false)
    toast({ title: t("success") })
    setStep(1)
    setEmail("")
    setAgreed(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
           <ShieldCheck className="h-4 w-4" />
           {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            {/* Steps Indicator */}
            <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${step === 1 ? 'border-primary-600 bg-primary-50 text-primary-600' : 'bg-neutral-100'}`}>1</span>
                <span>{t("step1")}</span>
                <div className="h-px flex-1 bg-neutral-200" />
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${step === 2 ? 'border-primary-600 bg-primary-50 text-primary-600' : 'bg-neutral-100'}`}>2</span>
                <span>{t("step2")}</span>
            </div>

            {step === 1 ? (
                <div className="space-y-4">
                    <div className="rounded-md border p-4 text-sm text-neutral-600 h-40 overflow-y-auto bg-neutral-50">
                        <p className="font-bold mb-2">Partner Terms Agreement</p>
                        <p>By claiming this listing for <strong>{serviceName}</strong>, you verify that you are an authorized representative...</p>
                        {/* Shortened for UI, full terms on page */}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} />
                        <Label htmlFor="terms" className="text-sm cursor-pointer">{t("agreeLabel")}</Label>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="name@organization.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Use your official organization email for faster verification.
                        </p>
                    </div>
                </div>
            )}
        </div>

        <DialogFooter>
          {step === 1 ? (
              <Button onClick={() => setStep(2)} disabled={!agreed}>
                {t("submit")}
              </Button>
          ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !email}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Claim
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
