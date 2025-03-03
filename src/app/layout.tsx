import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BlackjackProvider } from "@/lib/context/BlackjackContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blackjack Card Game",
  description: "A simple blackjack game built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BlackjackProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </BlackjackProvider>
      </body>
    </html>
  );
}
