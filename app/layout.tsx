import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import SearchBar from "@/components/SearchBar";
import CompareTray from "@/components/CompareTray";

export const metadata: Metadata = {
  title: "OneAtlas — Discover, compare and evaluate AI models",
  description:
    "Browse AI models across providers, compare pricing, context windows and benchmarks, and explore AI labs and providers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-base text-white">
                ◈
              </span>
              OneAtlas
            </Link>
            <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
              <Link href="/models" className="hover:text-slate-900">
                Models
              </Link>
              <Link href="/rankings" className="hover:text-slate-900">
                Rankings
              </Link>
              <Link href="/compare" className="hover:text-slate-900">
                Compare
              </Link>
              <Link href="/labs" className="hover:text-slate-900">
                Labs
              </Link>
              <Link href="/providers" className="hover:text-slate-900">
                Providers
              </Link>
            </nav>
            <div className="ml-auto w-full max-w-[220px] sm:max-w-sm">
              <SearchBar />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500 sm:px-6">
            <p className="font-semibold text-slate-700">OneAtlas</p>
            <p className="mt-1 max-w-3xl">
              AI model discovery and intelligence — browse models across
              providers, compare pricing, context windows and benchmarks, and
              explore the labs and providers behind them.
            </p>
            <p className="mt-3 max-w-3xl text-xs">
              Pricing is public list pricing as of November 2026 and changes
              frequently — confirm current figures on the provider&apos;s own
              pricing page. Benchmark scores are shown only where a public
              source publishes them; anything unverified is left blank rather
              than estimated.
            </p>
          </div>
        </footer>

        <CompareTray />
      </body>
    </html>
  );
}
