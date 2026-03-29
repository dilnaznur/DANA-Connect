import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DANA Connect | Women in STEM & Research Sciences",
  description: "A mentorship platform connecting women in STEM & Research Sciences across Kazakhstan with mentors and research opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased bg-page text-primary">
        <LanguageProvider>
          {children}
          <Toaster position="top-right" />
        </LanguageProvider>
      </body>
    </html>
  );
}
