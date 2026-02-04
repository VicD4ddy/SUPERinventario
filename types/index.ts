export interface Product {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    stock: number;
    costUSD: number;
    priceUSD: number;
    description?: string;
    category?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Sale {
    id: string;
    date: Date;
    items: SaleItem[];
    totalUSD: number;
    totalVES: number;
    exchangeRate: number;
    paymentStatus?: 'paid' | 'partial' | 'pending' | 'completed'; // completed for payments
    paymentMethod?: string;
    amountPaidUSD?: number;
    amountPaidVES?: number;
    customerName?: string;
    customerPhone?: string;
    type?: 'sale' | 'payment' | 'expense' | 'supplier_payment'; // Discriminator
    note?: string; // For payments
    customerDebt?: number; // Snapshot or current debt
    paymentDetails?: Record<string, number>; // For mixed payments
}

export interface PaymentTransaction {
    id: string;
    customer_id: string;
    amount_usd: number;
    amount_ves: number;
    exchange_rate: number;
    transaction_date: string;
    note?: string;
    customers?: { name: string, phone: string }; // Join

}

export interface SaleItem {
    productId: string;
    quantity: number;
    priceAtSale: number;
    productName: string; // Helper for display
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    totalDebt?: number; // Added for Accounts Payable
    createdAt: Date;
}

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    totalDebt?: number; // Added for Credit Module
    debtSince?: Date; // Added for Debt Aging
    loyaltyPoints?: number; // Added for Loyalty System
    createdAt: Date;
}

export interface PurchaseOrder {
    id: string;
    supplierId: string;
    supplier?: Supplier; // Joined
    date: Date;
    status: 'pending' | 'received' | 'cancelled';
    totalAmount: number;
    notes?: string;
    paymentDueDate?: string;
    createdAt: Date;
}

export interface PurchaseItem {
    id: string;
    purchaseId: string;
    productId: string;
    product?: Product; // Joined
    quantity: number;
    unitCost: number;
    totalCost: number;
}

export interface StockMovement {
    id: string;
    product_id: string;
    type: 'IN' | 'OUT' | 'SALE' | 'ADJUSTMENT';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reference: string;
    created_at: string;
    user_id?: string;
    unit_cost?: number; // Snapshot of cost at time of movement
    notes?: string;
    products?: {
        name: string;
        sku: string;
    };
}

export interface ExpenseCategory {
    id: string;
    name: string;
    type: 'fixed' | 'variable';
    is_recurring: boolean;
    created_at: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    amount_ves: number;
    exchange_rate: number;
    category_id: string;
    category?: ExpenseCategory; // Joined
    date: string;
    payment_method: string;
    user_id?: string;
    receipt_url?: string;
    notes?: string;
    created_at: string;
}
