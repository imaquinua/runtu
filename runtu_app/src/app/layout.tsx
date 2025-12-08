import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { OfflineNotice } from "@/components/ui/error";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Runtu - Tu copiloto de negocio",
  description: "El primer copiloto de negocios diseñado desde y para la realidad latinoamericana. Tu intuición por fin tiene un espejo que la valida, la cuestiona, la amplifica.",
  keywords: ["copiloto", "negocio", "emprendedor", "latinoamerica", "IA", "inteligencia artificial"],
  authors: [{ name: "Runtu" }],
  openGraph: {
    title: "Runtu - Tu copiloto de negocio",
    description: "El primer copiloto de negocios diseñado desde y para la realidad latinoamericana.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        {children}
        <ToastProvider />
        <OfflineNotice />
      </body>
    </html>
  );
}
