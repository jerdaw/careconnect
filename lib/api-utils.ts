import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { logger, generateErrorId } from "./logger"

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ValidationError"
    }
}

export type ApiResponse<T = unknown> = {
  data?: T
  error?: string
  details?: Record<string, unknown> | unknown
  meta?: {
    page?: number
    limit?: number
    total?: number
    offset?: number
    timestamp?: string
    requestId?: string
  }
}

/**
 * Standard API Response helper
 */
export function createApiResponse<T = unknown>(
  data: T,
  options: {
    status?: number
    headers?: HeadersInit
    meta?: ApiResponse["meta"]
  } = {}
) {
  const { status = 200, headers, meta } = options

  const responseMeta = {
    timestamp: new Date().toISOString(),
    requestId: generateErrorId(), // Reusing error ID generator for request IDs
    ...meta,
  }

  return NextResponse.json({ data, meta: responseMeta }, { status, headers })
}

/**
 * Standard API Error helper
 */
export function createApiError(message: string, status: number = 500, details?: Record<string, unknown> | unknown) {
  const meta = {
    timestamp: new Date().toISOString(),
    requestId: generateErrorId(),
  }

  return NextResponse.json(
    {
      error: {
        message,
        code: status,
        details,
      },
      meta,
    },
    { status }
  )
}

/**
 * Global Error Handler for API routes
 */
export function handleApiError(error: unknown) {
  logger.error("API Error:", error, { component: "api-utils" })

  if (error instanceof ZodError) {
    return createApiError("Validation Error", 400, error.errors)
  }

  if (error instanceof AuthorizationError) {
    return createApiError(error.message, 403)
  }

  if (error instanceof NotFoundError) {
    return createApiError(error.message, 404)
  }

  if (error instanceof ValidationError) {
    return createApiError(error.message, 415)
  }

  if (error instanceof Error) {
    return createApiError(error.message, 500)
  }

  return createApiError("Internal Server Error", 500)
}

/**
 * Validates that the request has 'application/json' content-type.
 * Throws ValidationError if invalid.
 */
export function validateContentType(request: Request) {
    const contentType = request.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
        throw new ValidationError("Content-Type must be application/json")
    }
}
