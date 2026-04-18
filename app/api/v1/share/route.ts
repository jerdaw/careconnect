import { NextResponse } from "next/server"
import {
  selectShareTargetQuery,
  serializeShareTargetPayload,
  SHARE_TARGET_QUERY_COOKIE_MAX_AGE_SECONDS,
  SHARE_TARGET_QUERY_COOKIE_NAME,
} from "@/lib/share-target"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const searchQuery = selectShareTargetQuery({
      text: formData.get("text"),
      title: formData.get("title"),
      url: formData.get("url"),
    })

    const response = NextResponse.redirect(new URL("/", request.url), 303)
    response.headers.set("Cache-Control", "no-store")

    if (searchQuery) {
      response.cookies.set({
        name: SHARE_TARGET_QUERY_COOKIE_NAME,
        value: serializeShareTargetPayload({ query: searchQuery }),
        maxAge: SHARE_TARGET_QUERY_COOKIE_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    return response
  } catch {
    const response = NextResponse.redirect(new URL("/", request.url), 303)
    response.headers.set("Cache-Control", "no-store")
    return response
  }
}
