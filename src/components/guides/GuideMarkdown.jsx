import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadInternalReferencePreview } from '../../api/internalReferences';
import { parseInternalGuideLink } from '../../utils/internalGuideLinks';
import ImageWithFallback from '../ImageWithFallback';
import './GuideMarkdown.css';

function CustomQuote({ children }) {
    let text = '';
    let author = '';

    Children.forEach(children, (child) => {
        const content = child?.props?.children;
        const parts = Array.isArray(content) ? content : [content];
        const rawText = parts.filter((part) => typeof part === 'string').join('').trim();
        if (!rawText) return;
        const separatorIndex = rawText.lastIndexOf(' — ');
        if (separatorIndex >= 0) {
            text = rawText.slice(0, separatorIndex).trim();
            author = rawText.slice(separatorIndex + 3).trim();
        } else {
            text = rawText;
        }
    });

    if (!text) return <blockquote className="guide-quote">{children}</blockquote>;
    return (
        <blockquote className="guide-quote">
            <p className="quote-text">{text}</p>
            {author && <footer className="quote-author">— {author}</footer>}
        </blockquote>
    );
}

function CustomTable({ children, ...props }) {
    let isInfobox = false;
    try {
        const childArray = Children.toArray(children);
        const thead = childArray.find((child) => child.type === 'thead');
        const row = Children.toArray(thead?.props?.children)[0];
        const heading = Children.toArray(row?.props?.children)[0];
        isInfobox = String(heading?.props?.children || '').includes('INFOBOX:');
    } catch {
        isInfobox = false;
    }
    const stripInfoboxMarker = (node) => {
        if (typeof node === 'string') return node.replace(/^INFOBOX:\s*/i, '');
        if (!isValidElement(node)) return node;
        return cloneElement(node, node.props, Children.map(node.props.children, stripInfoboxMarker));
    };
    const renderedChildren = isInfobox
        ? Children.map(children, stripInfoboxMarker)
        : children;
    return <table className={isInfobox ? 'guide-infobox' : 'guide-table'} {...props}>{renderedChildren}</table>;
}

function calculatePosition(anchor) {
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const width = Math.min(280, viewportWidth - 24);
    const left = Math.min(
        Math.max(12, rect.left + (rect.width / 2) - (width / 2)),
        viewportWidth - width - 12,
    );
    const above = rect.top >= 124;
    return {
        left,
        top: above ? rect.top - 8 : rect.bottom + 8,
        width,
        transform: above ? 'translateY(-100%)' : 'none',
    };
}

function PreviewImage({ src }) {
    return (
        <ImageWithFallback
            src={src}
            alt="Reference preview"
            fallbackLabel="Image unavailable"
            showFallbackLabel={false}
            referrerPolicy="no-referrer"
        />
    );
}

function MarkdownImage({ src, alt = '' }) {
    return (
        <ImageWithFallback
            className="guide-markdown-image"
            src={src}
            alt={alt || 'Guide image'}
            fallbackLabel="Guide image unavailable"
            referrerPolicy="no-referrer"
        />
    );
}

function ReferenceTooltip({ anchorRef, reference, id }) {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(false);
    const [position, setPosition] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setPreview(null);
        setError(false);
        loadInternalReferencePreview(reference)
            .then((result) => {
                if (!cancelled) setPreview(result);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [reference]);

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

    return createPortal(
        <div id={id} role="tooltip" className="guide-reference-tooltip" style={position}>
            {error ? (
                <div className="guide-reference-unavailable">Preview unavailable</div>
            ) : !preview ? (
                <div className="guide-reference-loading">Loading preview…</div>
            ) : (
                <>
                    <div className="guide-reference-image">
                        <PreviewImage src={preview.imageUrl} />
                    </div>
                    <div className="guide-reference-copy">
                        <span className="guide-reference-kind">{preview.kind}</span>
                        <strong>{preview.title}</strong>
                        {preview.detail && <small>{preview.detail}</small>}
                        {preview.meta && <small>By {preview.meta}</small>}
                    </div>
                </>
            )}
        </div>,
        document.body,
    );
}

function InternalReferenceLink({ href, reference, children }) {
    const anchorRef = useRef(null);
    const timerRef = useRef(null);
    const [open, setOpen] = useState(false);
    const tooltipId = useId();

    const showSoon = () => {
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setOpen(true), 180);
    };
    const showNow = () => {
        window.clearTimeout(timerRef.current);
        setOpen(true);
    };
    const hide = () => {
        window.clearTimeout(timerRef.current);
        setOpen(false);
    };

    useEffect(() => () => window.clearTimeout(timerRef.current), []);

    return (
        <>
            <Link
                ref={anchorRef}
                to={href}
                className="guide-internal-reference"
                aria-describedby={open ? tooltipId : undefined}
                onMouseEnter={showSoon}
                onMouseLeave={hide}
                onFocus={showNow}
                onBlur={hide}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') hide();
                }}
            >
                {children}
            </Link>
            {open && <ReferenceTooltip anchorRef={anchorRef} reference={reference} id={tooltipId} />}
        </>
    );
}

function MarkdownLink({ href, children }) {
    const reference = parseInternalGuideLink(href);
    if (!reference) {
        return (
            <span className="guide-disabled-link" title="Only BaroLab internal links are allowed">
                {children}
            </span>
        );
    }
    return <InternalReferenceLink href={reference.href} reference={reference}>{children}</InternalReferenceLink>;
}

const MARKDOWN_COMPONENTS = {
    a: MarkdownLink,
    blockquote: CustomQuote,
    img: MarkdownImage,
    table: CustomTable,
};

function extractInfobox(markdown) {
    const lines = String(markdown || '').split(/\r?\n/);
    const start = lines.findIndex((line) => /^\s*\|\s*INFOBOX:/i.test(line));
    if (start < 0) return { infobox: '', body: lines.join('\n') };

    let end = start;
    while (end < lines.length && /^\s*\|/.test(lines[end])) end += 1;

    return {
        infobox: lines.slice(start, end).join('\n'),
        body: [...lines.slice(0, start), ...lines.slice(end)].join('\n').replace(/^\s+/, ''),
    };
}

export default function GuideMarkdown({ children, hoistInfobox = false }) {
    const source = String(children || '');
    const { infobox, body } = hoistInfobox
        ? extractInfobox(source)
        : { infobox: '', body: source };

    if (infobox) {
        return (
            <div className="guide-markdown-layout">
                <div className="guide-markdown-article">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                        {body}
                    </ReactMarkdown>
                </div>
                <aside className="guide-markdown-aside" aria-label="Guide infobox">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                        {infobox}
                    </ReactMarkdown>
                </aside>
            </div>
        );
    }

    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
            {body}
        </ReactMarkdown>
    );
}
