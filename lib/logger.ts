/**
 * Centralized logging utility for Kingston Care Connect.
 * 
 * In development: logs to console with structured format.
 * In production: logs to console (can be extended to external service).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
    component?: string;
    action?: string;
    userId?: string;
    [key: string]: unknown;
}

const isDev = process.env.NODE_ENV !== 'production';

function formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
    /**
     * Log informational messages.
     */
    info: (message: string, meta?: LogMeta): void => {
        if (isDev) {
            console.log(formatMessage('info', message, meta));
        }
        // In production, optionally send to external service
    },

    /**
     * Log warning messages.
     */
    warn: (message: string, meta?: LogMeta): void => {
        console.warn(formatMessage('warn', message, meta));
    },

    /**
     * Log error messages with optional Error object.
     */
    error: (message: string, error?: Error | unknown, meta?: LogMeta): void => {
        const errorInfo = error instanceof Error
            ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
            : { error };
        console.error(formatMessage('error', message, { ...meta, ...errorInfo }));

        // In production, could send to Sentry, LogRocket, etc.
        // if (!isDev && typeof window !== 'undefined') {
        //     // Send to error tracking service
        // }
    },

    /**
     * Log debug messages (development only).
     */
    debug: (message: string, meta?: LogMeta): void => {
        if (isDev) {
            console.debug(formatMessage('debug', message, meta));
        }
    },
};

/**
 * Generate a unique error ID for support tickets.
 */
export function generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `ERR-${timestamp}-${randomPart}`.toUpperCase();
}
