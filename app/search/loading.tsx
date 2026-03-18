import { Shimmer } from '@/components/ui/shimmer'

export default function SearchLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Shimmer className="h-10 w-64 rounded-xl mb-10" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <Shimmer className="aspect-[2/3] rounded-xl mb-2" />
              <Shimmer className="h-4 w-3/4 rounded mb-1" />
              <Shimmer className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
