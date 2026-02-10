import { NextResponse } from "next/server"
import { loadServices } from "@/lib/search/data"
import type { Service, Provenance } from "@/types/service"
import { logger } from "@/lib/logger"

type PublicExportService = Omit<
  Service,
  | "embedding"
  | "distance"
  | "org_id"
  | "deleted_at"
  | "deleted_by"
  | "admin_notes"
  | "last_admin_review"
  | "reviewed_by"
> & { provenance: Provenance }

function sanitizeForPublicExport(service: Service): PublicExportService {
  // Remove fields that should never be exposed publicly (admin/partner/internal).
  // Keep the shape compatible with client/offline usage.
  const {
    embedding: _embedding,
    distance: _distance,
    org_id: _org_id,
    deleted_at: _deleted_at,
    deleted_by: _deleted_by,
    admin_notes: _admin_notes,
    last_admin_review: _last_admin_review,
    reviewed_by: _reviewed_by,
    ...rest
  } = service

  void [_embedding, _distance, _org_id, _deleted_at, _deleted_by, _admin_notes, _last_admin_review, _reviewed_by]

  const lastVerified = rest.last_verified || rest.provenance?.verified_at || null
  const evidenceUrl = rest.provenance?.evidence_url || ""
  const method = rest.provenance?.method || ""

  return {
    ...rest,
    provenance: {
      verified_by: "Care Connect Admin",
      verified_at: lastVerified || new Date().toISOString(),
      evidence_url: evidenceUrl,
      method,
    },
  }
}

export async function GET(request: Request) {
  try {
    const services = await loadServices()
    const publicServices = services
      .filter((s) => s.published !== false && !s.deleted_at)
      .map((s) => sanitizeForPublicExport(s))
    const publicIds = new Set(publicServices.map((s) => s.id))

    // Separate embeddings to reduce redundancy if needed, but for now we keep it simple
    // Actually, separating them matches the IDB structure better and reduces JSON parsing overhead on the main service object if we want.
    // But loadServices returns them integrated.
    // Let's split them for the response to match the IDB save functions we just wrote.

    const dailyTag = `"${new Date().toISOString().split("T")[0]}"`

    // Check If-None-Match
    const ifNoneMatch = request.headers.get("If-None-Match")
    if (ifNoneMatch === dailyTag) {
      return new Response(null, { status: 304, headers: { ETag: dailyTag } })
    }

    const exportData = {
      version: new Date().toISOString(), // In a real app, this should be the max(updated_at)
      count: publicServices.length,
      services: publicServices,
      embeddings: services
        .filter((s) => s.embedding && publicIds.has(s.id))
        .map((s) => ({
          id: s.id,
          embedding: s.embedding!,
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
    logger.error("Services export failed", error, {
      component: "api-services-export",
      action: "GET",
    })
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
