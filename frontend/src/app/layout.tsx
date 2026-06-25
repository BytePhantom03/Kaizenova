import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Kaizenova - AI-Powered Adaptive Interview Platform",
  description: "Master every interview with adaptive AI. Kaizenova dynamically adjusts to your skill level, providing real-time evaluation on technical accuracy, communication, and confidence.",
  keywords: ["interview preparation", "AI interviewer", "adaptive difficulty", "mock interview", "tech interview"],
  openGraph: {
    title: "Kaizenova - AI-Powered Adaptive Interview Platform",
    description: "Master every interview with adaptive AI that adjusts to your skill level in real-time.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0E17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
