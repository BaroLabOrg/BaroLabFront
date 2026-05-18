import { useEffect } from 'react';

/**
 * Sets document title and meta description for the current page.
 * Restores the default (from index.html) on unmount.
 *
 * @param {{ title?: string, description?: string }} options
 */
export default function useDocumentMeta({ title, description } = {}) {
    useEffect(() => {
        const prevTitle = document.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        const prevDesc = metaDesc?.getAttribute('content') ?? '';

        if (title) {
            document.title = title;
        }
        if (description && metaDesc) {
            metaDesc.setAttribute('content', description);
        }

        return () => {
            document.title = prevTitle;
            if (metaDesc) {
                metaDesc.setAttribute('content', prevDesc);
            }
        };
    }, [title, description]);
}
