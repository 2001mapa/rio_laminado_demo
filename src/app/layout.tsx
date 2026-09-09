import type { Metadata, Viewport } from "next";
import { Manrope, Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/lib/DemoContext";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RIO B2B - Demo",
  description: "Demostración de catálogo B2B y gestión de bodega RIO.",
};

export const viewport: Viewport = {
  themeColor: "#FCFAF7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}
