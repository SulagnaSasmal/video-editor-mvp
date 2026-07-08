import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Editor MVP",
  description: "JSON-driven video editing pipeline MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
