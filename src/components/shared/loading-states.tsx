import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-lg" />
          <Loader2 className="relative h-10 w-10 animate-spin text-violet-400" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl border border-white/10 p-5">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl bg-white/5" />
        <Skeleton className="h-4 w-2/3 bg-white/5" />
      </div>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-3 w-1/2 bg-white/5" />
        <Skeleton className="h-3 w-1/3 bg-white/5" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg bg-white/5" />
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
        <Skeleton className="h-10 w-48 rounded-2xl bg-white/5" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-20 w-72 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <Loader2 className={`h-4 w-4 animate-spin text-violet-400 ${className}`} />
  );
}