import type { Metadata } from "next";
import { Nunito, Poppins } from "next/font/google";
import { getPublicBaseUrl } from "@/lib/site-url";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicBaseUrl()),
  title: "Échale | Historias con metas reales",
  description:
    "Plataforma comunitaria para apoyar metas gestionadas por organizaciones aliadas con pagos instantáneos vía CoDi.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-MX"
      className={`${poppins.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
