import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baby Photo Generator",
  description:
    "Generate baby photos and short videos from two parent photos, with resemblance, age, and skin-tone controls.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
