import { useEffect } from 'react';
import { absoluteSiteUrl, DEFAULT_SOCIAL_IMAGE, SITE_NAME } from '../seo/siteMetadata';

/**
 * Sets route-specific search and social metadata, then restores the previous
 * document head on unmount. Query parameters are excluded from canonical URLs
 * unless a caller explicitly supplies a canonicalPath containing them.
 *
 * @param {{
 *   title?: string,
 *   description?: string,
 *   canonicalPath?: string,
 *   image?: string,
 *   type?: string,
 *   noIndex?: boolean,
 *   structuredData?: object|object[]
 * }} options
 */
export default function useDocumentMeta({
    title,
    description,
    canonicalPath,
    image,
    type = 'website',
    noIndex = false,
    structuredData,
} = {}) {
    const structuredDataJson = JSON.stringify(
        structuredData ? (Array.isArray(structuredData) ? structuredData : [structuredData]) : [],
    );

    useEffect(() => {
        const prevTitle = document.title;
        const changes = [];

        const upsertMeta = (attribute, key, content) => {
            if (!content) return;
            let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
            const created = !element;
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, key);
                document.head.appendChild(element);
            }
            changes.push({ element, created, previous: element.getAttribute('content') });
            element.setAttribute('content', content);
        };

        let canonical = document.head.querySelector('link[rel="canonical"]');
        const canonicalCreated = !canonical;
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        const previousCanonical = canonical.getAttribute('href');
        const canonicalUrl = absoluteSiteUrl(canonicalPath ?? window.location.pathname);
        canonical.setAttribute('href', canonicalUrl);

        if (title) {
            document.title = title;
        }

        const socialTitle = title || document.title;
        const socialDescription = description || '';
        const socialImage = absoluteSiteUrl(image || DEFAULT_SOCIAL_IMAGE);

        upsertMeta('name', 'description', socialDescription);
        upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
        upsertMeta('property', 'og:site_name', SITE_NAME);
        upsertMeta('property', 'og:type', type);
        upsertMeta('property', 'og:title', socialTitle);
        upsertMeta('property', 'og:description', socialDescription);
        upsertMeta('property', 'og:url', canonicalUrl);
        upsertMeta('property', 'og:image', socialImage);
        upsertMeta('property', 'og:image:width', '1200');
        upsertMeta('property', 'og:image:height', '630');
        upsertMeta('property', 'og:image:alt', `${SITE_NAME} — Barotrauma Database, Mods & Tools`);
        upsertMeta('name', 'twitter:card', 'summary_large_image');
        upsertMeta('name', 'twitter:title', socialTitle);
        upsertMeta('name', 'twitter:description', socialDescription);
        upsertMeta('name', 'twitter:image', socialImage);

        const jsonLdNodes = JSON.parse(structuredDataJson).map((entry) => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.dataset.routeSeo = 'true';
            script.textContent = JSON.stringify(entry);
            document.head.appendChild(script);
            return script;
        });

        return () => {
            document.title = prevTitle;
            if (canonicalCreated) canonical.remove();
            else if (previousCanonical === null) canonical.removeAttribute('href');
            else canonical.setAttribute('href', previousCanonical);

            changes.reverse().forEach(({ element, created, previous }) => {
                if (created) element.remove();
                else if (previous === null) element.removeAttribute('content');
                else element.setAttribute('content', previous);
            });
            jsonLdNodes.forEach((node) => node.remove());
        };
    }, [title, description, canonicalPath, image, type, noIndex, structuredDataJson]);
}
