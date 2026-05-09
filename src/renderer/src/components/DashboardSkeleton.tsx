// src/renderer/src/components/DashboardSkeleton.tsx

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Dashboard wordt geladen...</span>
      {Array.from({ length: 2 }).map((_, sectionIdx) => (
        <section key={sectionIdx}>
          <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, cardIdx) => (
              <div key={cardIdx} className="h-28 rounded-xl border border-gray-200 bg-gray-50" />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
