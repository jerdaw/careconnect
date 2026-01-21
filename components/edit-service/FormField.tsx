import { AccessibleFormField } from "../forms/AccessibleFormField"

interface FormFieldProps {
  label: string
  id: string
  error?: string
  children: React.ReactNode
  className?: string
  hint?: string
  required?: boolean
}

export default function FormField({ label, id, error, children, className = "", hint, required }: FormFieldProps) {
  return (
    <AccessibleFormField label={label} id={id} error={error} className={className} hint={hint} required={required}>
      {children}
    </AccessibleFormField>
  )
}
