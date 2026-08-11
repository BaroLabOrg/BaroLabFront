import { Fragment, useMemo } from 'react';
import { nodeText, parseSteamBbcode, sanitizeSteamUrl } from '../utils/steamBbcode';
import ImageWithFallback from './ImageWithFallback';
import './SteamDescription.css';

function renderChildren(nodes, path) {
    return nodes.map((node, index) => renderNode(node, `${path}-${index}`));
}

function renderNode(node, key) {
    if (node.type === 'text') return <Fragment key={key}>{node.value}</Fragment>;

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
        case 'noparse': return <Fragment key={key}>{nodeText(node.children)}</Fragment>;
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
            return href ? (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow">
                    {children.length ? children : href}
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

    if (!String(source || '').trim()) {
        return <p className="steam-description-empty">{emptyText}</p>;
    }

    return (
        <div className="steam-description" data-variant={variant}>
            {renderChildren(nodes, 'steam-description')}
        </div>
    );
}
