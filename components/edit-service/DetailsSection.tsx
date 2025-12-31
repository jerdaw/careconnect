import { FieldErrors, UseFormRegister } from "react-hook-form"
import { ServiceFormData } from "@/lib/schemas"
import FormField from "./FormField"

interface DetailsSectionProps {
  register: UseFormRegister<ServiceFormData>
  errors: FieldErrors<ServiceFormData>
}

export default function DetailsSection({ register, errors }: DetailsSectionProps) {
  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="text-lg leading-6 font-medium text-neutral-900 dark:text-white">Details</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="Hours of Operation" error={errors.hours?.message} className="sm:col-span-2">
          <input
            {...register("hours")}
            type="text"
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            placeholder="Mon-Fri 9-5"
          />
        </FormField>

        <FormField label="Eligibility" error={errors.eligibility?.message} className="sm:col-span-2">
          <textarea
            {...register("eligibility")}
            rows={2}
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </FormField>

        <FormField label="Fees" error={errors.fees?.message} className="sm:col-span-2">
          <input
            {...register("fees")}
            type="text"
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            placeholder="Free, Sliding Scale, etc."
          />
        </FormField>
      </div>
    </div>
  )
}
