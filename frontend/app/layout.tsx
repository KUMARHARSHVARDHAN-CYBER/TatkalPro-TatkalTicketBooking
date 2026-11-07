import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "../components/PwaRegister";

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TatkalPro • Resilient Tatkal Railway Booking Simulator",
  description:
    "Mobile-first Tatkal booking web app with live real-time passenger management, 8-minute seat holds, multi-gateway auto-recovery, and Bot Shield.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TatkalPro",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-[#F8FAFC] text-slate-800 antialiased min-h-screen selection:bg-orange-500 selection:text-white font-sans text-base">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
