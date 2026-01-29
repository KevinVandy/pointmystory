import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RoomPageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 pt-6 pb-100">
        {/* Alert skeleton */}
        <div className="mb-4">
          <Skeleton className="h-16 w-full" />
        </div>

        {/* Room Controls skeleton */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col items-center lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Room name */}
            <div className="flex-1 min-w-0 w-full lg:w-auto">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
            {/* Participant type toggle */}
            <div className="flex items-center justify-center lg:flex-1">
              <Skeleton className="h-10 w-32" />
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 justify-center lg:flex-1 lg:justify-end">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          {/* Left Column - Voting Card and Round History (stacked on desktop) */}
          <div className="flex-1 flex flex-col gap-6 order-1 lg:order-1">
            {/* Voting Card skeleton */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-6">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-6 w-48 mx-auto mb-6" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Round History Table skeleton - hidden on mobile (shown below participants via order-3) */}
            <div className="hidden lg:block">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <div className="overflow-hidden rounded-md border">
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel skeleton (desktop) */}
            <div className="hidden lg:block">
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Participants Sidebar */}
          <Card className="order-2 lg:order-2 lg:w-[360px] lg:shrink-0">
            <CardContent className="pt-6">
              <div className="space-y-4 -mt-6">
                {/* Timer skeleton */}
                <div className="flex flex-col gap-2 pb-3 border-b min-h-[48px]">
                  <Skeleton className="h-12 w-full" />
                </div>

                {/* Buttons skeleton */}
                <div className="flex gap-2 flex-wrap justify-center pb-3 border-b">
                  <Skeleton className="h-10 w-32" />
                </div>

                {/* Participants skeleton */}
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Round History Table skeleton - below participants on mobile */}
          <div className="order-3 lg:hidden">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <div className="overflow-hidden rounded-md border">
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel skeleton (mobile) */}
          <div className="order-4 lg:hidden">
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
