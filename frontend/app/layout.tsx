import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Excel Insight — Analisis Spreadsheet Otomatis & Laporan PDF",
  description:
    "Ubah spreadsheet Excel menjadi grafik interaktif, audit kualitas data otomatis, dan laporan eksekutif PDF profesional dengan ReportLab.",
  keywords: ["analisis excel", "spreadsheet to pdf", "generator grafik", "visualisasi data", "audit kualitas data"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}
