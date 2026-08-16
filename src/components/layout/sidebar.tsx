"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  LayoutDashboard,
  Settings,
  ChevronRight,
  GitCompare,
  Layers,
} from "lucide-react";

const navItems = [
  {
    href: "/chat/multi",
    label: "Multi-doc Chat",
    icon: Layers,
    description: "Chat across PDFs",
  },
  {
    href: "/compare",
    label: "Compare",
    icon: GitCompare,
    description: "Diff two PDFs",
  },
  {
    href: "/documents",
    label: "Documents",
    icon: FileText,
    description: "Your uploaded PDFs",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & activity",
  },
];

const bottomItems = [
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-background/50 border-border flex h-full w-64 flex-col border-r">
      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 p-3">
        <p className="text-muted-foreground mb-2 px-3 text-[10px] font-semibold tracking-[0.15em] uppercase">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              {/* Active indicator */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
                  isActive
                    ? "bg-primary shadow-md shadow-black/15"
                    : "bg-muted/40 group-hover:bg-muted/70"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="leading-none font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-muted-foreground/70 mt-0.5 truncate text-[11px]">
                    {item.description}
                  </div>
                )}
              </div>

              {isActive && (
                <ChevronRight className="text-primary h-3 w-3 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-border border-t p-3">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all",
                isActive
                  ? "text-foreground bg-muted/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <div className="bg-muted/40 group-hover:bg-muted/70 flex h-7 w-7 items-center justify-center rounded-lg transition-colors">
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export default Sidebar;
