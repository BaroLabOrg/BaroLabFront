import { useEffect, useState } from 'react';
import { searchInternalReferences } from '../../api/internalReferences';
import { buildInternalGuideLink, INTERNAL_REFERENCE_TYPES } from '../../utils/internalGuideLinks';
import './InternalLinkPicker.css';

function itemTitle(item) {
    return item?.title || item?.name || item?.slug || 'Untitled';
}

function itemDetail(type, item) {
    if (type === 'mod') return `Mod #${item.external_id ?? item.externalId}`;
    if (type === 'submarine') return item.submarineClass || item.submarine_class || 'Submarine';
    if (type === 'guide') {
        const author = item.author?.username || item.author?.login;
        return author ? `Guide by ${author}` : 'Guide';
    }
    return item.entityType || item.entity_type || 'Encyclopedia';
}

function itemImage(type, item) {
    if (type === 'encyclopedia') return item.primaryImageUrl || item.primary_image_url;
    return item.main_image || item.mainImage;
}

export default function InternalLinkPicker({ open, onClose, onSelect }) {
    const [type, setType] = useState('mod');
    const [query, setQuery] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const results = await searchInternalReferences(type, query);
                if (!cancelled) setItems(results);
            } catch (err) {
                if (!cancelled) {
                    setItems([]);
                    setError(err?.message || 'Failed to search BaroLab content');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 250);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [open, query, type]);

    useEffect(() => {
        if (!open) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, open]);

    if (!open) return null;

    return (
        <div className="internal-link-picker-overlay" onMouseDown={onClose}>
            <section
                className="internal-link-picker"
                role="dialog"
                aria-modal="true"
                aria-labelledby="internal-link-picker-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="internal-link-picker-header">
                    <div>
                        <span className="internal-link-picker-kicker">BaroLab reference</span>
                        <h3 id="internal-link-picker-title">Add internal link</h3>
                    </div>
                    <button type="button" className="internal-link-picker-close" onClick={onClose} aria-label="Close">×</button>
                </header>

                <div className="internal-link-picker-tabs" role="tablist" aria-label="Reference type">
                    {INTERNAL_REFERENCE_TYPES.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            role="tab"
                            aria-selected={type === entry.id}
                            className={type === entry.id ? 'active' : ''}
                            onClick={() => {
                                setType(entry.id);
                                setItems([]);
                            }}
                        >
                            {entry.label}
                        </button>
                    ))}
                </div>

                <input
                    autoFocus
                    type="search"
                    className="internal-link-picker-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`Search ${INTERNAL_REFERENCE_TYPES.find((entry) => entry.id === type)?.label.toLowerCase()}…`}
                    aria-label="Search BaroLab content"
                />

                <div className="internal-link-picker-results">
                    {loading ? (
                        <div className="internal-link-picker-state">Searching…</div>
                    ) : error ? (
                        <div className="internal-link-picker-state error">{error}</div>
                    ) : items.length === 0 ? (
                        <div className="internal-link-picker-state">No results found.</div>
                    ) : items.map((item) => {
                        const href = buildInternalGuideLink(type, item);
                        const image = itemImage(type, item);
                        if (!href) return null;
                        return (
                            <button
                                type="button"
                                className="internal-link-picker-result"
                                key={`${type}:${href}`}
                                onClick={() => onSelect({ href, title: itemTitle(item), type, item })}
                            >
                                <span className="internal-link-picker-result-image">
                                    {image ? <img src={image} alt="" referrerPolicy="no-referrer" /> : '◆'}
                                </span>
                                <span>
                                    <strong>{itemTitle(item)}</strong>
                                    <small>{itemDetail(type, item)}</small>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
