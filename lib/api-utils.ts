import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger, generateErrorId } from './logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResponse<T = any> = {
    data?: T;
    error?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        offset?: number;
        timestamp?: string;
        requestId?: string;
    };
};

/**
 * Standard API Response helper
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createApiResponse<T = any>(
    data: T,
    options: {
        status?: number;
        headers?: HeadersInit;
        meta?: ApiResponse['meta'];
    } = {}
) {
    const { status = 200, headers, meta } = options;

    const responseMeta = {
        timestamp: new Date().toISOString(),
        requestId: generateErrorId(), // Reusing error ID generator for request IDs
        ...meta
    };

    return NextResponse.json(
        { data, meta: responseMeta },
        { status, headers }
    );
}

/**
 * Standard API Error helper
 */
export function createApiError(
    message: string,
    status: number = 500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any
) {
    const meta = {
        timestamp: new Date().toISOString(),
        requestId: generateErrorId(),
    };

    return NextResponse.json(
        {
            error: {
                message,
                code: status,
                details
            },
            meta
        },
        { status }
    );
}

/**
 * Global Error Handler for API routes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleApiError(error: any) {
    logger.error('API Error:', error, { component: 'api-utils' });

    if (error instanceof ZodError) {
        return createApiError('Validation Error', 400, error.errors);
    }

    if (error instanceof Error) {
        return createApiError(error.message, 500);
    }

    return createApiError('Internal Server Error', 500);
}
