"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserRound } from "lucide-react";
import { BrandWordmark } from "@/components/layout/brand-mark";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  ["/dashboard", "Overview"],
  ["/documents", "Library"],
  ["/compare", "Compare"],
] as const;
export function Header() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const links = (
    <>
      {nav.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname.startsWith(href) ? "page" : undefined}
          className="text-muted-foreground hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:text-foreground border-b-2 border-transparent px-1 py-5 text-sm transition-colors"
        >
          {label}
        </Link>
      ))}
    </>
  );
  return (
    <header className="bg-background/95 sticky top-0 z-50 border-b">
      <div className="container flex h-16 items-center px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <BrandWordmark />
        </Link>
        {user && (
          <nav
            className="ml-10 hidden items-center gap-7 md:flex"
            aria-label="Primary"
          >
            {links}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!loading &&
            (user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:inline-flex"
                >
                  <Link href="/settings">
                    <UserRound />
                    Account
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut />
                  Sign out
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <nav className="mt-12 flex flex-col gap-1 px-4">
                      {links}
                    </nav>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Create account</Link>
                </Button>
              </>
            ))}
        </div>
      </div>
    </header>
  );
}
