import Link from "next/link";
import { ArrowRight, BookOpen, FileSearch, Quote, Upload } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

const steps = [
  [
    "01",
    "Bring the source",
    "Upload a PDF. Mogger preserves page references while it parses and indexes the text.",
  ],
  [
    "02",
    "Interrogate the evidence",
    "Ask direct questions, compare claims, or request a structured summary.",
  ],
  [
    "03",
    "Trace every answer",
    "Open page-level citations and move from synthesis back to the original source.",
  ],
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <Header />
      <main>
        <section className="container px-5 pt-16 pb-16 sm:px-8 sm:pt-24 lg:pb-24">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="eyebrow mb-6">
                Research workspace / PDF intelligence
              </p>
              <h1 className="display-serif max-w-4xl text-[clamp(3.4rem,8vw,7.5rem)] leading-[.86]">
                Read less.
                <br />
                <em className="text-primary not-italic">Know where</em>
                <br />
                it came from.
              </h1>
              <p className="text-muted-foreground mt-8 max-w-xl text-base leading-7 sm:text-lg">
                Mogger Research turns dense PDFs into a source-grounded
                conversation—summaries, precise answers, and page citations in
                one restrained workspace.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-11 px-5">
                  <Link href="/signup">
                    Start a research file <ArrowRight />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 px-5"
                >
                  <Link href="/login">Open workspace</Link>
                </Button>
              </div>
            </div>
            <div className="folio-panel relative overflow-hidden p-5 sm:p-7">
              <div className="mb-8 flex items-center justify-between border-b pb-4">
                <span className="eyebrow">Evidence brief</span>
                <span className="text-muted-foreground font-mono text-xs">
                  PDF / 24 pp.
                </span>
              </div>
              <Quote className="text-primary mb-5 size-8" />
              <p className="display-serif text-3xl leading-tight">
                “The answer is only useful when the path back to the source is
                obvious.”
              </p>
              <div className="bg-border mt-8 grid grid-cols-2 gap-px border">
                <div className="bg-card p-4">
                  <FileSearch className="text-primary mb-4 size-5" />
                  <p className="text-sm font-medium">Source-bound answers</p>
                </div>
                <div className="bg-card p-4">
                  <BookOpen className="text-primary mb-4 size-5" />
                  <p className="text-sm font-medium">Page-level citations</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-card/40 border-y">
          <div className="container grid lg:grid-cols-3">
            {steps.map(([n, t, d]) => (
              <article
                key={n}
                className="border-b p-7 sm:p-9 lg:border-r lg:border-b-0 lg:last:border-r-0"
              >
                <span className="text-primary font-mono text-xs">{n}</span>
                <h2 className="display-serif mt-10 text-3xl">{t}</h2>
                <p className="text-muted-foreground mt-4 text-sm leading-6">
                  {d}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="container px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid-paper border p-7 sm:p-12 lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Your next reading list</p>
              <h2 className="display-serif mt-4 max-w-2xl text-4xl sm:text-5xl">
                Turn the PDF pile into a line of inquiry.
              </h2>
            </div>
            <Button asChild size="lg" className="mt-8 h-12 lg:mt-0">
              <Link href="/signup">
                <Upload />
                Upload the first document
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
