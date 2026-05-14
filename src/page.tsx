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
} from "lucide-react";

const features = [
    {
        icon: FileText,
        title: "PDF Analysis",
        description:
            "Upload any PDF and our AI agents automatically extract, chunk, and index the content for intelligent retrieval.",
    },
    {
        icon: MessageSquare,
        title: "Intelligent Q&A",
        description:
            "Ask questions in natural language. Get accurate answers with page-level citations from your documents.",
    },
    {
        icon: Zap,
        title: "Auto-Summarization",
        description:
            "Get comprehensive summaries of lengthy documents in seconds using multi-agent AI pipelines.",
    },
    {
        icon: Brain,
        title: "RAG Pipeline",
        description:
            "Retrieval-Augmented Generation ensures answers are grounded in your actual document content.",
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description:
            "Row-level security, encrypted storage, and strict data isolation. Your documents stay yours.",
    },
    {
        icon: BarChart3,
        title: "Observable AI",
        description:
            "Full tracing of every AI decision with Langfuse integration. Know exactly how answers are generated.",
    },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero */}
            <section className="container flex flex-col items-center justify-center gap-6 pb-8 pt-16 text-center md:pt-24">
                <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
                    <span className="mr-2">🤖</span>
                    <span>Powered by autonomous AI agents</span>
                </div>

                <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    Your AI{" "}
                    <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                        Research Assistant
                    </span>
                </h1>

                <p className="max-w-xl text-lg text-muted-foreground">
                    Upload PDFs. Ask questions. Get cited answers. Autonomous AI agents
                    handle the heavy lifting while you focus on insights.
                </p>

                <div className="flex gap-4">
                    <Button size="lg" asChild>
                        <Link href="/signup">
                            Get Started Free
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/login">Sign In</Link>
                    </Button>
                </div>
            </section>

            {/* Features */}
            <section className="container pb-16 pt-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group rounded-lg border p-6 transition-shadow hover:shadow-md"
                        >
                            <feature.icon className="mb-4 h-8 w-8 text-primary" />
                            <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tech Stack Banner */}
            <section className="border-t bg-muted/50 py-12">
                <div className="container text-center">
                    <p className="mb-6 text-sm font-medium text-muted-foreground">
                        BUILT WITH
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-muted-foreground">
                        {[
                            "Next.js 14",
                            "LangChain.js",
                            "Google Gemini",
                            "Supabase pgvector",
                            "TypeScript",
                            "Tailwind CSS",
                        ].map((tech) => (
                            <span
                                key={tech}
                                className="rounded-full border bg-background px-4 py-2"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-6">
                <div className="container flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        <span>Research AI</span>
                    </div>
                    <p>Built as a portfolio project demonstrating AI engineering</p>
                </div>
            </footer>
        </div>
    );
}