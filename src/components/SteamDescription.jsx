import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { nodeText, parseSteamBbcode, sanitizeSteamUrl } from '../utils/steamBbcode';
import ImageWithFallback from './ImageWithFallback';
import './SteamDescription.css';

const BLOCK_TAGS = new Set([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'quote', 'code', 'list', 'olist', 'table',
    'center', 'right', 'spoiler', 'img', 'youtube', 'previewyoutube',
]);
const RAW_URL_PATTERN = /https?:\/\/[^\s<]+/gi;
const TRAILING_URL_PUNCTUATION = /[),.;!?]+$/;

function isBlockNode(node) {
    return node?.type === 'tag' && BLOCK_TAGS.has(node.tag);
}

function renderLinkedText(value, key) {
    const parts = String(value || '').split(RAW_URL_PATTERN);
    const matches = String(value || '').match(RAW_URL_PATTERN) || [];
    const rendered = [];

    parts.forEach((part, index) => {
        if (part) rendered.push(part);
        const rawMatch = matches[index];
        if (!rawMatch) return;

        const trailing = rawMatch.match(TRAILING_URL_PUNCTUATION)?.[0] || '';
        const label = trailing ? rawMatch.slice(0, -trailing.length) : rawMatch;
        const href = sanitizeSteamUrl(label);
        rendered.push(href ? (
            <a key={`${key}-url-${index}`} href={href} target="_blank" rel="noopener noreferrer nofollow">
                {label}
            </a>
        ) : label);
        if (trailing) rendered.push(trailing);
    });

    return rendered;
}

function renderTextNode(value, key, { trimLeadingBreak = false, trimTrailingBreak = false } = {}) {
    let normalized = String(value || '').replace(/\r\n?/g, '\n');
    if (trimLeadingBreak) normalized = normalized.replace(/^[ \t]*\n+/, '');
    if (trimTrailingBreak) normalized = normalized.replace(/\n+[ \t]*$/, '');

    return (
        <Fragment key={key}>
            {normalized.split(/(\n+)/).map((part, index) => {
                if (!part) return null;
                if (!part.startsWith('\n')) {
                    return <Fragment key={`${key}-text-${index}`}>{renderLinkedText(part, `${key}-${index}`)}</Fragment>;
                }
                if (part.length === 1) return <br key={`${key}-break-${index}`} />;
                return <span className="steam-description-paragraph-break" key={`${key}-gap-${index}`} aria-hidden="true" />;
            })}
        </Fragment>
    );
}

function renderChildren(nodes, path) {
    return nodes.map((node, index) => renderNode(node, `${path}-${index}`, {
        trimLeadingBreak: isBlockNode(nodes[index - 1]),
        trimTrailingBreak: isBlockNode(nodes[index + 1]),
    }));
}

function renderNode(node, key, textOptions) {
    if (node.type === 'text') return renderTextNode(node.value, key, textOptions);

    const children = renderChildren(node.children, key);
    switch (node.tag) {
        case 'h1': return <h2 key={key}>{children}</h2>;
        case 'h2': return <h3 key={key}>{children}</h3>;
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6': return <h4 key={key}>{children}</h4>;
        case 'b': return <strong key={key}>{children}</strong>;
        case 'i': return <em key={key}>{children}</em>;
        case 'u': return <u key={key}>{children}</u>;
        case 's':
        case 'strike': return <s key={key}>{children}</s>;
        case 'p': return <p key={key}>{children}</p>;
        case 'br': return <br key={key} />;
        case 'hr': return <hr key={key} />;
        case 'quote': return <blockquote key={key}>{children}</blockquote>;
        case 'code': return <pre key={key}><code>{nodeText(node.children)}</code></pre>;
        case 'noparse': return <span className="steam-description-noparse" key={key}>{nodeText(node.children)}</span>;
        case 'list': return <ul key={key}>{children}</ul>;
        case 'olist': return <ol key={key}>{children}</ol>;
        case 'li': return <li key={key}>{children}</li>;
        case 'table': return <div className="steam-description-table-wrap" key={key}><table><tbody>{children}</tbody></table></div>;
        case 'tr': return <tr key={key}>{children}</tr>;
        case 'th': return <th key={key}>{children}</th>;
        case 'td': return <td key={key}>{children}</td>;
        case 'center': return <div className="steam-description-center" key={key}>{children}</div>;
        case 'right': return <div className="steam-description-right" key={key}>{children}</div>;
        case 'spoiler': return (
            <details className="steam-description-spoiler" key={key}>
                <summary>Show spoiler</summary>
                <div>{children}</div>
            </details>
        );
        case 'url': {
            const href = sanitizeSteamUrl(node.attribute || nodeText(node.children));
            const label = nodeText(node.children);
            return href ? (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">
                    {label || href}
                </a>
            ) : <Fragment key={key}>{children}</Fragment>;
        }
        case 'img': {
            const src = sanitizeSteamUrl(node.attribute || nodeText(node.children));
            return (
                <ImageWithFallback
                    className="steam-description-image"
                    key={key}
                    src={src}
                    alt="Steam Workshop image"
                    fallbackLabel="Workshop image unavailable"
                    referrerPolicy="no-referrer"
                />
            );
        }
        case 'youtube':
        case 'previewyoutube': {
            const videoId = String(node.attribute || nodeText(node.children)).trim();
            const href = /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)
                ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
                : null;
            return href ? <a className="steam-description-video" key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">Watch video on YouTube</a> : null;
        }
        default: return <Fragment key={key}>{children}</Fragment>;
    }
}

export default function SteamDescription({ source, variant = 'mod', emptyText = 'No description.' }) {
    const nodes = useMemo(() => parseSteamBbcode(source), [source]);
    const viewportRef = useRef(null);
    const contentRef = useRef(null);
    const contentId = useId();
    const [expanded, setExpanded] = useState(false);
    const [isCollapsible, setIsCollapsible] = useState(false);

    useEffect(() => {
        setExpanded(false);
    }, [source]);

    useLayoutEffect(() => {
        if (expanded) return undefined;

        const measure = () => {
            const viewport = viewportRef.current;
            const content = contentRef.current;
            if (!viewport || !content) return;
            setIsCollapsible(content.scrollHeight > viewport.clientHeight + 1);
        };

        measure();
        const frame = window.requestAnimationFrame(measure);
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
        if (observer && contentRef.current) observer.observe(contentRef.current);
        window.addEventListener('resize', measure);

        return () => {
            window.cancelAnimationFrame(frame);
            observer?.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [expanded, source]);

    if (!String(source || '').trim()) {
        return <p className="steam-description-empty">{emptyText}</p>;
    }

    return (
        <div className="steam-description-shell" data-variant={variant}>
            <div
                className={`steam-description-viewport${isCollapsible && !expanded ? ' is-collapsed' : ''}`}
                data-collapsed={!expanded}
                data-overflowing={isCollapsible}
                id={contentId}
                ref={viewportRef}
            >
                <div className="steam-description" ref={contentRef}>
                    {renderChildren(nodes, 'steam-description')}
                </div>
            </div>
            {isCollapsible && (
                <button
                    className="steam-description-toggle"
                    type="button"
                    aria-controls={contentId}
                    aria-expanded={expanded}
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? 'Show less' : 'Show full description'}
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="m4 6 4 4 4-4" />
                    </svg>
                </button>
            )}
        </div>
    );
}
