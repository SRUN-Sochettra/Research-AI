import Link from "next/link";
import { BrandWordmark } from "@/components/layout/brand-mark";

export function Footer() {
  return (
    <footer className="bg-background/95 border-t py-7">
      <div className="container flex flex-col gap-3 px-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" aria-label="SynapseDoc home">
          <BrandWordmark compact />
        </Link>
        <p className="text-muted-foreground max-w-md sm:text-right">
          Private document analysis with source-linked answers and page
          citations.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
