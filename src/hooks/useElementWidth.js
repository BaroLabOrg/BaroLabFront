import { useEffect, useRef, useState } from 'react';

/**
 * Tracks an element's content-box width (its clientWidth minus horizontal
 * padding), live, via ResizeObserver. Built for sizing embeds that only take
 * a fixed pixel width — like Google Identity Services' Sign In button, which
 * has no percentage/fluid width option and renders its actual content inside
 * a cross-origin iframe, so no amount of parent CSS can shrink it after the
 * fact. Measure first, then request the exact pixel width.
 *
 * @returns {[import('react').RefObject, number]} ref to attach, current width in px (0 until measured)
 */
export default function useElementWidth() {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        // Debounced: web-font swaps and other reflows in the first moments
        // after mount can fire this more than once as the layout settles.
        // Consumers that request a fixed pixel width from a live-resizing
        // container (Google Identity Services' Sign In button, notably)
        // re-render on every value, so avoid reporting transient sizes.
        let timeoutId;
        const observer = new ResizeObserver(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const style = window.getComputedStyle(el);
                const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
                setWidth((current) => {
                    const next = Math.max(0, Math.round(el.clientWidth - paddingX));
                    return next === current ? current : next;
                });
            }, 120);
        });
        observer.observe(el);
        return () => {
            clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, []);

    return [ref, width];
}
