"use client";

function FileCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
      {/* Header with icon and menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-11 h-11 bg-white/10 rounded-lg" />
        <div className="w-6 h-6 bg-white/5 rounded-lg" />
      </div>

      {/* File name */}
      <div className="h-5 bg-white/10 rounded-lg w-3/4 mb-2" />

      {/* Meta info */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 bg-white/5 rounded w-12" />
        <div className="w-1 h-1 bg-white/10 rounded-full" />
        <div className="h-3 bg-white/5 rounded w-16" />
      </div>

      {/* Status badge */}
      <div className="h-5 bg-white/10 rounded-full w-20" />
    </div>
  );
}

function FileRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-40" />
            <div className="h-3 bg-white/5 rounded w-24" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-white/5 rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-white/5 rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 bg-white/10 rounded-full w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="w-6 h-6 bg-white/5 rounded-lg" />
      </td>
    </tr>
  );
}

interface FileListSkeletonProps {
  count?: number;
  view?: "grid" | "table";
}

export function FileListSkeleton({ count = 5, view = "grid" }: FileListSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (view === "table") {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left">
                <div className="h-3 bg-white/10 rounded w-16 animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 bg-white/10 rounded w-12 animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 bg-white/10 rounded w-10 animate-pulse" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-3 bg-white/10 rounded w-14 animate-pulse" />
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((i) => (
              <FileRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <FileCardSkeleton key={i} />
      ))}
    </div>
  );
}
