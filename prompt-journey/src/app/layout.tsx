import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PromptJourney - Share Your AI Adventures",
  description: "A community forum for sharing prompt journeys, one-shot prompts, and AI adventures. Document your AI experiences and inspire others.",
  keywords: ["AI prompts", "prompt engineering", "AI community", "ChatGPT", "prompt sharing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 dark:bg-zinc-950 light:bg-gray-50 text-zinc-100 dark:text-zinc-100 light:text-zinc-900 min-h-screen`}
      >
        <Providers>
          <div className="relative min-h-screen bg-grid">
            {/* Background gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none dark:opacity-100 light:opacity-30">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
            </div>
            
            {/* Main layout */}
            <div className="relative z-10">
              <Navbar />
              <main className="min-h-[calc(100vh-4rem)]">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
