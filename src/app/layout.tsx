import type { Metadata, Viewport } from "next";
import { Manrope, Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/lib/DemoContext";
import PwaUpdater from "@/components/PwaUpdater";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-serif",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RIO",
  description: "Portal exclusivo de catálogo B2B y gestión de bodega RIO.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RIO",
  },
  icons: {
    apple: '/apple-icon.png',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1216",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${manrope.variable} ${montserrat.variable} ${jetbrainsMono.variable} antialiased bg-rio-background text-rio-ink font-sans`}
      >
        <DemoProvider>
        <PwaUpdater />
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}
