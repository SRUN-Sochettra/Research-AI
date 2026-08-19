import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { metadata } from "@/app/layout";
import manifest from "@/app/manifest";

describe("Favicon and site metadata icons", () => {
  const root = process.cwd();

  it("defines explicit icons metadata in RootLayout", () => {
    expect(metadata.icons).toBeDefined();
    const icons = metadata.icons as {
      icon: Array<{ url: string; type?: string; sizes?: string }>;
      apple: Array<{ url: string; sizes?: string; type?: string }>;
    };

    expect(icons.icon).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "/icon.svg", type: "image/svg+xml" }),
        expect.objectContaining({ url: "/favicon.ico", sizes: "any" }),
      ])
    );
    expect(icons.apple).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "/apple-icon.png", sizes: "180x180" }),
      ])
    );
  });

  it("defines webmanifest with SynapseDoc branding and icons", () => {
    const m = manifest();
    expect(m.name).toBe("SynapseDoc");
    expect(m.short_name).toBe("SynapseDoc");
    expect(m.theme_color).toBe("#38e1a6");
    expect(m.background_color).toBe("#13201e");
    expect(m.icons?.length).toBeGreaterThanOrEqual(2);
  });

  it("contains valid SVG brand mark in src/app/icon.svg and public/favicon.svg", () => {
    const iconSvg = fs.readFileSync(
      path.join(root, "src/app/icon.svg"),
      "utf8"
    );
    const pubSvg = fs.readFileSync(
      path.join(root, "public/favicon.svg"),
      "utf8"
    );

    expect(iconSvg).toContain("<svg");
    expect(iconSvg).toContain("#13201e"); // Dark green-black container
    expect(iconSvg).toContain("#38e1a6"); // Mint nodes
    expect(iconSvg).not.toContain("vercel");

    expect(pubSvg).toBe(iconSvg);
  });

  it("contains valid multi-resolution ICO file in src/app/favicon.ico", async () => {
    const icoPath = path.join(root, "src/app/favicon.ico");
    expect(fs.existsSync(icoPath)).toBe(true);

    const buffer = fs.readFileSync(icoPath);
    expect(buffer.readUInt16LE(0)).toBe(0); // Reserved
    expect(buffer.readUInt16LE(2)).toBe(1); // ICO type
    const count = buffer.readUInt16LE(4);
    expect(count).toBe(3); // 16x16, 32x32, 48x48
  });

  it("contains valid 180x180 Apple touch icon", async () => {
    const appleIconPath = path.join(root, "src/app/apple-icon.png");
    expect(fs.existsSync(appleIconPath)).toBe(true);

    const meta = await sharp(appleIconPath).metadata();
    expect(meta.width).toBe(180);
    expect(meta.height).toBe(180);
    expect(meta.format).toBe("png");
  });

  it("contains valid 192x192 and 512x512 manifest icons", async () => {
    const p192 = path.join(root, "public/icon-192.png");
    const p512 = path.join(root, "public/icon-512.png");

    const m192 = await sharp(p192).metadata();
    const m512 = await sharp(p512).metadata();

    expect(m192.width).toBe(192);
    expect(m192.height).toBe(192);
    expect(m512.width).toBe(512);
    expect(m512.height).toBe(512);
  });
});
