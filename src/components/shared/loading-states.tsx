import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center">
          <Loader2 className="text-primary h-10 w-10 animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card border-border animate-pulse rounded-md border p-5">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="bg-muted h-10 w-10 rounded-md" />
        <Skeleton className="bg-muted h-4 w-2/3" />
      </div>
      <div className="mb-4 space-y-2">
        <Skeleton className="bg-muted h-3 w-1/2" />
        <Skeleton className="bg-muted h-3 w-1/3" />
      </div>
      <Skeleton className="bg-muted h-8 w-full rounded-lg" />
    </div>
  );
}

export function DocumentListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-end">
        <Skeleton className="bg-muted h-10 w-48 rounded-md" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="bg-muted h-20 w-72 rounded-md" />
      </div>
    </div>
  );
}

export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <Loader2 className={`text-primary h-4 w-4 animate-spin ${className}`} />
  );
}
