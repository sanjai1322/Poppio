import type { Metadata } from "next";
import { Archivo_Black, DM_Sans } from "next/font/google";
import "./globals.css";

/**
 * Two roles, strictly separated. Archivo Black is reserved for display
 * moments — hero headline, section titles, campaign statements, flavour
 * names. DM Sans carries everything functional: navigation, buttons, copy,
 * product information, UI.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "POPPIO — Tropical soda with guts",
  description:
    "Four island flavours, 3g of plant prebiotic fibre, none of the usual nonsense.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${archivoBlack.variable}`}>
        {children}
      </body>
    </html>
  );
}
