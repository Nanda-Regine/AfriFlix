import { Shimmer } from '@/components/ui/shimmer'

export default function WorkLoading() {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <div>
            <Shimmer className="w-full aspect-video rounded-2xl mb-6" />
            <Shimmer className="h-8 w-3/4 rounded mb-3" />
            <Shimmer className="h-4 w-full rounded mb-2" />
            <Shimmer className="h-4 w-5/6 rounded mb-6" />
            <div className="flex gap-4">
              <Shimmer className="h-6 w-24 rounded" />
              <Shimmer className="h-6 w-20 rounded" />
              <Shimmer className="h-6 w-16 rounded" />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <Shimmer className="h-40 rounded-xl" />
            <Shimmer className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
