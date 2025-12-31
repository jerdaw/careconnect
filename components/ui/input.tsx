import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="group relative">
        {icon && (
          <div className="group-focus-within:text-primary-600 pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-neutral-400 transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "peer shadow-inner-light w-full rounded-2xl border border-neutral-200 bg-white/50 backdrop-blur-xl",
            "px-5 py-3.5 text-neutral-900 placeholder-transparent outline-none",
            "transition-all duration-300",
            "focus:border-primary-500 focus:ring-primary-500/20 focus:shadow-primary-500/10 focus:bg-white focus:shadow-lg focus:ring-4",
            "hover:border-neutral-300 hover:bg-white/80",
            "dark:focus:border-primary-500 dark:focus:ring-primary-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-neutral-900/80",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-12",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
          ref={ref}
          placeholder={label || "Input"}
          {...props}
        />
        {label && (
          <label
            className={cn(
              "absolute -top-2.5 left-4 rounded-full bg-white px-2 text-xs font-semibold text-neutral-500 shadow-sm",
              "pointer-events-none transition-all duration-200",
              "peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-500 peer-placeholder-shown:shadow-none",
              "peer-focus:text-primary-600 peer-focus:-top-2.5 peer-focus:bg-white peer-focus:text-xs peer-focus:shadow-sm dark:peer-focus:bg-neutral-900",
              "dark:bg-neutral-900 dark:text-neutral-400",
              icon && "peer-placeholder-shown:left-12 peer-focus:left-4"
            )}
          >
            {label}
          </label>
        )}
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
