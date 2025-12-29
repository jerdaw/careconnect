import type { Metadata } from "next";
import "./globals.css";
import BetaBanner from "../components/BetaBanner";

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
      <body>
        <BetaBanner />
        {children}
      </body>
    </html>
  );
}
