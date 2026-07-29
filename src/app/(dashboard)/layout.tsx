import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background relative min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-violet-600/6 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-blue-600/6 blur-[100px]" />
        <div className="grid-pattern absolute inset-0 opacity-60" />
      </div>

      <Header />

      <main className="relative z-10 container px-4 py-8">{children}</main>
    </div>
  );
}
