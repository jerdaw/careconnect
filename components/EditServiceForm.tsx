'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceSchema, ServiceFormData } from '@/lib/schemas';
import { Service } from '@/types/service';
import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditServiceFormProps {
    service?: Service; // Optional for creation mode
    onSubmit: (data: ServiceFormData) => Promise<void>;
}

export default function EditServiceForm({ service, onSubmit }: EditServiceFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: service?.name || '',
            description: service?.description || '',
            address: service?.address || '',
            phone: service?.phone || '',
            url: service?.url || '',
            email: service?.email || '',
            hours: service?.hours || '',
            fees: service?.fees || '',
            eligibility: service?.eligibility || '',
            application_process: service?.application_process || '',
            category: service?.intent_category || 'General',
            tags: service?.identity_tags?.map(t => t.tag) || [],
            bus_routes: service?.bus_routes?.join(', ') || '',
            // languages: service?.languages || [], // TODO: Tag input support
        },
    });

    const onFormSubmit = async (data: ServiceFormData) => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            await onSubmit(data);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to save changes.';
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-white">Basic Information</h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Service Name</label>
                        <input
                            {...register('name')}
                            type="text"
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Description</label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Category</label>
                        <select
                            {...register('category')}
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                        >
                            <option value="Food">Food</option>
                            <option value="Housing">Housing</option>
                            <option value="Health">Health</option>
                            <option value="Crisis">Crisis</option>
                            <option value="Community">Community</option>
                            {/* Add more values */}
                        </select>
                        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
                    </div>
                </div>
            </div>

            <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-white">Contact & Location</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</label>
                        <input
                            {...register('address')}
                            type="text"
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                            placeholder="123 Main St, Kingston, ON"
                        />
                        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</label>
                        <input
                            {...register('phone')}
                            type="tel"
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                        />
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Website URL</label>
                        <input
                            {...register('url')}
                            type="url"
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                            placeholder="https://"
                        />
                        {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>}
                    </div>
                </div>
            </div>

            <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-medium leading-6 text-neutral-900 dark:text-white">Details</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Hours of Operation</label>
                        <input
                            {...register('hours')}
                            type="text"
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                            placeholder="Mon-Fri 9-5"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Eligibility</label>
                        <textarea
                            {...register('eligibility')}
                            rows={2}
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Fees</label>
                        <input
                            {...register('fees')}
                            type="text"
                            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white sm:text-sm"
                            placeholder="Free, Sliding Scale, etc."
                        />
                    </div>
                </div>
            </div>

            {submitError && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {submitError}
                </div>
            )}

            <div className="flex justify-end pt-5">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="lg"
                >
                    {isSubmitting ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
