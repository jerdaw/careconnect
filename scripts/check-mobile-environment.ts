import { execSync } from "child_process"
import fs from "fs"
import path from "path"

/**
 * Validates the environment for mobile development.
 * Prevent developers from running mobile scripts if dependencies are missing.
 */
function checkMobileEnvironment() {
  console.log("Checking mobile environment...")

  // 1. Check for Capacitor Config
  if (!fs.existsSync(path.join(process.cwd(), "capacitor.config.ts"))) {
    console.error("Error: capacitor.config.ts not found. Mobile infrastructure may be incomplete.")
    process.exit(1)
  }

  // 2. Check for Capacitor CLI
  try {
    execSync("npx cap --version", { stdio: "ignore" })
  } catch {
    console.error("Error: Capacitor CLI (npx cap) is not available.")
    process.exit(1)
  }

  // 3. Roadmap Reminder (v15.1 is paused)
  console.log("\n--- NOTE ---")
  console.log("Mobile App development (v15.1) is currently PAUSED pending user approval.")
  console.log("Building for mobile requires macOS (for iOS) or Android Studio (for Android).")
  console.log("See docs/roadmaps/roadmap.md for details.")
  console.log("------------\n")

  // Check for Android/iOS folders
  const hasAndroid = fs.existsSync(path.join(process.cwd(), "android"))
  const hasIos = fs.existsSync(path.join(process.cwd(), "ios"))

  if (!hasAndroid && !hasIos) {
    console.warn("Warning: No native platforms (android/ios) detected. Run 'npx cap add android' or 'npx cap add ios' first.")
  }

  console.log("Environment check passed (infrastructure only). Proceeding...\n")
}

checkMobileEnvironment()
