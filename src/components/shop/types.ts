export interface Category {
    id: string;
    name: string;
    slug: string;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    sku: string | null;
    variant_name: string | null;
    price_cents: number;
    compare_at_price_cents: number | null;
    stock_quantity: number;
    attributes: Record<string, string>;
    images: string[];
    thumbnail_url: string | null;
    is_active: boolean;
    sort_order: number;
    weight_grams?: number | null;
    barcode?: string | null;
}

export interface VariantOption {
    id: string;
    product_id: string;
    option_name: string;
    option_values: string[];
    sort_order: number;
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    short_description?: string | null;
    thumbnail_url: string | null;
    category: Category | null;
    featured: boolean;
    has_variants?: boolean;
    // Computed from variants (returned by API)
    min_price_cents: number;
    max_price_cents: number;
    min_compare_at_price_cents: number | null;
    total_stock_quantity: number;
    variant_count: number;
    // Full variant data (only on detail page)
    variants?: ProductVariant[];
    variant_options?: VariantOption[];
}
