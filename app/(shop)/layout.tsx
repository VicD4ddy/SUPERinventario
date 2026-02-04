import { ShopHeader } from "@/components/shop/ShopHeader"
import { CartProvider } from "@/contexts/CartContext"
import { CartDrawer } from "@/components/shop/CartDrawer"

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <CartProvider>
            <div className="min-h-screen bg-slate-50 font-sans">
                <ShopHeader />
                <main>
                    {children}
                </main>
                <CartDrawer />
                <footer className="py-6 text-center text-sm text-slate-500 border-t mt-12">
                    <p>© {new Date().getFullYear()} Loyafu Store. Todos los derechos reservados.</p>
                </footer>
            </div>
        </CartProvider>
    )
}
