import { Inter } from "next/font/google";

import "@workspace/ui/globals.css";
import "./globals.css";
import Provider from "@/providers";

const primaryFont = Inter({
  variable: "--font-primary",
  subsets: ["latin"],
});

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${primaryFont.variable} font-sans antialiased `}
      >
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

export default RootLayout;
