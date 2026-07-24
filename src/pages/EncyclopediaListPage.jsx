import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import { ENCYCLOPEDIA_ENTITY_SOURCES, ENCYCLOPEDIA_ENTITY_TYPES, searchEncyclopedia } from '../api/encyclopedia';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './EncyclopediaListPage.css';

const PAGE_SIZE = 12;

const SORT_PRESETS = [
    { key: 'newest', label: 'Newest', sortBy: 'publishedAt', direction: 'desc' },
    { key: 'updated', label: 'Recently updated', sortBy: 'updatedAt', direction: 'desc' },
    { key: 'title', label: 'Title A→Z', sortBy: 'title', direction: 'asc' },
];
const DEFAULT_SORT_KEY = 'newest';

const ENTITY_SOURCE_LABELS = {
    VANILLA: 'Vanilla',
    MOD: 'Mod',
};

export function humanizeEnumLabel(value) {
    return String(value || '')
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}

function normalizeQuery(value) {
    return String(value || '').trim();
}

function normalizePage(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeEntityType(value) {
    return ENCYCLOPEDIA_ENTITY_TYPES.includes(value) ? value : '';
}

function normalizeEntitySource(value) {
    return ENCYCLOPEDIA_ENTITY_SOURCES.includes(value) ? value : '';
}

function normalizeSortKey(value) {
    return SORT_PRESETS.some((preset) => preset.key === value) ? value : DEFAULT_SORT_KEY;
}

function setParam(params, key, value) {
    if (value === undefined || value === null || value === '') {
        params.delete(key);
        return;
    }
    params.set(key, String(value));
}

export default function EncyclopediaListPage() {
    useDocumentMeta({
        title: 'Encyclopedia — BaroLab',
        description: 'Search the Barotrauma encyclopedia — vanilla and mod items, creatures, afflictions and more.',
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const { isAdmin } = useAuth();

    const q = normalizeQuery(searchParams.get('q'));
    const entityType = normalizeEntityType(searchParams.get('entityType'));
    const entitySource = normalizeEntitySource(searchParams.get('entitySource'));
    const sortKey = normalizeSortKey(searchParams.get('sort'));
    const page = normalizePage(searchParams.get('page'));
    const sortPreset = SORT_PRESETS.find((preset) => preset.key === sortKey) || SORT_PRESETS[0];

    const [searchInput, setSearchInput] = useState(q);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setSearchInput(q);
    }, [q]);

    const updateSearch = (patch = {}) => {
        const nextState = { q, entityType, entitySource, sort: sortKey, page, ...patch };
        const next = new URLSearchParams(searchParams);
        setParam(next, 'q', normalizeQuery(nextState.q));
        setParam(next, 'entityType', normalizeEntityType(nextState.entityType));
        setParam(next, 'entitySource', normalizeEntitySource(nextState.entitySource));
        setParam(next, 'sort', normalizeSortKey(nextState.sort) === DEFAULT_SORT_KEY ? '' : nextState.sort);
        setParam(next, 'page', Number(nextState.page) > 0 ? nextState.page : '');
        setSearchParams(next);
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await searchEncyclopedia({
                    q,
                    entityType: entityType || undefined,
                    entitySource: entitySource || undefined,
                    page,
                    size: PAGE_SIZE,
                    sortBy: sortPreset.sortBy,
                    direction: sortPreset.direction,
                });
                if (!cancelled) {
                    setItems(Array.isArray(data.items) ? data.items : []);
                    setTotal(data.total || 0);
                    setTotalPages(data.total_pages || 0);
                    setHasNext(Boolean(data.has_next));
                    setHasPrevious(Boolean(data.has_previous));
                }
            } catch (err) {
                if (!cancelled) {
                    setItems([]);
                    setTotal(0);
                    setTotalPages(0);
                    setHasNext(false);
                    setHasPrevious(false);
                    setError(mapPaginationError(err, 'Failed to load encyclopedia entries'));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [q, entityType, entitySource, sortPreset.sortBy, sortPreset.direction, page]);

    return (
        <div className="page">
            <div className="container encyclopedia-list-page">
                <header className="encyclopedia-header-box glass-card">
                    <h1 className="encyclopedia-title">📖 Barotrauma Encyclopedia</h1>
                    <p className="encyclopedia-subtitle">
                        Vanilla and mod content in one place — search by name, filter by type and source.
                    </p>
                    {isAdmin && (
                        <div className="encyclopedia-level-actions">
                            <Link to="/admin/encyclopedia/new" className="btn btn-primary">➕ Create page</Link>
                        </div>
                    )}
                </header>

                <section className="encyclopedia-search-panel glass-card">
                    <form
                        className="encyclopedia-search-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            updateSearch({ q: searchInput, page: 0 });
                        }}
                    >
                        <label htmlFor="encyclopedia-search-input">Search</label>
                        <div className="encyclopedia-search-row">
                            <input
                                id="encyclopedia-search-input"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search by name…"
                            />
                            <button className="btn btn-primary" type="submit" disabled={loading}>Search</button>
                            {q && (
                                <button
                                    className="btn btn-ghost"
                                    type="button"
                                    onClick={() => { setSearchInput(''); updateSearch({ q: '', page: 0 }); }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="encyclopedia-filter-row">
                        <span className="encyclopedia-filter-label">Source</span>
                        <div className="encyclopedia-chip-row">
                            <button
                                type="button"
                                className={`encyclopedia-chip ${!entitySource ? 'active' : ''}`}
                                onClick={() => updateSearch({ entitySource: '', page: 0 })}
                            >
                                All
                            </button>
                            {ENCYCLOPEDIA_ENTITY_SOURCES.map((source) => (
                                <button
                                    type="button"
                                    key={source}
                                    className={`encyclopedia-chip ${entitySource === source ? 'active' : ''}`}
                                    onClick={() => updateSearch({ entitySource: source, page: 0 })}
                                >
                                    {ENTITY_SOURCE_LABELS[source] || source}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="encyclopedia-filter-row">
                        <span className="encyclopedia-filter-label">Type</span>
                        <div className="encyclopedia-chip-row encyclopedia-chip-row-scroll">
                            <button
                                type="button"
                                className={`encyclopedia-chip ${!entityType ? 'active' : ''}`}
                                onClick={() => updateSearch({ entityType: '', page: 0 })}
                            >
                                All
                            </button>
                            {ENCYCLOPEDIA_ENTITY_TYPES.map((type) => (
                                <button
                                    type="button"
                                    key={type}
                                    className={`encyclopedia-chip ${entityType === type ? 'active' : ''}`}
                                    onClick={() => updateSearch({ entityType: type, page: 0 })}
                                >
                                    {humanizeEnumLabel(type)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="encyclopedia-filter-row">
                        <span className="encyclopedia-filter-label">Sort</span>
                        <div className="encyclopedia-chip-row">
                            {SORT_PRESETS.map((preset) => (
                                <button
                                    type="button"
                                    key={preset.key}
                                    className={`encyclopedia-chip ${sortKey === preset.key ? 'active' : ''}`}
                                    onClick={() => updateSearch({ sort: preset.key, page: 0 })}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {error && <div className="auth-error">{error}</div>}

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                    </div>
                ) : items.length === 0 ? (
                    <section className="encyclopedia-empty-state glass-card">
                        <p>{q ? `No results for "${q}".` : 'No published articles match these filters yet.'}</p>
                    </section>
                ) : (
                    <section className="encyclopedia-grid">
                        {items.map((item) => (
                            <article key={item.id || item.slug} className="encyclopedia-card glass-card">
                                <Link to={`/encyclopedia/${item.slug}`} className="encyclopedia-card-image-link">
                                    {item.primaryImageUrl ? (
                                        <img src={item.primaryImageUrl} alt={item.title} className="encyclopedia-card-image" />
                                    ) : (
                                        <div className="encyclopedia-card-image-placeholder">📄</div>
                                    )}
                                </Link>
                                <div className="encyclopedia-card-body">
                                    <p className="encyclopedia-card-meta">
                                        <span>{humanizeEnumLabel(item.entityType) || 'Other'}</span>
                                        <span
                                            className={`encyclopedia-source-badge encyclopedia-source-badge-${String(item.entitySource || '').toLowerCase()}`}
                                        >
                                            {ENTITY_SOURCE_LABELS[item.entitySource] || item.entitySource}
                                        </span>
                                    </p>
                                    <h2 className="encyclopedia-card-title">
                                        <Link to={`/encyclopedia/${item.slug}`}>{item.title}</Link>
                                    </h2>
                                    <p className="encyclopedia-card-description">
                                        {item.summary || item.shortDescription || 'Description is not available yet.'}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </section>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    disabled={loading}
                    onPageChange={(nextPage) => updateSearch({ page: nextPage })}
                />
                {!loading && items.length > 0 && <p className="encyclopedia-total-hint">Articles found: {total}</p>}
            </div>
        </div>
    );
}
