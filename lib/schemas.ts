import { z } from 'zod';

export const serviceSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    address: z.string().optional(),
    phone: z.string().optional(),
    url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    email: z.string().email("Must be a valid email").optional().or(z.literal('')),
    hours: z.string().optional(),
    fees: z.string().optional(),
    eligibility: z.string().optional(),
    application_process: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    tags: z.array(z.string()).optional(),
    bus_routes: z.string().optional(), // Entered as CSV, parsed later
    languages: z.array(z.string()).optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
