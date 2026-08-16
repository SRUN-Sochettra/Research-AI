import Link from "next/link";
import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background/50 relative border-t border-white/5 py-8">
      <div className="text-muted-foreground container flex flex-col items-center justify-between gap-4 px-4 text-xs sm:flex-row">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-lg transition-shadow group-hover:shadow-md group-hover:shadow-violet-500/30">
            <Brain className="h-3 w-3 text-white" />
          </div>
          <span className="text-foreground/70 group-hover:text-foreground font-semibold transition-colors">
            Mogger Research
          </span>
        </Link>

        <div className="text-muted-foreground/60 flex items-center gap-1">
          <span>Built as a portfolio project</span>
          <span className="mx-2">·</span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 4px rgba(52,211,153,0.7)" }}
            />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
