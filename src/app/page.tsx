import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import {
  Brain,
  FileText,
  MessageSquare,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  Sparkles,
  Upload,
  Search,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "PDF Analysis",
    description:
      "Upload any PDF and our AI agents automatically extract, chunk, and index every word for instant retrieval.",
    accent: "violet",
    iconBg: "from-violet-500/20 to-violet-600/10",
    iconColor: "text-violet-400",
    border: "hover:border-violet-500/30",
    glow: "hover:shadow-violet-500/5",
  },
  {
    icon: MessageSquare,
    title: "Intelligent Q&A",
    description:
      "Ask in natural language. Get precise answers backed by page-level citations you can verify instantly.",
    accent: "blue",
    iconBg: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-400",
    border: "hover:border-blue-500/30",
    glow: "hover:shadow-blue-500/5",
  },
  {
    icon: Zap,
    title: "Auto-Summarization",
    description:
      "Get comprehensive multi-section summaries of dense documents in seconds using parallel AI agents.",
    accent: "amber",
    iconBg: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-400",
    border: "hover:border-amber-500/30",
    glow: "hover:shadow-amber-500/5",
  },
  {
    icon: Brain,
    title: "RAG Pipeline",
    description:
      "Retrieval-Augmented Generation grounds every answer in your document — no hallucinations.",
    accent: "emerald",
    iconBg: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-400",
    border: "hover:border-emerald-500/30",
    glow: "hover:shadow-emerald-500/5",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Row-level security, encrypted storage, and strict user data isolation. Your documents stay yours.",
    accent: "rose",
    iconBg: "from-rose-500/20 to-rose-600/10",
    iconColor: "text-rose-400",
    border: "hover:border-rose-500/30",
    glow: "hover:shadow-rose-500/5",
  },
  {
    icon: BarChart3,
    title: "Observable AI",
    description:
      "Full LangFuse tracing of every agent decision. Know exactly why every answer was generated.",
    accent: "indigo",
    iconBg: "from-indigo-500/20 to-indigo-600/10",
    iconColor: "text-indigo-400",
    border: "hover:border-indigo-500/30",
    glow: "hover:shadow-indigo-500/5",
  },
];

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload your PDF",
    description: "Drag & drop or browse. Up to 10MB. Processing starts instantly.",
  },
  {
    step: "02",
    icon: Brain,
    title: "AI indexes the content",
    description: "Multi-agent pipeline chunks, embeds, and stores your document.",
  },
  {
    step: "03",
    icon: Search,
    title: "Ask anything",
    description: "Natural language questions. Cited answers in under 3 seconds.",
  },
];

const techStack = [
  { name: "Next.js 15", color: "text-white/70" },
  { name: "LangChain.js", color: "text-emerald-400/70" },
  { name: "Google Gemini", color: "text-blue-400/70" },
  { name: "Supabase", color: "text-emerald-400/70" },
  { name: "pgvector", color: "text-cyan-400/70" },
  { name: "TypeScript", color: "text-blue-400/70" },
  { name: "Tailwind CSS", color: "text-cyan-400/70" },
  { name: "LangFuse", color: "text-violet-400/70" },
];

