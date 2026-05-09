import type { Metadata } from "next";
import { Inter } from "next/font/google";
import LenisProvider from "@/components/LenisProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Neuralux - AI-Powered Learning OS",
  description:
    "Transform any lecture into an AI tutor with semantic search, flashcards, smart timelines, and personalized learning paths.",
  keywords: "AI learning, video tutoring, semantic search, flashcards, AI tutor",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
