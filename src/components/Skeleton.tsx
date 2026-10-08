interface SkeletonProps {
  lines?: number
  className?: string
}

export function Skeleton({ lines = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 w-full animate-pulse rounded-full bg-edu-soft/70"
          style={{ width: `${80 - (i % 3) * 15}%` }}
        />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-card border border-edu-soft bg-white p-5 shadow-soft">
      <div className="mb-4 h-5 w-1/3 animate-pulse rounded-full bg-edu-soft/70" />
      <Skeleton lines={4} />
    </div>
  )
}
