import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RoomPageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {/* Alert skeleton */}
        <div className="mb-4">
          <Skeleton className="h-16 w-full" />
        </div>

        {/* Room Controls skeleton */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-8 flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Voting Area */}
          <div className="space-y-6 order-1">
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

            {/* Round History Table skeleton */}
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
          <Card className="order-2">
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

          {/* Settings Panel skeleton (mobile) */}
          <div className="order-3 lg:hidden">
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
