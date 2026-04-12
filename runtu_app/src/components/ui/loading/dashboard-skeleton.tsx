"use client";

function StatCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-white/10 rounded w-24" />
        <div className="w-10 h-10 bg-white/10 rounded-lg" />
      </div>
      <div className="h-8 bg-white/10 rounded w-20 mb-2" />
      <div className="h-3 bg-white/5 rounded w-32" />
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 animate-pulse">
      <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
      <div className="h-3 bg-white/5 rounded w-12" />
    </div>
  );
}

function QuickActionSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-24 mb-1" />
          <div className="h-3 bg-white/5 rounded w-32" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-white/10 rounded w-48 mb-2" />
        <div className="h-4 bg-white/5 rounded w-64" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity list */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="h-5 bg-white/10 rounded w-32 mb-4 animate-pulse" />
          <div className="divide-y divide-white/5">
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
            <ActivityItemSkeleton />
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="h-5 bg-white/10 rounded w-28 animate-pulse" />
          <QuickActionSkeleton />
          <QuickActionSkeleton />
          <QuickActionSkeleton />
        </div>
      </div>
    </div>
  );
}
