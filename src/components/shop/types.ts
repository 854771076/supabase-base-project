export interface Category {
    id: string;
    name: string;
    slug: string;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    short_description?: string | null;
    price_cents: number;
    compare_at_price_cents: number | null;
    thumbnail_url: string | null;
    images?: string[];
    stock_quantity: number;
    sku?: string | null;
    category: Category | null;
    featured: boolean;
}
