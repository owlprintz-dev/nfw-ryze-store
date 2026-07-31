import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFW Ryze Team Store",
  description: "Official NFW Ryze Volleyball apparel, accessories, and personalized fan gear.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
