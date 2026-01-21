import React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AccessibleFormFieldProps {
  label: string
  id: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}

export function AccessibleFormField({
  label,
  id,
  error,
  required,
  hint,
  className,
  children,
}: AccessibleFormFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive dark:text-red-400")}>
        {label}
        {required && (
          <span className="text-destructive ml-1 dark:text-red-400" aria-label="required">
            *
          </span>
        )}
      </Label>

      {/* Clone child to inject aria props if it's a valid element */}
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              id?: string
              "aria-describedby"?: string
              "aria-invalid"?: boolean
              "aria-required"?: boolean
              className?: string
            }>,
            {
              id,
              "aria-describedby": describedBy,
              "aria-invalid": !!error,
              "aria-required": required,
              className: cn(
                (children.props as { className?: string }).className,
                error &&
                  "border-destructive focus-visible:ring-destructive dark:border-red-900 dark:focus-visible:ring-red-900"
              ),
            }
          )
        : children}

      {hint && !error && (
        <p id={hintId} className="text-muted-foreground text-[0.8rem]">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-destructive text-[0.8rem] font-medium dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
