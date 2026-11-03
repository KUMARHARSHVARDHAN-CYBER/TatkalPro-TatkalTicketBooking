import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IRCTC Next-Gen • High-Concurrency Tatkal Railway Booking",
  description:
    "Modernized railway booking portal with 10:00 AM Redis atomic lock reservation and Dijkstra split-ticket routing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#071224] text-slate-100 antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
