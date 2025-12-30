import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiResponse<T = any> = {
    data?: T;
    error?: string;
    details?: any;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        offset?: number;
    };
};

/**
 * Standard API Response helper
 */
export function createApiResponse<T>(
    data: T,
    options: {
        status?: number;
        headers?: HeadersInit;
        meta?: ApiResponse['meta'];
    } = {}
) {
    const { status = 200, headers, meta } = options;

    return NextResponse.json(
        { data, ...(meta && { meta }) },
        { status, headers }
    );
}

/**
 * Standard API Error helper
 */
export function createApiError(
    message: string,
    status: number = 500,
    details?: any
) {
    return NextResponse.json(
        { error: message, ...(details && { details }) },
        { status }
    );
}

/**
 * Global Error Handler for API routes
 */
export function handleApiError(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof ZodError) {
        return createApiError('Validation Error', 400, error.errors);
    }

    if (error instanceof Error) {
        // Handle specific supabase errors or known exceptions here if needed
        return createApiError(error.message, 500);
    }

    return createApiError('Internal Server Error', 500);
}
