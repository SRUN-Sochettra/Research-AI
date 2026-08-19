import Link from "next/link";
import { BrandWordmark } from "@/components/layout/brand-mark";

const legalLinks = [
  ["Limits", "/limits"],
  ["AI notice", "/ai-disclosure"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Acceptable use", "/acceptable-use"],
] as const;

export function Footer() {
  return (
    <footer className="bg-background/95 border-t py-7">
      <div className="container flex flex-col gap-4 px-5 text-xs sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" aria-label="SynapseDoc home">
            <BrandWordmark compact />
          </Link>
          <p className="text-muted-foreground max-w-md sm:text-right">
            Private document analysis with source-linked answers and page
            citations.
          </p>
        </div>
        <nav
          aria-label="Legal and service information"
          className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 border-t pt-4"
        >
          {legalLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
