import { NextRequest, NextResponse } from "next/server"
import { getServiceById } from "@/lib/services"

// Format hours for display
function formatHours(hours: Record<string, { open: string; close: string }> | null | undefined): string {
  if (!hours) return "Contact for hours"

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const formatted = days.map((day, i) => {
    const h = hours[day]
    if (!h) return `${dayLabels[i]}: Closed`
    return `${dayLabels[i]}: ${h.open} - ${h.close}`
  })

  return formatted.join(" | ")
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await getServiceById(id)

  if (!service) {
    return new NextResponse("Service not found", { status: 404 })
  }

  const name = service.name
  const phone = service.phone || "Not available"
  const address = service.address || "Not available"
  const hoursText =
    service.hours_text || formatHours(service.hours as Record<string, { open: string; close: string }> | null)
  const eligibility = service.eligibility_notes || service.eligibility || "Contact for eligibility information"
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://kingstoncare.ca/service/${id}`)}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Resource Card: ${name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 0.5in;
    }
    h1 {
      font-size: 20pt;
      margin-bottom: 0.5em;
      border-bottom: 2px solid #000;
      padding-bottom: 0.25em;
    }
    .field {
      margin-bottom: 0.75em;
    }
    .label {
      font-weight: bold;
      display: block;
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #333;
    }
    .value {
      font-size: 14pt;
    }
    .footer {
      margin-top: 1.5em;
      padding-top: 0.5em;
      border-top: 1px solid #ccc;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .qr-container {
      text-align: right;
    }
    .qr-container img {
      width: 80px;
      height: 80px;
    }
    .qr-label {
      font-size: 9pt;
      color: #666;
    }
    .source {
      font-size: 10pt;
      color: #666;
    }
    .no-print {
      margin-top: 2em;
      text-align: center;
    }
    .no-print button {
      font-size: 14pt;
      padding: 0.5em 1.5em;
      cursor: pointer;
      background: #0066cc;
      color: #fff;
      border: none;
      border-radius: 4px;
    }
    .no-print button:hover {
      background: #0055aa;
    }
    @media print {
      @page {
        margin: 0.5in;
        size: letter;
      }
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <h1>${name}</h1>
  
  <div class="field">
    <span class="label">Phone</span>
    <span class="value">${phone}</span>
  </div>
  
  <div class="field">
    <span class="label">Address</span>
    <span class="value">${address}</span>
  </div>
  
  <div class="field">
    <span class="label">Hours</span>
    <span class="value">${hoursText}</span>
  </div>
  
  <div class="field">
    <span class="label">Eligibility</span>
    <span class="value">${eligibility}</span>
  </div>
  
  <div class="footer">
    <div class="source">
      Source: Kingston Care Connect<br>
      kingstoncare.ca
    </div>
    <div class="qr-container">
      <img src="${qrCodeUrl}" alt="QR code to service page">
      <div class="qr-label">Scan for details</div>
    </div>
  </div>
  
  <div class="no-print">
    <button onclick="window.print()">Print This Card</button>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
