import { NextResponse } from "next/server"
import { loadServices } from "@/lib/search/data"

export async function GET(request: Request) {
  try {
    const services = await loadServices()

    // Separate embeddings to reduce redundancy if needed, but for now we keep it simple
    // Actually, separating them matches the IDB structure better and reduces JSON parsing overhead on the main service object if we want.
    // But loadServices returns them integrated.
    // Let's split them for the response to match the IDB save functions we just wrote.

    const dailyTag = `"${new Date().toISOString().split("T")[0]}"`

    // Check If-None-Match
    const ifNoneMatch = request.headers.get("If-None-Match")
    if (ifNoneMatch === dailyTag) {
      return new Response(null, { status: 304 })
    }

    const exportData = {
      version: new Date().toISOString(), // In a real app, this should be the max(updated_at)
      count: services.length,
      services: services.map((s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { embedding, ...rest } = s
        return rest
      }),
      embeddings: services
        .filter((s) => s.embedding)
        .map((s) => ({
          id: s.id,
          embedding: s.embedding,
        })),
    }

    // Add Cache-Control Headers
    return NextResponse.json(exportData, {
      headers: {
        "Cache-Control": "public, max-age=86400",
        ETag: dailyTag,
      },
    })
  } catch (error) {
    console.error("Export API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
