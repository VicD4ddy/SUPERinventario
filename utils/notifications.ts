import { SupabaseClient } from '@supabase/supabase-js'

export async function checkStockAlerts(supabase: SupabaseClient) {
    try {
        // 1. Get Low Stock Products (Reuse logic: stock <= min_stock OR 5)
        const { data: products } = await supabase
            .from('products')
            .select('id, name, stock, min_stock')

        if (!products) return

        const lowStock = products.filter((p: any) => p.stock <= (p.min_stock || 5))

        if (lowStock.length === 0) return

        // 2. Check if we already alerted TODAY about general low stock to avoid spam
        // We can check local storage or check recent notifications in DB if user_id is null (system wide)

        // For simplicity/robustness, let's just count how many notifications of this type exist for today?
        // Or simpler: Just create a "Daily Stock Alert" if not exists.

        const todayStr = new Date().toISOString().split('T')[0]
        const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('type', 'warning')
            .ilike('title', 'Alerta de Stock Bajo%')
            .gte('created_at', `${todayStr} 00:00:00`)
            .limit(1)

        if (existing && existing.length > 0) return // Already alerted today

        // 3. Create Notification
        // "3 productos bajo mínimo: Harina, Arroz..."
        const names = lowStock.map((p: any) => p.name).slice(0, 3).join(', ')
        const moreCount = lowStock.length - 3

        const message = `Atención: ${lowStock.length} productos tienen stock bajo: ${names}${moreCount > 0 ? ` y ${moreCount} más.` : '.'}`

        await supabase.from('notifications').insert({
            title: `Alerta de Stock Bajo (${todayStr})`,
            message: message,
            type: 'warning',
            link: '/inventory?filter=low_stock'
            // user_id left null for Global/Admin visibility
        })

    } catch (error) {
        console.error("Error checking stock alerts:", error)
    }
}
