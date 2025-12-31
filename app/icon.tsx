import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const size = {
  width: 512,
  height: 512,
}
export const contentType = "image/png"

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 320,
          background: "#2563eb", // blue-600
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "50px", // Rounded square like iOS
        }}
      >
        K
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
