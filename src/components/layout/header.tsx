"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Brain,
  Sun,
  Moon,
  LogOut,
  FileText,

  Settings,
  ChevronDown,
} from "lucide-react";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Backdrop */}
      <div className="absolute inset-0 border-b border-white/5 bg-background/70 backdrop-blur-xl" />

      <div className="container relative flex h-16 items-center justify-between px-4">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-md shadow-violet-500/20 transition-all duration-200 group-hover:shadow-violet-500/40 group-hover:scale-105">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            Research{" "}
            <span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1.5">

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground"
          >
            <Sun className="h-[15px] w-[15px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[15px] w-[15px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="group flex h-8 items-center gap-2 rounded-xl px-2 text-muted-foreground transition-all hover:bg-white/6 hover:text-foreground data-[state=open]:bg-white/6"
                >
                  <Avatar className="h-6 w-6 ring-1 ring-violet-500/30 transition-all group-hover:ring-violet-500/50">
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-[10px] font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-xs font-medium sm:block">
                    {profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="glass-heavy w-56 rounded-xl border-white/8 p-1 shadow-xl shadow-black/30"
              >
                {/* User info */}
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <Avatar className="h-8 w-8 ring-1 ring-violet-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {profile?.full_name && (
                      <p className="truncate text-sm font-medium">
                        {profile.full_name}
                      </p>
                    )}
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1 bg-white/5" />

                <DropdownMenuItem asChild>
                  <Link
                    href="/documents"
                    className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  >
                    <FileText className="mr-2.5 h-4 w-4 text-violet-400" />
                    My Documents
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  >
                    <Settings className="mr-2.5 h-4 w-4 text-blue-400" />
                    Settings
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-white/5" />

                <DropdownMenuItem
                  onClick={signOut}
                  className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/8 hover:text-red-300 focus:text-red-300"
                >
                  <LogOut className="mr-2.5 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-white/6"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="h-8 bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 hover:scale-[1.02] transition-all animate-gradient"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}