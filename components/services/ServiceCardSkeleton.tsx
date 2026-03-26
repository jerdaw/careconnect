import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

const ServiceCardSkeleton = () => {
  return (
    <Card className="h-full p-6">
      <div className="flex items-start gap-4">
        {/* Icon Skeleton */}
        <Skeleton className="h-12 w-12 rounded-xl" />

        <div className="flex-1 space-y-2">
          {/* Title and Badge */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          {/* Category Badge */}
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Address */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Tags */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  )
}

export default ServiceCardSkeleton
