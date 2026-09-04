import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { loadInternalReferencePreview } from '../api/internalReferences';
import ImageWithFallback from './ImageWithFallback';
import { humanizeIdentifier } from '../utils/text';

const PREVIEW_WIDTH = 360;
const PREVIEW_HEIGHT = 164;
const PREVIEW_GAP = 10;
const VIEWPORT_MARGIN = 12;

function relationImageUrl(relation) {
    return relation.primaryImage?.publicUrl
        || relation.primary_image?.public_url
        || relation.primaryImageUrl
        || relation.primary_image_url
        || null;
}

function initialPreview(relation) {
    return {
        title: relation.title || humanizeIdentifier(relation.slug),
        imageUrl: relationImageUrl(relation),
        detail: relation.entityType || relation.entity_type || '',
        summary: relation.summary || relation.shortDescription || relation.short_description || '',
    };
}

function calculatePosition(anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(PREVIEW_WIDTH, window.innerWidth - (VIEWPORT_MARGIN * 2));
    const left = Math.min(
        Math.max(VIEWPORT_MARGIN, rect.left + (rect.width / 2) - (width / 2)),
        window.innerWidth - width - VIEWPORT_MARGIN,
    );
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const placeAbove = spaceAbove >= PREVIEW_HEIGHT + PREVIEW_GAP || spaceAbove > spaceBelow;
    const idealTop = placeAbove
        ? rect.top - PREVIEW_HEIGHT - PREVIEW_GAP
        : rect.bottom + PREVIEW_GAP;
    const top = Math.min(
        Math.max(VIEWPORT_MARGIN, idealTop),
        window.innerHeight - PREVIEW_HEIGHT - VIEWPORT_MARGIN,
    );

    return { left, top, width };
}

function PreviewImage({ src, alt }) {
    return (
        <span aria-hidden="true">
            <ImageWithFallback
                src={src}
                alt={alt}
                fallbackLabel="Image unavailable"
                showFallbackLabel={false}
                referrerPolicy="no-referrer"
            />
        </span>
    );
}

function EntityPreviewTooltip({ anchorRef, id, preview, status }) {
    const [position, setPosition] = useState(null);

    useEffect(() => {
        const update = () => {
            if (anchorRef.current) setPosition(calculatePosition(anchorRef.current));
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [anchorRef]);

    if (!position) return null;

    const description = status === 'error'
        ? 'Preview is temporarily unavailable.'
        : (preview.summary || (status === 'loading'
            ? 'Loading description…'
            : 'No description is available in the game data.'));

    return createPortal(
        <div
            id={id}
            role="tooltip"
            className="encyclopedia-entity-tooltip"
            data-preview-status={status}
            style={position}
        >
            <div className="encyclopedia-entity-tooltip-image">
                <PreviewImage src={preview.imageUrl} alt={preview.title} />
            </div>
            <div className="encyclopedia-entity-tooltip-copy">
                <span className="encyclopedia-entity-tooltip-kind">
                    {preview.detail || 'Encyclopedia entry'}
                </span>
                <strong>{preview.title}</strong>
                <p>{description}</p>
                <span className="encyclopedia-entity-tooltip-action" aria-hidden="true">
                    Open entry
                </span>
            </div>
        </div>,
        document.body,
    );
}

export default function EncyclopediaEntityLink({ relation }) {
    const anchorRef = useRef(null);
    const timerRef = useRef(null);
    const requestRef = useRef(null);
    const mountedRef = useRef(true);
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState(() => initialPreview(relation));
    const [status, setStatus] = useState('idle');
    const tooltipId = useId();

    const loadPreview = useCallback(() => {
        if (requestRef.current) return requestRef.current;

        setStatus('loading');
        const request = loadInternalReferencePreview({
            type: 'encyclopedia',
            slug: relation.slug,
        })
            .then((result) => {
                if (mountedRef.current) {
                    setPreview((current) => ({ ...current, ...result }));
                    setStatus('ready');
                }
                return result;
            })
            .catch(() => {
                requestRef.current = null;
                if (mountedRef.current) setStatus('error');
                return null;
            });

        requestRef.current = request;
        return request;
    }, [relation.slug]);

    useEffect(() => {
        const anchor = anchorRef.current;
        if (!anchor || typeof IntersectionObserver === 'undefined') return undefined;

        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                loadPreview();
                observer.disconnect();
            }
        }, { rootMargin: '240px' });

        observer.observe(anchor);
        return () => observer.disconnect();
    }, [loadPreview]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            window.clearTimeout(timerRef.current);
        };
    }, []);

    const showSoon = () => {
        loadPreview();
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setOpen(true), 160);
    };

    const showNow = () => {
        loadPreview();
        window.clearTimeout(timerRef.current);
        setOpen(true);
    };

    const hide = () => {
        window.clearTimeout(timerRef.current);
        setOpen(false);
    };

    return (
        <>
            <Link
                ref={anchorRef}
                to={`/encyclopedia/${relation.slug}`}
                className="encyclopedia-entity-link"
                aria-describedby={open ? tooltipId : undefined}
                onMouseEnter={showSoon}
                onMouseLeave={hide}
                onFocus={showNow}
                onBlur={hide}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') hide();
                }}
            >
                <span className="encyclopedia-entity-link-image">
                    <PreviewImage src={preview.imageUrl} alt={preview.title} />
                </span>
                <span className="encyclopedia-entity-link-title">{preview.title}</span>
            </Link>
            {open && (
                <EntityPreviewTooltip
                    anchorRef={anchorRef}
                    id={tooltipId}
                    preview={preview}
                    status={status}
                />
            )}
        </>
    );
}
