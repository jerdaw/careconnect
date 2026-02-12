import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { env } from "@/lib/env"

function checkPublicFile(relativePath: string) {
  const diskPath = path.join(process.cwd(), "public", relativePath)
  return { path: `/${relativePath}`, exists: existsSync(diskPath) }
}

export async function GET() {
  const checks = {
    manifest: checkPublicFile("manifest.json"),
    customServiceWorker: checkPublicFile("custom-sw.js"),
    workboxServiceWorker: checkPublicFile("sw.js"),
    appleAppSiteAssociation: checkPublicFile(".well-known/apple-app-site-association"),
    assetLinks: checkPublicFile(".well-known/assetlinks.json"),
    iconsDir: { path: "/icons/", exists: existsSync(path.join(process.cwd(), "public", "icons")) },
    screenshotsDir: { path: "/screenshots/", exists: existsSync(path.join(process.cwd(), "public", "screenshots")) },
  }

  let manifestOk = false
  let manifestError: string | null = null
  try {
    const manifestPath = path.join(process.cwd(), "public", "manifest.json")
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { id?: string; name?: string }
    manifestOk = !!manifest?.name
    if (!manifestOk) manifestError = "Manifest missing required fields"
  } catch (err) {
    manifestError = err instanceof Error ? err.message : String(err)
  }

  const assetsOk =
    manifestOk && checks.customServiceWorker.exists && checks.iconsDir.exists && checks.screenshotsDir.exists
  const workboxOk = checks.workboxServiceWorker.exists
  const pwaOk = assetsOk && (env.NODE_ENV === "production" ? workboxOk : true)

  return Response.json({
    status: "ok",
    pwa: {
      ok: pwaOk,
      assetsOk,
      workboxOk,
      manifest: { ok: manifestOk, error: manifestError },
      checks,
    },
  })
}
