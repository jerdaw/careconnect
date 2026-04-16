import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { loadServices } from "@/lib/search/data"
import { normalizeProvenance } from "@/lib/provenance"
import type { Service, Provenance } from "@/types/service"
import { logger } from "@/lib/logger"
import { checkRateLimit, createRateLimitHeaders, getClientIp } from "@/lib/rate-limit"

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

  return {
    ...rest,
    provenance: normalizeProvenance(rest.provenance),
  }
}

function createExportFingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function normalizeEtag(value: string | null): string | null {
  if (!value) {
    return null
  }

  return value.replace(/^W\//, "").replace(/^"|"$/g, "")
}

export async function GET(request: Request) {
  try {
    const rateLimit = await checkRateLimit(getClientIp(request), 60, 60 * 60 * 1000, "api:v1:services:export")
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: createRateLimitHeaders(rateLimit) }
      )
    }

    const services = await loadServices()
    const publicServices = services
      .filter((s) => s.published !== false && !s.deleted_at)
      .map((s) => sanitizeForPublicExport(s))
    const publicIds = new Set(publicServices.map((s) => s.id))
    const embeddings = services
      .filter((s) => s.embedding && publicIds.has(s.id))
      .map((s) => ({
        id: s.id,
        embedding: s.embedding!,
      }))
    const fingerprint = createExportFingerprint({
      services: publicServices,
      embeddings,
    })
    const etag = `"${fingerprint}"`

    if (normalizeEtag(request.headers.get("If-None-Match")) === fingerprint) {
      return new Response(null, { status: 304, headers: { ETag: etag } })
    }

    const exportData = {
      version: fingerprint,
      count: publicServices.length,
      services: publicServices,
      embeddings,
    }

    // Add Cache-Control Headers
    return NextResponse.json(exportData, {
      headers: {
        "Cache-Control": "public, max-age=86400",
        ETag: etag,
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
