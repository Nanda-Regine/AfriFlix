import { Shimmer } from '@/components/ui/shimmer'

export default function CollabsLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <Shimmer className="h-10 w-48 rounded mb-8" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
