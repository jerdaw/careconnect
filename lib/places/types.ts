import type { PlaceId } from "@/types/service"

export type PlaceStatus = "live" | "preview" | "hidden"

export interface PlaceBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface SupportedPlace {
  id: PlaceId
  name: string
  province: "Ontario"
  country: "Canada"
  status: PlaceStatus
  heroLabel: string
  serviceLabel: string
  centroid: {
    lat: number
    lng: number
  }
  bounds: PlaceBounds
}
