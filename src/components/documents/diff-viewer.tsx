import { diffWords } from "diff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

export function DiffViewer({ oldText, newText }: DiffViewerProps) {
  const differences = diffWords(oldText, newText);

  return (
    <Card className="flex flex-col border-white/10 bg-white/[0.02]">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-xl">Summary Comparison Diff</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-4">
        <ScrollArea className="flex-1 max-h-96 pr-4">
          <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {differences.map((part, index) => {
              const colorClass = part.added
                ? "bg-emerald-500/20 text-emerald-400"
                : part.removed
                ? "bg-red-500/20 text-red-400 line-through"
                : "text-muted-foreground";

              return (
                <span key={index} className={colorClass}>
                  {part.value}
                </span>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
