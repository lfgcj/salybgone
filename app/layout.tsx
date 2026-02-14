import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PHProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SalyBGone — Automation Tools for Auditors & Accountants",
    template: "%s | SalyBGone",
  },
  description:
    "Premium automation tools built by an auditor who gets it. 100% local processing, new tools monthly. $100/month.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://salybgone.com"),
  openGraph: {
    title: "SalyBGone — Automation Tools for Auditors & Accountants",
    description:
      "Premium automation tools built by an auditor who gets it. 100% local processing, new tools monthly.",
    type: "website",
    siteName: "SalyBGone",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-bg text-text-primary min-h-screen">
        <PHProvider>
          {children}
        </PHProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
