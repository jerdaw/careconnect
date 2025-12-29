import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kingston Care Connect",
  description: "Student Support Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
