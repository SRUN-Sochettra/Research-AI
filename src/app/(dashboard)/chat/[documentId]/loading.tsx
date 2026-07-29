import { ChatSkeleton } from "@/components/shared/loading-states";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Chat skeleton */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Sidebar skeleton */}
        <Skeleton className="hidden h-full w-64 rounded-lg md:block" />

        {/* Messages skeleton */}
        <div className="flex-1 rounded-lg border">
          <ChatSkeleton />
        </div>
      </div>
    </div>
  );
}
