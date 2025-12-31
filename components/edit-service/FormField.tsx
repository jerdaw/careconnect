interface FormFieldProps {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}

export default function FormField({ label, error, children, className = "" }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
