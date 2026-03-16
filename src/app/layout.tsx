import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppToastHost from "@/components/ui/AppToastHost";
import InactivityWatcher from "@/components/auth/InactivityWatcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moneylot",
  description: "Moneylot",
  icons: {
    icon: "/assets/urlLogo.png",
    shortcut: "/assets/urlLogo.png",
    apple: "/assets/urlLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <InactivityWatcher />
        {children}
        <AppToastHost />
      </body>
    </html>
  );
}
