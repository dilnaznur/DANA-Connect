import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function MentorCardSkeleton() {
  return (
    <Card className="bg-white border border-[var(--border)] rounded-2xl">
      <CardContent className="p-6 flex flex-col items-center">
        <Skeleton className="w-16 h-16 rounded-full mb-4" />
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </CardContent>
    </Card>
  )
}

export function OpportunityCardSkeleton() {
  return (
    <Card className="bg-white border border-[var(--border)] rounded-2xl">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ApplicationCardSkeleton() {
  return (
    <Card className="bg-white border border-[var(--border)] rounded-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48 mb-3" />
        <div className="bg-hero rounded-lg p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="text-center">
      <Skeleton className="h-12 w-20 mx-auto mb-2" />
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
  )
}
