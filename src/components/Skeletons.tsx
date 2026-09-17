// Reusable skeleton primitives

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-rio-border animate-pulse rounded-xl ${className}`} />
  );
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-rio-border animate-pulse rounded-md ${className}`} />
  );
}

// Product card skeleton for 2-column grid
export function ProductCardSkeleton() {
  return (
    <div className="bg-rio-surface rounded-2xl overflow-hidden border border-rio-border shadow-sm flex flex-col">
      <div className="aspect-[9/16] bg-rio-border animate-pulse" />
      <div className="p-3.5 space-y-2.5 flex flex-col flex-1">
        <SkeletonText className="h-3 w-14" />
        <SkeletonText className="h-4 w-full" />
        <SkeletonText className="h-4 w-3/4" />
        <div className="mt-auto pt-2 flex gap-2">
          <SkeletonBox className="h-9 flex-1" />
          <SkeletonBox className="h-9 w-9 shrink-0" />
        </div>
      </div>
    </div>
  );
}

// Search result row skeleton
export function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3.5 bg-rio-surface p-3.5 rounded-2xl border border-rio-border shadow-sm">
      <SkeletonBox className="h-16 w-16 shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="h-3 w-12" />
        <SkeletonText className="h-4 w-3/4" />
        <SkeletonText className="h-4 w-20" />
      </div>
      <SkeletonBox className="h-8 w-20 shrink-0" />
    </div>
  );
}

// Cart item skeleton
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 bg-rio-surface p-3.5 rounded-2xl border border-rio-border shadow-sm">
      <SkeletonBox className="h-20 w-20 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <SkeletonText className="h-3 w-14" />
        <SkeletonText className="h-4 w-full" />
        <SkeletonText className="h-4 w-20" />
        <div className="flex justify-between items-center pt-1">
          <SkeletonBox className="h-8 w-28" />
          <SkeletonText className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

// Admin order row skeleton (for table)
export function OrderRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-4"><SkeletonText className="h-4 w-20" /></td>
      <td className="px-6 py-4"><SkeletonText className="h-4 w-32" /></td>
      <td className="px-6 py-4"><SkeletonText className="h-4 w-24" /></td>
      <td className="px-6 py-4"><SkeletonBox className="h-5 w-20 rounded-md" /></td>
      <td className="px-6 py-4"><SkeletonText className="h-4 w-12" /></td>
      <td className="px-6 py-4 text-right"><SkeletonText className="h-4 w-16 ml-auto" /></td>
    </tr>
  );
}

// Admin stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="bg-rio-surface p-4 md:p-5 rounded-2xl border border-rio-border shadow-sm flex flex-col justify-between min-h-[100px]">
      <div className="flex justify-between items-start">
        <SkeletonText className="h-3 w-20" />
        <SkeletonBox className="w-8 h-8 rounded-xl shrink-0" />
      </div>
      <SkeletonText className="h-9 w-10 mt-3" />
    </div>
  );
}

// Admin mobile order card skeleton
export function OrderCardSkeleton() {
  return (
    <div className="flex items-center justify-between bg-rio-surface p-4 rounded-2xl border border-rio-border shadow-sm">
      <div className="flex-1 space-y-2">
        <SkeletonText className="h-4 w-24" />
        <SkeletonText className="h-3 w-40" />
        <SkeletonBox className="h-5 w-20 rounded-md mt-1" />
      </div>
      <SkeletonBox className="h-4 w-4 shrink-0 ml-3 rounded-full" />
    </div>
  );
}

// Welcome banner skeleton
export function WelcomeBannerSkeleton() {
  return (
    <div className="bg-rio-surface border border-rio-border rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm">
      <div className="space-y-2">
        <SkeletonText className="h-3 w-28" />
        <SkeletonText className="h-4 w-40" />
      </div>
      <SkeletonBox className="h-14 w-14 rounded-xl shrink-0" />
    </div>
  );
}
