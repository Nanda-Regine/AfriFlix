import { Shimmer } from '@/components/ui/shimmer'

export default function ExploreLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Shimmer className="h-8 w-40 rounded-lg mb-8" />
        <div className="flex gap-3 mb-8 overflow-hidden">
          {Array.from({ length: 9 }).map((_, i) => (
            <Shimmer key={i} className="h-9 w-24 rounded-pill flex-shrink-0" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="mb-12">
            <Shimmer className="h-6 w-48 rounded mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Shimmer className="aspect-[2/3] rounded-xl mb-2" />
                  <Shimmer className="h-4 w-3/4 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
