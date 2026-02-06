import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!url) {
  console.log("No URL found")
} else {
  try {
    const hostname = new URL(url).hostname
    console.log("Supabase Host:", hostname)
  } catch {
    console.log("Invalid URL:", url)
  }
}
