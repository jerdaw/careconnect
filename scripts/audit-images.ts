import { chromium } from "playwright"

/**
 * Audit all images across the application to identify missing alt text
 * Usage: npx tsx scripts/audit-images.ts
 */

interface ImageAuditResult {
  src: string
  alt: string | null
  ariaLabel: string | null
  isDecorative: boolean
  visible: boolean
  page: string
}

async function auditImages() {
  const browser = await chromium.launch()
  const context = await browser.newBrowserContext()
  const page = await context.newPage()

  const routes = [
    "/en",
    "/en?q=health",
    "/en/service/kids-help-phone",
    "/en/dashboard",
    "/en/submit-service",
    "/en/about",
    "/en/accessibility",
  ]

  let totalImages = 0
  let missingAlt = 0
  const violations: { route: string; images: ImageAuditResult[] }[] = []

  console.log("🔍 Starting image accessibility audit...\n")

  for (const route of routes) {
    try {
      await page.goto(`http://localhost:3000${route}`, {
        waitUntil: "networkidle",
        timeout: 10000,
      })

      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("img")).map((img) => ({
          src: img.src,
          alt: img.alt,
          ariaLabel: img.getAttribute("aria-label"),
          isDecorative: img.getAttribute("role") === "presentation" || img.getAttribute("aria-hidden") === "true",
          visible: img.offsetParent !== null,
        }))
      })

      const pageViolations: ImageAuditResult[] = []

      images.forEach((img) => {
        totalImages++

        // Check for missing alt text
        if (!img.alt && !img.ariaLabel && !img.isDecorative && img.visible) {
          missingAlt++
          pageViolations.push({
            ...img,
            page: route,
          })
        }
      })

      if (pageViolations.length > 0) {
        violations.push({
          route,
          images: pageViolations,
        })
      }

      console.log(`✓ ${route}: ${images.length} images, ${pageViolations.length} violations`)
    } catch (error) {
      console.error(`✗ Failed to audit ${route}:`, error)
    }
  }

  await browser.close()

  // Print summary
  console.log("\n" + "=".repeat(60))
  console.log(`📊 AUDIT SUMMARY`)
  console.log("=".repeat(60))
  console.log(`Total images scanned: ${totalImages}`)
  console.log(`Images missing alt text: ${missingAlt}`)
  console.log(`Compliance rate: ${((1 - missingAlt / totalImages) * 100).toFixed(1)}%\n`)

  // Print violations
  if (violations.length > 0) {
    console.log("❌ VIOLATIONS FOUND:\n")
    violations.forEach(({ route, images }) => {
      console.log(`Route: ${route}`)
      images.forEach((img) => {
        console.log(`  ✗ MISSING ALT: ${img.src}`)
      })
      console.log()
    })

    console.log("💡 FIX: Add alt text to these images:")
    console.log('   - Decorative images: alt="" aria-hidden="true"')
    console.log('   - Functional images: alt="[action]" (e.g., "Search", "Close")')
    console.log('   - Informational images: alt="[description]" (e.g., "Service location photo")\n')
  } else {
    console.log("✅ No violations found! All images have appropriate alt text.\n")
  }

  // Exit with error code if violations found
  process.exit(missingAlt > 0 ? 1 : 0)
}

auditImages().catch((error) => {
  console.error("Fatal error during audit:", error)
  process.exit(1)
})
