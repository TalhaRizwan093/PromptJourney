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
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>

              {/* Footer */}
              <footer className="border-t border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-10 max-w-6xl">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">P</div>
                        <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">PromptJourney</span>
                      </div>
                      <p className="text-sm text-zinc-500 max-w-sm">
                        A community for prompt engineers, vibe coders, and AI enthusiasts to share their journeys, prompts, and discoveries.
                      </p>
                    </div>

                    {/* Explore */}
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-300 mb-3">Explore</h4>
                      <ul className="space-y-2">
                        <li><a href="/journeys" className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">Journeys</a></li>
                        <li><a href="/one-shots" className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">One-Shots</a></li>
                        <li><a href="/awards" className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">Awards</a></li>
                      </ul>
                    </div>

                    {/* Create */}
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-300 mb-3">Create</h4>
                      <ul className="space-y-2">
                        <li><a href="/journeys/new" className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">New Journey</a></li>
                        <li><a href="/one-shots/new" className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">New One-Shot</a></li>
                        <li><a href="/import" className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">Import from AI</a></li>
                      </ul>
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className="border-t border-zinc-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} PromptJourney. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                      <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Privacy</a>
                      <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Terms</a>
                      <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Contact</a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
