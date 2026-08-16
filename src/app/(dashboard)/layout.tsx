import { Header } from "@/components/layout/header";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container px-5 py-8 sm:px-8 sm:py-12">{children}</main>
    </div>
  );
}
