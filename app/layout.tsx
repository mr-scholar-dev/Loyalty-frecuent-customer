import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Loyalty Web · Fidelización para servicentros",
    template: "%s · Loyalty Web",
  },
  description:
    "Plataforma multiempresa de fidelización para servicentros: tarjetas digitales con QR, programas de lavados y recompensas automáticas.",
  applicationName: "Loyalty Web",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Loyalty Web",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CR"
      suppressHydrationWarning
      className={cn(inter.variable, mono.variable)}
    >
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
