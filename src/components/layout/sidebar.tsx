"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  MessageSquare,
  LayoutDashboard,
  Settings,
  ChevronRight,
} from "lucide-react";

const navItems = [
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
    <aside className="flex h-full w-64 flex-col border-r border-white/5 bg-background/50 backdrop-blur-xl">

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
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
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                isActive
                  ? "bg-violet-500/10 text-violet-300 shadow-sm"
                  : "text-muted-foreground hover:bg-white/4 hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
                  isActive
                    ? "bg-gradient-to-br from-violet-600 to-blue-600 shadow-md shadow-violet-500/20"
                    : "bg-white/4 group-hover:bg-white/7"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-medium leading-none">{item.label}</div>
                {item.description && (
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                    {item.description}
                  </div>
                )}
              </div>

              {isActive && (
                <ChevronRight className="h-3 w-3 text-violet-400 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/5 p-3">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                isActive
                  ? "bg-white/6 text-foreground"
                  : "text-muted-foreground hover:bg-white/4 hover:text-foreground"
              )}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/4 transition-colors group-hover:bg-white/7">
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