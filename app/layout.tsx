import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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

const title = "Fidelización digital para servicentros | Loyalty Web";
const description =
  "Administra clientes, visitas y recompensas con una plataforma digital de fidelización para servicentros y negocios automotrices. Sin apps que instalar.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: title,
    template: "%s · Loyalty Web",
  },
  description,
  applicationName: "Loyalty Web",
  keywords: [
    "fidelización",
    "servicentros",
    "autolavado",
    "clientes frecuentes",
    "recompensas",
    "retención de clientes",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Loyalty Web",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "Loyalty Web",
    title,
    description,
    url: appUrl,
    locale: "es_CR",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  // Matches the app canvas per theme, so the mobile browser chrome blends in.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
