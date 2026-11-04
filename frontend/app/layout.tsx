import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "../components/PwaRegister";

export const viewport: Viewport = {
  themeColor: "#071224",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TatkalPro • Next-Gen Resilient IRCTC Tatkal Booking Engine",
  description:
    "Mobile-first Tatkal booking web app with zero session timeouts, 8-minute Redis seat holds, multi-gateway auto-fallback, and AI waitlist predictor.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TatkalPro",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#071224] text-slate-100 antialiased min-h-screen selection:bg-orange-500 selection:text-white font-sans">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
