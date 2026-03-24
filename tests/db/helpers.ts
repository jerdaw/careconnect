import { createHmac } from "node:crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const env = {
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  jwtSecret: process.env.SUPABASE_JWT_SECRET!,
}

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function createJwt(userId: string, role: "authenticated" | "service_role" = "authenticated") {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "HS256", typ: "JWT" }
  const payload = {
    aud: "authenticated",
    exp: now + 60 * 60,
    iat: now,
    iss: "supabase",
    role,
    sub: userId,
    email: `${userId}@example.test`,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = createHmac("sha256", env.jwtSecret).update(`${encodedHeader}.${encodedPayload}`).digest()

  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`
}

function createBaseClient(key: string, authorization?: string): SupabaseClient {
  return createClient(env.url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: authorization
      ? {
          headers: {
            Authorization: authorization,
          },
        }
      : undefined,
  })
}

export function createAnonClient() {
  return createBaseClient(env.anonKey)
}

export function createServiceRoleClient() {
  return createBaseClient(env.serviceRoleKey)
}

export function createAuthenticatedClient(userId: string) {
  return createBaseClient(env.anonKey, `Bearer ${createJwt(userId)}`)
}

export const seededIds = {
  food: "db-food-complete",
  housingFr: "db-fr-housing",
  crisis988: "crisis-988",
  hiddenDeleted: "db-hidden-deleted",
  hiddenDraft: "db-hidden-draft",
  hiddenUnpublished: "db-hidden-unpublished",
}

export const seededUsers = {
  owner: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  viewer: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
}
