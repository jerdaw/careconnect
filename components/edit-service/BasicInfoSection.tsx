import { FieldErrors, UseFormRegister } from "react-hook-form"
import { ServiceFormData } from "@/lib/schemas"
import FormField from "./FormField"

interface BasicInfoSectionProps {
  register: UseFormRegister<ServiceFormData>
  errors: FieldErrors<ServiceFormData>
}

export default function BasicInfoSection({ register, errors }: BasicInfoSectionProps) {
  return (
    <div className="space-y-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="text-lg leading-6 font-medium text-neutral-900 dark:text-white">Basic Information</h3>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label="Service Name" error={errors.name?.message} className="sm:col-span-2">
          <input
            {...register("name")}
            type="text"
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </FormField>

        <FormField label="Description" error={errors.description?.message} className="sm:col-span-2">
          <textarea
            {...register("description")}
            rows={4}
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </FormField>

        <FormField label="Category" error={errors.category?.message}>
          <select
            {...register("category")}
            className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          >
            <option value="Food">Food</option>
            <option value="Housing">Housing</option>
            <option value="Health">Health</option>
            <option value="Crisis">Crisis</option>
            <option value="Community">Community</option>
          </select>
        </FormField>
      </div>
    </div>
  )
}
