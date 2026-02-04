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
                <div className="flex h-screen bg-slate-50 overflow-hidden">
                  <Sidebar />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
                      {children}
                    </main>
                  </div>
                </div>
                <BottomNavigation />
                <CommandPaletteWrapper />
              </CommandPaletteProvider>
            </AuthProvider>
          </ErrorBoundary>
        </SettingsProvider>
      </body>
    </html>
  );
}
