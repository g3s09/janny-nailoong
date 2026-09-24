import type { Metadata, Viewport } from "next";
import "./globals.css";
import Pwa from "./components/Pwa";
export const metadata: Metadata = {
  title: "El rincón de Janny",
  description: "Janny, hice esto pensando en ti. — Gela",
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Mi rincón", statusBarStyle: "default" },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf7ef",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Pwa />
        {children}
      </body>
    </html>
  );
}
