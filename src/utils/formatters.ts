/**
 * Format price to Vietnamese currency (VND)
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
}

/**
 * Format date to Vietnamese date format
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

/**
 * Format date and time to Vietnamese format
 */
export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

/**
 * Get display image URL from product data
 */
export function getProductImage(product: {
    imageUrl?: string | string[];
    image_url?: string;
    image?: string;
}): string {
    if (product.image_url) return product.image_url;
    if (Array.isArray(product.imageUrl)) return product.imageUrl[0] ?? '';
    if (product.imageUrl) return product.imageUrl;
    if (product.image) return product.image;
    return 'https://placehold.co/300x300/FFF0F7/E91E8C?text=Sữa';
}

/**
 * Get discount percentage between original and sale price
 */
export function getDiscountPercent(price: number, salePrice?: number): number {
    if (!salePrice || salePrice >= price) return 0;
    return Math.round((1 - salePrice / price) * 100);
}
