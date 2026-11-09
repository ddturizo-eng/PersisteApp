import type { Metadata } from "next";
import { Geist_Mono, Lexend } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ExpositionExit, ExpositionShortcut } from "@/components/exposition";
import { Providers } from "@/components/providers";
import { RoomBar } from "@/components/room-bar";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import { expositionInitScript } from "@/lib/exposition";
import { themeInitScript } from "@/lib/theme";

// Lexend: rounded geometric shapes, designed to make reading easier (Learnify-like voice).
const lexend = Lexend({
  variable: "--font-lexend",
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
      className={`${lexend.variable} ${geistMono.variable} h-full antialiased`}
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
          <RoomBar />
          <div id="contenido" className="flex flex-1 flex-col">
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
