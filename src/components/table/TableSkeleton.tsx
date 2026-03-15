export default function TableSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="h-9 rounded-md bg-zinc-100" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 rounded-md bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}

