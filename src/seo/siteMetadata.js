export const SITE_NAME = 'BaroLab';
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://barolab.org').replace(/\/$/, '');
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-barolab.png`;

export function absoluteSiteUrl(pathOrUrl = '/') {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${SITE_URL}${path}`;
}

export function breadcrumbStructuredData(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: absoluteSiteUrl(item.path),
        })),
    };
}

export function plainTextExcerpt(value, maxLength = 158) {
    const text = String(value || '')
        .replace(/\[[^\]]+\]/g, ' ')
        .replace(/[#*_>`~|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
