import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Script from "next/script";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Old Legends", template: "%s · Old Legends" },
  description: "EPGP, botín, reglas y logs de raid de la hermandad Old Legends (WotLK).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <Script id="ultimowow-config" strategy="beforeInteractive">
          {`const whTooltips = { colorLinks: true, iconizeLinks: true, renameLinks: true };
            const aowow_tooltips = { colorLinks: true, iconizeLinks: true, renameLinks: true };
            const aowow_control = { mode: 2, applyto: 3 };`}
        </Script>
        <Script
          src="https://wotlk.ultimowow.com/static/widgets/power.js?lang=es"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased">
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <AppHeader />
              {children}
            </SidebarInset>
            <MobileNav />
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
