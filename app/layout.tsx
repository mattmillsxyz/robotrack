import type { Metadata } from "next";
import "./globals.css";

import AppProvider from "./components/AppProvider";

export const metadata: Metadata = {
  title: "RoboTrack",
  description: "Real-time delivery fleet monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
