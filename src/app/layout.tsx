import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type * as React from "react";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Carlitos Finanzas",
    template: "%s · Carlitos Finanzas",
  },
  description:
    "Control de ingresos y gastos, indicadores y reportes de Panadería Carlitos.",
  applicationName: "Carlitos Finanzas",
  icons: {
    icon: "/branding/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F6F4F1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
