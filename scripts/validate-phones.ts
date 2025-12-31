#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"
import "dotenv/config"

interface Service {
  id: string
  name: string
  phone?: string
}

interface PhoneValidationResult {
  serviceId: string
  serviceName: string
  phone: string
  isValid: boolean
  carrier?: string
  type?: string
  errorMessage?: string
}

const SERVICES_PATH = path.join(process.cwd(), "data/services.json")
const REPORT_PATH = path.join(process.cwd(), "data/phone-validation-report.json")

// Colors for console output
const RED = "\x1b[31m"
const GREEN = "\x1b[32m"
const YELLOW = "\x1b[33m"
const RESET = "\x1b[0m"

async function validatePhone(phone: string): Promise<Partial<PhoneValidationResult>> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return { isValid: true, errorMessage: "Twilio credentials not configured (skipped)" }
  }

  try {
    const cleanPhone = phone.replace(/\D/g, "")
    // Handle 10-digit Canadian/US numbers or those already starting with +1
    const e164 =
      cleanPhone.length === 11 && cleanPhone.startsWith("1")
        ? `+${cleanPhone}`
        : cleanPhone.length === 10
        ? `+1${cleanPhone}`
        : `+${cleanPhone}`

    const response = await fetch(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164)}?Fields=line_type_intelligence`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return { isValid: false, errorMessage: "Phone number not found" }
      }
      throw new Error(`Twilio API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      valid: boolean
      line_type_intelligence?: { carrier_name?: string; type?: string }
    }
    return {
      isValid: data.valid,
      carrier: data.line_type_intelligence?.carrier_name,
      type: data.line_type_intelligence?.type,
    }
  } catch (error) {
    return {
      isValid: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

async function main() {
  console.log(`${YELLOW}📞 Running phone validation...${RESET}\n`)

  if (!existsSync(SERVICES_PATH)) {
    console.error(`${RED}❌ Services file not found at ${SERVICES_PATH}${RESET}`)
    process.exit(1)
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    console.log(`${YELLOW}⚠️  TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not found in environment.${RESET}`)
    console.log(`${YELLOW}   This script will run in DRY-RUN mode (reporting all numbers as valid).${RESET}\n`)
  }

  const services: Service[] = JSON.parse(readFileSync(SERVICES_PATH, "utf-8")) as Service[]
  const servicesWithPhones = services.filter((s) => s.phone)

  console.log(`Found ${servicesWithPhones.length} services with phone numbers\n`)

  const results: PhoneValidationResult[] = []
  let checked = 0

  for (const service of servicesWithPhones) {
    const result = await validatePhone(service.phone!)
    results.push({
      serviceId: service.id,
      serviceName: service.name,
      phone: service.phone!,
      isValid: result.isValid ?? false,
      ...result,
    })

    checked++
    const statusIcon = result.isValid ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`
    const info = result.type ? ` (${result.type}${result.carrier ? ` - ${result.carrier}` : ""})` : ""

    console.log(
      `${statusIcon} [${checked}/${servicesWithPhones.length}] ${service.name}: ${service.phone}${info}${
        result.errorMessage ? ` - ${result.errorMessage}` : ""
      }`
    )

    // Rate limiting: 200ms between requests if using real API
    if (accountSid && authToken && checked < servicesWithPhones.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  const valid = results.filter((r) => r.isValid)
  const invalid = results.filter((r) => !r.isValid)

  console.log(`\n${YELLOW}📊 Results Summary:${RESET}\n`)
  console.log(`  ${GREEN}✅ Valid:${RESET} ${valid.length}`)
  console.log(`  ${RED}❌ Invalid:${RESET} ${invalid.length}`)

  writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        summary: { total: results.length, valid: valid.length, invalid: invalid.length },
        invalid,
      },
      null,
      2
    )
  )

  console.log(`\n📝 Report saved to: ${REPORT_PATH}`)
}

main().catch((err) => {
  console.error(`${RED}Fatal error: ${err.message}${RESET}`)
  process.exit(1)
})
