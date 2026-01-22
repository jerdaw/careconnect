export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const title = formData.get("title")
    const text = formData.get("text")
    const url = formData.get("url")

    const searchQuery =
      (typeof text === "string" && text) ||
      (typeof title === "string" && title) ||
      (typeof url === "string" && url) ||
      ""

    return Response.redirect(new URL(`/?q=${encodeURIComponent(searchQuery)}`, request.url), 303)
  } catch {
    return Response.redirect(new URL("/", request.url), 303)
  }
}
