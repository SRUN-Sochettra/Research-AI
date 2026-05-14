import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <Skeleton className="mb-4 h-4 w-3/4" />
      <Skeleton className="mb-2 h-3 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
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
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-20 w-72 rounded-2xl" />
      </div>
    </div>
  );
}

export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <Loader2
      className={`h-4 w-4 animate-spin text-muted-foreground ${className}`}
    />
  );
}