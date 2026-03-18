import { Shimmer } from '@/components/ui/shimmer'

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Shimmer className="h-8 w-56 rounded mb-2" />
          <Shimmer className="h-4 w-40 rounded" />
        </div>
        <Shimmer className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Shimmer className="aspect-[2/3] rounded-xl mb-2" />
            <Shimmer className="h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
