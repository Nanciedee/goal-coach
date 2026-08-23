import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goal Coach",
  description:
    "An adaptive AI productivity coach built around one manageable step at a time.",
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
