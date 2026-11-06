import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ExpositionExit, ExpositionShortcut } from "@/components/exposition";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import { expositionInitScript } from "@/lib/exposition";
import { themeInitScript } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: site.name,
  description: site.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      // The theme script changes the class before hydration.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript + expositionInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
        >
          Saltar al contenido
        </a>
        <Providers>
          <ExpositionShortcut />
          <ExpositionExit />
          <SiteHeader />
          <div id="contenido" className="flex flex-1 flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
