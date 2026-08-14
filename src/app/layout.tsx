import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

/**
 * Two roles, strictly separated. Outfit is reserved for display
 * moments — hero headline, section titles, campaign statements, flavour
 * names. DM Sans carries everything functional: navigation, buttons, copy,
 * product information, UI.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfitDisplay = Outfit({
  subsets: ["latin"],
  weight: ["800", "900"],
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
      <body className={`${dmSans.variable} ${outfitDisplay.variable}`}>
        {children}
      </body>
    </html>
  );
}
