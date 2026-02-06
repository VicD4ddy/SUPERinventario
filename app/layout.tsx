import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";
import { CommandPaletteWrapper } from "@/components/layout/CommandPaletteWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Inventario",
  description: "Gestión de inventario moderna y escalable",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Inventario",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SettingsProvider>
          <ErrorBoundary>
            <AuthProvider>
              <CommandPaletteProvider>
                <AppShell>
                  {children}
                </AppShell>
                <CommandPaletteWrapper />
              </CommandPaletteProvider>
            </AuthProvider>
          </ErrorBoundary>
        </SettingsProvider>
      </body>
    </html>
  );
}
