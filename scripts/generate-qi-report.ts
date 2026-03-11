#!/usr/bin/env npx tsx
/**
 * Quarterly Impact (QI) Report Generator
 *
 * This script queries the feedback table and generates a markdown report
 * with key metrics for public transparency reporting.
 *
 * Usage: npx tsx scripts/generate-qi-report.ts
 * Output: docs/reports/qi-report-YYYY-QN.md
 */

import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables")
  console.error("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Calculate quarter from date
function getQuarter(date: Date): string {
  const month = date.getMonth()
  const year = date.getFullYear()
  const quarter = Math.floor(month / 3) + 1
  return `${year}-Q${quarter}`
}

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

async function generateReport() {
  const now = new Date()
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  console.log("📊 Generating QI Report...")
  console.log(`   Period: ${formatDate(ninetyDaysAgo)} to ${formatDate(now)}`)

  // 1. Total feedback count
  const { count: totalFeedback } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .gte("created_at", ninetyDaysAgo.toISOString())

  // 2. Helpful ratings
  const { count: helpfulYes } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("feedback_type", "helpful_yes")
    .gte("created_at", ninetyDaysAgo.toISOString())

  const { count: helpfulNo } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("feedback_type", "helpful_no")
    .gte("created_at", ninetyDaysAgo.toISOString())

  const totalHelpful = (helpfulYes || 0) + (helpfulNo || 0)
  const helpfulRate = totalHelpful > 0 ? Math.round(((helpfulYes || 0) / totalHelpful) * 100) : 0

  // 3. Issue reports
  const { count: totalIssues } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("feedback_type", "issue")
    .gte("created_at", ninetyDaysAgo.toISOString())

  const { count: resolvedIssues } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("feedback_type", "issue")
    .eq("status", "resolved")
    .gte("created_at", ninetyDaysAgo.toISOString())

  const resolutionRate = (totalIssues || 0) > 0 ? Math.round(((resolvedIssues || 0) / (totalIssues || 1)) * 100) : 0

  // 4. Top services with issues
  const { data: topIssueServices } = await supabase
    .from("feedback")
    .select("service_id, services(name)")
    .eq("feedback_type", "issue")
    .eq("status", "pending")
    .gte("created_at", ninetyDaysAgo.toISOString())
    .limit(100)

  // Count by service
  const serviceCounts: Record<string, { name: string; count: number }> = {}
  for (const item of topIssueServices || []) {
    const id = item.service_id || "unknown"
    const name = (item.services as { name?: string })?.name || id
    if (!serviceCounts[id]) {
      serviceCounts[id] = { name, count: 0 }
    }
    serviceCounts[id].count++
  }
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  // 5. Unmet needs (not_found feedback)
  const { data: unmetNeeds } = await supabase
    .from("feedback")
    .select("category_searched")
    .eq("feedback_type", "not_found")
    .not("category_searched", "is", null)
    .gte("created_at", ninetyDaysAgo.toISOString())

  // Count by category
  const categoryCounts: Record<string, number> = {}
  for (const item of unmetNeeds || []) {
    const cat = item.category_searched || "Other"
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  }
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // 6. Service verification stats
  const { count: totalServices } = await supabase.from("services").select("*", { count: "exact", head: true })

  const { count: verifiedRecently } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .gte("last_verified", ninetyDaysAgo.toISOString())

  const verificationRate =
    (totalServices || 0) > 0 ? Math.round(((verifiedRecently || 0) / (totalServices || 1)) * 100) : 0

  // Generate report content
  const quarter = getQuarter(now)
  const reportContent = `# HelpBridge - Quality Improvement Report

**Report Period**: ${formatDate(ninetyDaysAgo)} to ${formatDate(now)}
**Generated**: ${formatDate(now)}
**Quarter**: ${quarter}

---

## Executive Summary

This report provides transparency into how HelpBridge is serving the community and where we can improve. All metrics are collected without tracking individual users.

---

## Key Metrics

### User Satisfaction
- **${helpfulRate}%** of users found the information helpful
- Based on ${totalHelpful} feedback responses

### Issue Resolution
- **${resolvedIssues || 0}** issues resolved out of ${totalIssues || 0} reported
- **${resolutionRate}%** resolution rate

### Data Quality
- **${verifiedRecently || 0}** services verified in the last 90 days
- **${verificationRate}%** of services have recent verification

### Community Engagement
- **${totalFeedback || 0}** total feedback submissions this quarter

---

## Top Services Needing Attention

${
  topServices.length > 0
    ? topServices
        .map(([, data], i) => `${i + 1}. **${data.name}** - ${data.count} open issue${data.count > 1 ? "s" : ""}`)
        .join("\n")
    : "_No open issues reported_"
}

---

## Unmet Community Needs

These are the service categories users searched for but couldn't find:

${
  topCategories.length > 0
    ? topCategories
        .map(([category, count], i) => `${i + 1}. **${category}** - ${count} request${count > 1 ? "s" : ""}`)
        .join("\n")
    : "_No unmet needs reported_"
}

---

## Privacy Note

This report was generated using aggregated, anonymous data only. We do not track individual users, store IP addresses, or use cookies for analytics. All feedback is voluntary and cannot be linked to any individual.

---

## Actions Taken

_This section will be updated manually with specific improvements made based on this data._

- [ ] Review and update services with open issues
- [ ] Research unmet need categories for potential service additions
- [ ] Contact service providers for verification updates

---

*Report generated automatically by HelpBridge*
`

  // Write report
  const filename = `qi-report-${quarter}.md`
  const outputPath = path.join(process.cwd(), "docs", "reports", filename)

  fs.writeFileSync(outputPath, reportContent)

  console.log(`\n✅ Report generated: ${outputPath}`)
  console.log(`\n📈 Summary:`)
  console.log(`   Helpful Rate: ${helpfulRate}%`)
  console.log(`   Issues Resolved: ${resolvedIssues || 0}/${totalIssues || 0}`)
  console.log(`   Services Verified: ${verifiedRecently || 0}/${totalServices || 0}`)
  console.log(`   Total Feedback: ${totalFeedback || 0}`)
}

generateReport().catch((err) => {
  console.error("❌ Error generating report:", err)
  process.exit(1)
})
