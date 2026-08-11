import { useEffect, useState } from 'react';
import './ImageWithFallback.css';

function normalizeSource(src) {
    const normalized = String(src || '').trim();
    return normalized || null;
}

function UnavailableImageIcon() {
    return (
        <svg className="image-with-fallback-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <rect x="6.5" y="8.5" width="35" height="31" rx="3.5" />
            <circle cx="17" cy="19" r="3" />
            <path d="m10 34 9-9 6 6 5-5 8 8" />
            <path d="M10 10 38 38" />
        </svg>
    );
}

export default function ImageWithFallback({
    src,
    alt = '',
    className = '',
    fallbackClassName = '',
    fallbackLabel = 'Image unavailable',
    showFallbackLabel = true,
    onError,
    loading = 'lazy',
    decoding = 'async',
    ...imageProps
}) {
    const normalizedSrc = normalizeSource(src);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [normalizedSrc]);

    if (!normalizedSrc || failed) {
        const fallbackClasses = [
            'image-with-fallback',
            !showFallbackLabel ? 'image-with-fallback--compact' : '',
            className,
            fallbackClassName,
        ].filter(Boolean).join(' ');
        const accessibleLabel = alt
            ? `${alt}. ${fallbackLabel}`
            : fallbackLabel;

        return (
            <span
                className={fallbackClasses}
                data-image-state="unavailable"
                role="img"
                aria-label={accessibleLabel}
                title={!showFallbackLabel ? fallbackLabel : undefined}
            >
                <UnavailableImageIcon />
                {showFallbackLabel && (
                    <span className="image-with-fallback-label">{fallbackLabel}</span>
                )}
            </span>
        );
    }

    return (
        <img
            {...imageProps}
            className={className}
            src={normalizedSrc}
            alt={alt}
            loading={loading}
            decoding={decoding}
            onError={(event) => {
                onError?.(event);
                setFailed(true);
            }}
        />
    );
}
