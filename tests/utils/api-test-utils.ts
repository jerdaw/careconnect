import { NextRequest } from "next/server"

export const createMockRequest = (url: string = "http://localhost", options: RequestInit = {}) => {
  // NextRequest has incompatible signal null vs undefined from global RequestInit
  return new NextRequest(url, { ...options, signal: options.signal ?? undefined })
}

// Helper to parse JSON response body from Next.js response
export const parseResponse = async <T = unknown>(response: Response) => {
  const data = (await response.json()) as T
  return {
    status: response.status,
    data,
  }
}
