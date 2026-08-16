"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { BrandWordmark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const notes = [
  "Ask questions against the source",
  "Follow answers to cited pages",
  "Keep documents private to your account",
];
export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = await signUpWithEmail(email, password, name);
    if (r.error) setError(r.error);
    else setDone(true);
    setBusy(false);
  }
  if (done)
    return (
      <main className="neural-field grid min-h-screen place-items-center px-5">
        <div className="max-w-md border p-8 text-center">
          <MailCheck className="text-primary mx-auto size-9" />
          <p className="eyebrow mt-6">Account created</p>
          <h1 className="display-serif mt-3 text-4xl">Check your inbox.</h1>
          <p className="text-muted-foreground mt-4 text-sm leading-6">
            If email confirmation is enabled, use the link sent to{" "}
            <strong className="text-foreground">{email}</strong>. Otherwise,
            sign in now.
          </p>
          <Button asChild className="mt-7">
            <Link href="/login">Continue to sign in</Link>
          </Button>
        </div>
      </main>
    );
  return (
    <main className="neural-field grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="bg-card flex flex-col justify-between border-r p-6 sm:p-10">
        <Link href="/" aria-label="SynapseDoc home">
          <BrandWordmark />
        </Link>
        <div className="hidden lg:block">
          <p className="eyebrow">The research instrument</p>
          <h2 className="display-serif mt-5 text-5xl">
            Build an argument with the source still attached.
          </h2>
          <ul className="mt-8 space-y-3">
            {notes.map((x) => (
              <li
                key={x}
                className="text-muted-foreground flex items-center gap-3 text-sm"
              >
                <Check className="text-primary size-4" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="grid place-items-center px-5 py-12">
        <div className="w-full max-w-sm">
          <p className="eyebrow">New workspace</p>
          <h1 className="display-serif mt-3 text-5xl">Create account.</h1>
          <Button
            variant="outline"
            className="mt-8 h-11 w-full"
            onClick={signInWithGoogle}
            disabled={busy}
          >
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="eyebrow">or email</span>
            <span className="bg-border h-px flex-1" />
          </div>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <p
                role="alert"
                className="border-destructive bg-destructive/10 text-destructive border-l-2 px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>
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
                minLength={6}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
              <p className="text-muted-foreground text-xs">
                At least 6 characters.
              </p>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating account
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-auto" />
                </>
              )}
            </Button>
          </form>
          <p className="text-muted-foreground mt-6 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
