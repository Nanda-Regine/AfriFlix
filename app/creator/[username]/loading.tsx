import { Shimmer } from '@/components/ui/shimmer'

export default function CreatorLoading() {
  return (
    <div className="min-h-screen">
      <Shimmer className="w-full h-56" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end gap-5 -mt-14 mb-8">
          <Shimmer className="w-28 h-28 rounded-full flex-shrink-0" />
          <div className="flex-1 pb-2">
            <Shimmer className="h-8 w-48 rounded mb-2" />
            <Shimmer className="h-4 w-32 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <Shimmer className="aspect-[2/3] rounded-xl mb-2" />
              <Shimmer className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
