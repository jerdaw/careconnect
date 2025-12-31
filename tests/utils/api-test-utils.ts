import { NextRequest } from "next/server"

export const createMockRequest = (url: string = "http://localhost", options: RequestInit = {}) => {
    return new NextRequest(url, options as any)
}

// Helper to parse JSON response body from Next.js response
export const parseResponse = async (response: Response) => {
    const data = await response.json() as any
    return {
        status: response.status,
        data
    }
}
