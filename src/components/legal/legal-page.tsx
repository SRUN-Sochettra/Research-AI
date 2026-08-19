import Link from "next/link";
import { BrandWordmark } from "@/components/layout/brand-mark";

export function LegalPage({
  title,
  summary,
  updated = "August 16, 2026",
  children,
}: {
  title: string;
  summary: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="SynapseDoc home">
            <BrandWordmark compact />
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Back to SynapseDoc
          </Link>
        </div>
      </header>
      <main
        id="main-content"
        className="container max-w-3xl px-5 py-12 sm:px-8 sm:py-16"
      >
        <p className="eyebrow">Legal &amp; service information</p>
        <h1 className="display-serif mt-3 text-4xl sm:text-5xl">{title}</h1>
        <p className="text-muted-foreground mt-5 max-w-2xl leading-7">
          {summary}
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          Last updated: {updated}
        </p>
        <article className="legal-copy mt-10 space-y-9">{children}</article>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="text-muted-foreground space-y-3 text-sm leading-7">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}

export function LegalContact() {
  const email = process.env.NEXT_PUBLIC_LEGAL_EMAIL;
  return email ? (
    <a
      className="text-primary underline underline-offset-4"
      href={`mailto:${email}`}
    >
      {email}
    </a>
  ) : (
    <strong className="text-foreground">
      Contact email not configured. Set NEXT_PUBLIC_LEGAL_EMAIL before public
      launch.
    </strong>
  );
}
