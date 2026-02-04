/* eslint-disable @next/next/no-img-element */
import { ImageOff, MessageCircle } from "lucide-react";

interface PublicProduct {
    id: string;
    name: string;
    description: string | null;
    price_usd: number;
    price_ves: number;
    image_url: string | null;
    stock: number;
    category_name: string | null;
}

interface ShopProductCardProps {
    product: PublicProduct;
    businessPhone?: string;
}

export function ShopProductCard({ product, businessPhone }: ShopProductCardProps) {
    const handleWhatsApp = () => {
        if (!businessPhone) return;

        const message = `Hola, estoy interesado en este producto: *${product.name}* ($${product.price_usd})`;
        const url = `https://wa.me/${businessPhone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            {/* Image Area */}
            <div className="aspect-square bg-slate-100 relative overflow-hidden group">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-slate-400">
                        <ImageOff size={48} strokeWidth={1.5} />
                    </div>
                )}

                {/* Available Badge */}
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    DISPONIBLE
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                    {product.category_name && (
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1 block">
                            {product.category_name}
                        </span>
                    )}
                    <h3 className="font-bold text-slate-900 line-clamp-2 mb-2">{product.name}</h3>
                    {product.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{product.description}</p>
                    )}
                </div>

                {/* Price Section */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <span className="block text-2xl font-bold text-slate-900">
                                ${product.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="block text-xs text-slate-500 font-medium">
                                ≈ {product.price_ves.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleWhatsApp}
                        disabled={!businessPhone}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageCircle size={18} />
                        Consultar por WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
}
