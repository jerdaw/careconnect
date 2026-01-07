import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load env vars
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !anonKey) {
  console.error("❌ Missing Supabase credentials. Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local")
  process.exit(1)
}

// Anon client (simulates public user)
const supabase = createClient(supabaseUrl, anonKey)

async function verifyRLS() {
  console.log("🔒 Verifying RLS Policies for v13.0 Librarian Model...")

  // Test 1: Direct Table Access (Should FAIL or be Empty)
  console.log("\n1. Testing Direct Table Access (services)...")
  const { data: tableData, error: tableError } = await supabase.from("services").select("*").limit(1)
  
  if (tableError) {
    console.log("✅ Success: Direct access blocked (" + tableError.message + ")")
  } else if (!tableData || tableData.length === 0) {
    console.log("✅ Success: Direct access returned no rows (RLS applied).")
  } else {
    console.error("❌ FAILURE: Direct access returned data! RLS is NOT working.")
    console.error("   Leaked ID:", tableData[0].id)
    process.exit(1)
  }

  // Test 2: View Access (Should SUCCEED)
  console.log("\n2. Testing Public View Access (services_public)...")
  const { data: viewData, error: viewError } = await supabase.from("services_public").select("*").limit(1)

  if (viewError) {
    console.error("❌ FAILURE: Public view blocked.", viewError.message)
    process.exit(1)
  }

  if (viewData && viewData.length > 0) {
    const row = viewData[0]
    if (row.embedding || row.internal_notes) {
      console.error("❌ FAILURE: View leaked internal columns (embedding/notes)!")
      process.exit(1)
    }
    console.log(`✅ Success: Public view returned data (${viewData.length} row).`)
    console.log("   Columns visible:", Object.keys(row).join(", "))
  } else {
    console.warn("⚠️ Warning: Public view returned no rows (Data might be empty or unpublished).")
  }

  console.log("\n🎉 Verification Complete: Public/Private boundary is enforced.")
}

verifyRLS()
