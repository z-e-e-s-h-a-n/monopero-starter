import { Geist, Geist_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import "./globals.css";
import Provider from "@/providers";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

export default RootLayout;
