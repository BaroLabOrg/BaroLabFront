import { useEffect, useState } from 'react';
import { searchInternalReferences } from '../../api/internalReferences';
import { buildInternalGuideLink, INTERNAL_REFERENCE_TYPES } from '../../utils/internalGuideLinks';
import { MOD_SORT_OPTIONS } from '../../utils/modSearch';
import ImageWithFallback from '../ImageWithFallback';
import './InternalLinkPicker.css';

const PAGE_SIZE = 12;
const compactNumberFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

function itemTitle(item) {
    return item?.title || item?.name || item?.slug || 'Untitled';
}

function itemDetail(type, item) {
    if (type === 'mod') {
        const externalId = item.external_id ?? item.externalId;
        const popularity = Number.isFinite(Number(item.popularity)) ? Number(item.popularity) : 0;
        const createdAt = item.created_at || item.createdAt;
        const createdDate = createdAt ? new Date(createdAt) : null;
        const published = createdDate && !Number.isNaN(createdDate.getTime())
            ? createdDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : null;
        return [
            `Mod #${externalId}`,
            `${compactNumberFormatter.format(popularity)} subscribers`,
            published,
        ].filter(Boolean).join(' · ');
    }
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
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [sortValue, setSortValue] = useState(MOD_SORT_OPTIONS[0].value);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const selectedSort = MOD_SORT_OPTIONS.find((option) => option.value === sortValue)
        || MOD_SORT_OPTIONS[0];

    useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const response = await searchInternalReferences(type, query, {
                    page,
                    size: PAGE_SIZE,
                    sortBy: type === 'mod' ? selectedSort.sortBy : undefined,
                    direction: type === 'mod' ? selectedSort.direction : undefined,
                });
                if (!cancelled) {
                    setItems(Array.isArray(response?.items) ? response.items : []);
                    setTotalPages(Number(response?.total_pages ?? response?.totalPages ?? 0) || 0);
                    setHasNext(Boolean(response?.has_next ?? response?.hasNext));
                    setHasPrevious(Boolean(response?.has_previous ?? response?.hasPrevious));
                }
            } catch (err) {
                if (!cancelled) {
                    setItems([]);
                    setTotalPages(0);
                    setHasNext(false);
                    setHasPrevious(false);
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
    }, [open, page, query, selectedSort.direction, selectedSort.sortBy, type]);

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
                                setPage(0);
                                setItems([]);
                            }}
                        >
                            {entry.label}
                        </button>
                    ))}
                </div>

                <div className={`internal-link-picker-controls${type === 'mod' ? ' has-sort' : ''}`}>
                    <label className="internal-link-picker-field internal-link-picker-search-field">
                        <span>Search {INTERNAL_REFERENCE_TYPES.find((entry) => entry.id === type)?.label.toLowerCase()}</span>
                        <input
                            autoFocus
                            type="search"
                            className="internal-link-picker-search"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(0);
                            }}
                            placeholder={`Enter ${type === 'mod' ? 'mod title' : 'search text'}…`}
                            aria-label="Search BaroLab content"
                        />
                    </label>

                    {type === 'mod' && (
                        <label className="internal-link-picker-field" htmlFor="internal-link-picker-sort">
                            <span>Sort mods</span>
                            <select
                                id="internal-link-picker-sort"
                                value={selectedSort.value}
                                disabled={loading}
                                onChange={(event) => {
                                    setSortValue(event.target.value);
                                    setPage(0);
                                }}
                            >
                                {MOD_SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>

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
                                    <ImageWithFallback
                                        src={image}
                                        alt={`${itemTitle(item)} preview`}
                                        fallbackLabel="Image unavailable"
                                        showFallbackLabel={false}
                                        referrerPolicy="no-referrer"
                                    />
                                </span>
                                <span>
                                    <strong>{itemTitle(item)}</strong>
                                    <small>{itemDetail(type, item)}</small>
                                </span>
                            </button>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <nav className="internal-link-picker-pagination" aria-label="Internal link results pagination">
                        <button
                            type="button"
                            disabled={loading || (!hasPrevious && page <= 0)}
                            onClick={() => setPage((current) => Math.max(0, current - 1))}
                        >
                            Back
                        </button>
                        <span>Page {page + 1} of {totalPages}</span>
                        <button
                            type="button"
                            disabled={loading || (!hasNext && page + 1 >= totalPages)}
                            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                        >
                            Next
                        </button>
                    </nav>
                )}
            </section>
        </div>
    );
}