const stats = [
  { value: "<3s", label: "Response time", sub: "avg" },
  { value: "10MB", label: "Max PDF size", sub: "per doc" },
  { value: "99%", label: "Citation accuracy", sub: "grounded" },
  { value: "∞", label: "Questions", sub: "per doc" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">

      {/* ── Global ambient background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top-right orb */}
        <div className="absolute -top-48 -right-48 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[130px]" />
        {/* Bottom-left orb */}
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
        {/* Center subtle orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-indigo-600/5 blur-[150px]" />
        {/* Grid */}
        <div className="grid-pattern absolute inset-0 opacity-100" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(222,47%,4%)_100%)]" />
      </div>

      <Header />

      {/* ━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━ */}
      <section className="relative container flex flex-col items-center justify-center gap-8 px-4 py-24 text-center md:py-36">

        {/* Badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-1.5 text-xs font-medium text-violet-300 backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-violet-400" />
          <span>Autonomous multi-agent AI pipeline</span>
          <span className="ml-1 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
            BETA
          </span>
        </div>

        {/* Headline */}
        <div className="animate-slide-up stagger-1 space-y-3">
          <h1 className="text-balance max-w-4xl text-5xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-6xl md:text-7xl">
            Research smarter
            <br />
            <span className="gradient-text glow-text">with AI agents</span>
          </h1>
          <p className="text-pretty mx-auto max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload PDFs, ask questions in plain English, and get accurate
            answers with citations — powered by an autonomous RAG pipeline.
          </p>
        </div>

        {/* CTAs */}
        <div className="animate-slide-up stagger-2 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            size="lg"
            asChild
            className="group relative h-12 overflow-hidden bg-gradient-to-r from-violet-600 to-blue-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02] animate-gradient"
          >
            <Link href="/signup">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 border-white/8 bg-white/3 px-7 text-sm font-medium backdrop-blur-sm hover:bg-white/7 hover:border-white/15"
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        {/* Social proof micro-copy */}
        <p className="animate-fade-in stagger-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          No credit card · Free to get started · Built with production-grade AI
        </p>

        {/* ── Stats strip ── */}
        <div className="animate-slide-up stagger-3 mt-2 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass card-interactive group rounded-2xl border border-white/6 p-4 text-center"
            >
              <div className="gradient-text text-2xl font-extrabold tracking-tight">
                {stat.value}
              </div>
              <div className="mt-0.5 text-[11px] font-medium text-foreground/70">
                {stat.label}
              </div>
              <div className="text-[10px] text-muted-foreground">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━ HOW IT WORKS ━━━━━━━━━━━━━━ */}
      <section className="relative container px-4 py-20">
        {/* Section label */}
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            How it works
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            From PDF to insights{" "}
            <span className="gradient-text">in seconds</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid gap-6 sm:grid-cols-3">
          {/* Connector line — desktop only */}
          <div className="pointer-events-none absolute top-[52px] left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px sm:block">
            <div className="h-full w-full bg-gradient-to-r from-violet-500/30 via-blue-500/30 to-cyan-500/30" />
          </div>

          {steps.map((step, i) => (
            <div
              key={step.step}
              className={`glass card-interactive group relative flex flex-col items-center rounded-2xl border border-white/7 p-7 text-center animate-slide-up stagger-${i + 1}`}
            >
              {/* Step number */}
              <div className="mb-5 flex flex-col items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/20 to-blue-600/10">
                  <step.icon className="h-6 w-6 text-violet-400" />
                  {/* Step badge */}
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
              </div>
              <h3 className="mb-2 text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━ FEATURES ━━━━━━━━━━━━━━ */}
      <section className="relative container px-4 py-20">
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Features
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to{" "}
            <span className="gradient-text">research smarter</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Production-grade AI infrastructure, not a toy demo.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`card-interactive group relative overflow-hidden rounded-2xl border border-white/7 bg-white/[0.018] p-6 transition-all duration-300 ${feature.border} hover:shadow-lg ${feature.glow} animate-slide-up stagger-${Math.min(i + 1, 6)}`}
            >
              {/* Top shimmer bar on hover */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Icon */}
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.iconBg} ring-1 ring-white/8`}
              >
                <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
              </div>

              <h3 className="mb-2 text-base font-semibold leading-snug">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━ TECH STACK ━━━━━━━━━━━━━━ */}
      <section className="relative border-y border-white/5 py-14">
        <div className="container px-4 text-center">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Built with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {techStack.map((tech) => (
              <span
                key={tech.name}
                className={`rounded-full border border-white/8 bg-white/3 px-4 py-1.5 text-xs font-medium ${tech.color} transition-all duration-200 hover:border-violet-500/25 hover:bg-violet-500/5 hover:text-foreground`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━ CTA ━━━━━━━━━━━━━━ */}
      <section className="relative container px-4 py-24">
        <div className="border-gradient relative overflow-hidden rounded-3xl p-px">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/60 via-background to-blue-950/60 px-8 py-16 text-center sm:px-16">
            {/* Inner glows */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/15 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" />
            <div className="dot-pattern absolute inset-0 opacity-30" />

            <div className="relative">
              {/* Icon */}
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/30 glow-md">
                <Brain className="h-8 w-8 text-white" />
              </div>

              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to transform
                <br />
                <span className="gradient-text">your research workflow?</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Free to start. No credit card. Cancel anytime.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  asChild
                  className="group h-12 bg-gradient-to-r from-violet-600 to-blue-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all animate-gradient"
                >
                  <Link href="/signup">
                    Start analyzing for free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  asChild
                  className="h-12 px-6 text-muted-foreground hover:text-foreground"
                >
                  <Link href="/login">Already have an account →</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━ FOOTER ━━━━━━━━━━━━━━ */}
      <footer className="relative border-t border-white/5 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 shadow-sm shadow-violet-500/20 transition-shadow group-hover:shadow-violet-500/40">
              <Brain className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-foreground/80">Research AI</span>
          </Link>

          <div className="flex items-center gap-6">
            <span>Built as a portfolio project</span>
            <span className="hidden sm:block text-white/20">·</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="status-dot status-online" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}