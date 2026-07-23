import type { Metadata, Viewport } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Loyalty Web",
    template: "%s · Loyalty Web",
  },
  description:
    "Plataforma multiempresa de fidelización para servicentros: tarjetas digitales, programas de lavados y recompensas.",
  applicationName: "Loyalty Web",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Loyalty Web",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CR" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
