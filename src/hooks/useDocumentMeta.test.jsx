import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import useDocumentMeta from './useDocumentMeta';

describe('useDocumentMeta', () => {
    beforeEach(() => {
        document.head.innerHTML = `
            <title>BaroLab default</title>
            <meta name="description" content="Default description">
            <link rel="canonical" href="https://barolab.org/">
        `;
        window.history.replaceState({}, '', '/mods?page=3&sort=title');
    });

    afterEach(() => {
        document.head.innerHTML = '';
        window.history.replaceState({}, '', '/');
    });

    it('sets canonical, search and social metadata without query duplicates', () => {
        const { unmount } = renderHook(() => useDocumentMeta({
            title: 'Barotrauma Mods | BaroLab',
            description: 'Browse Barotrauma mods.',
        }));

        expect(document.title).toBe('Barotrauma Mods | BaroLab');
        expect(document.querySelector('meta[name="description"]')?.content)
            .toBe('Browse Barotrauma mods.');
        expect(document.querySelector('link[rel="canonical"]')?.href)
            .toBe('https://barolab.org/mods');
        expect(document.querySelector('meta[property="og:url"]')?.content)
            .toBe('https://barolab.org/mods');
        expect(document.querySelector('meta[property="og:image"]')?.content)
            .toBe('https://barolab.org/og-barolab.png');
        expect(document.querySelector('meta[name="robots"]')?.content).toBe('index, follow');

        unmount();
        expect(document.title).toBe('BaroLab default');
        expect(document.querySelector('link[rel="canonical"]')?.href)
            .toBe('https://barolab.org/');
    });

    it('adds noindex and route-specific structured data', () => {
        const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
        };
        const { unmount } = renderHook(() => useDocumentMeta({
            title: 'Private page | BaroLab',
            description: 'Private tools.',
            noIndex: true,
            structuredData,
        }));

        expect(document.querySelector('meta[name="robots"]')?.content).toBe('noindex, nofollow');
        const script = document.querySelector('script[data-route-seo="true"]');
        expect(JSON.parse(script?.textContent || '{}')).toEqual(structuredData);

        unmount();
        expect(document.querySelector('script[data-route-seo="true"]')).toBeNull();
        expect(document.querySelector('meta[name="robots"]')).toBeNull();
    });
});
