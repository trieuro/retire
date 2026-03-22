import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RetirePlan - Federal Retirement Planner",
  description: "FERS pension, TSP, and Social Security retirement planning tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <SidebarNav />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="mx-auto p-4 md:p-6 max-w-6xl">
            {children}
          </div>
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
