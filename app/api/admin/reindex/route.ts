import { NextResponse } from "next/server"
// We re-use logic from our scripts, but we must be careful about imports in Next.js Server Actions/Routes
// Ideally we would import the pipeline logic. For MVP, we can spawn the script or replicate the logic.
// Spawning is safer to avoid pollution.
import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Admin access disabled in production" }, { status: 403 })
  }

  try {
    // Run the existing script
    // Note: This relies on the system having the environment set up correctly
    await execPromise("npm run generate-embeddings")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to reindex" }, { status: 500 })
  }
}
