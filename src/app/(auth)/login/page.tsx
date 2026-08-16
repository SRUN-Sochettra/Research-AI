"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = await signInWithEmail(email, password);
    if (r.error) setError(r.error);
    setBusy(false);
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex flex-col justify-between border-r p-6 sm:p-10">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center">
            <BookOpenText className="size-4" />
          </span>
          Mogger Research
        </Link>
        <div className="hidden lg:block">
          <p className="eyebrow">A quieter way to research</p>
          <p className="display-serif mt-5 max-w-lg text-5xl leading-[1.02]">
            Return to your sources, not another noisy dashboard.
          </p>
        </div>
        <p className="text-muted-foreground hidden text-xs lg:block">
          Source-grounded PDF research
        </p>
      </section>
      <section className="grid place-items-center px-5 py-12">
        <div className="w-full max-w-sm">
          <p className="eyebrow">Workspace access</p>
          <h1 className="display-serif mt-3 text-5xl">Welcome back.</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Sign in to continue your research.
          </p>
          <Button
            variant="outline"
            className="mt-8 h-11 w-full"
            onClick={signInWithGoogle}
            disabled={busy || isLoading}
          >
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="eyebrow">or email</span>
            <span className="bg-border h-px flex-1" />
          </div>
          <form onSubmit={submit} className="space-y-5">
            {error && (
              <p
                role="alert"
                className="border-destructive bg-destructive/10 text-destructive border-l-2 px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full"
              disabled={busy || isLoading}
            >
              {busy ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-auto" />
                </>
              )}
            </Button>
          </form>
          <p className="text-muted-foreground mt-6 text-sm">
            New here?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
