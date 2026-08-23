import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goal Coach",
  description:
    "Make progress one thing at a time.",
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
