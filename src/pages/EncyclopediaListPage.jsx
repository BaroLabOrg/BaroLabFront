import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import {
    ENCYCLOPEDIA_ENTITY_SOURCES,
    ENCYCLOPEDIA_ENTITY_TYPES,
    getEncyclopediaList,
    searchEncyclopedia,
} from '../api/encyclopedia';
import Pagination from '../components/Pagination';
import EncyclopediaCard from '../components/EncyclopediaCard';
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

function normalizeModFilter(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? String(id) : '';
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
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const guideTargetMode = searchParams.get('guideTarget') === '1';

    const q = normalizeQuery(searchParams.get('q'));
    const entityType = normalizeEntityType(searchParams.get('entityType'));
    const entitySource = normalizeEntitySource(searchParams.get('entitySource'));
    const sortKey = normalizeSortKey(searchParams.get('sort'));
    const page = normalizePage(searchParams.get('page'));
    // Workshop id: "everything this mod adds", linked to from the mod's page
    const modFilter = normalizeModFilter(searchParams.get('mod'));
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
        const nextState = { q, entityType, entitySource, mod: modFilter, sort: sortKey, page, ...patch };
        const next = new URLSearchParams(searchParams);
        setParam(next, 'q', normalizeQuery(nextState.q));
        setParam(next, 'entityType', normalizeEntityType(nextState.entityType));
        setParam(next, 'entitySource', normalizeEntitySource(nextState.entitySource));
        setParam(next, 'mod', normalizeModFilter(nextState.mod));
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
                // Only the plain list endpoint knows about the mod filter --
                // the ranked search runs through Typesense, which does not
                // index which mod an entity came from.
                const load = modFilter ? getEncyclopediaList : searchEncyclopedia;
                const data = await load({
                    q,
                    entityType: entityType || undefined,
                    entitySource: entitySource || undefined,
                    mod: modFilter || undefined,
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
    }, [q, entityType, entitySource, modFilter, sortPreset.sortBy, sortPreset.direction, page]);

    return (
        <div className="page">
            <div className="container encyclopedia-list-page">
                <header className="encyclopedia-header-box">
                    <div className="encyclopedia-header-main">
                        <div className="encyclopedia-header-icon" aria-hidden="true">
                            <svg viewBox="0 0 28 24" focusable="false">
                                <path d="M14 5c-3-2-7-3-11-2v17c4-1 8 0 11 2 3-2 7-3 11-2V3c-4-1-8 0-11 2Z" />
                                <path d="M14 5v17M6 7h5M6 11h5M17 7h5M17 11h5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="encyclopedia-title">
                                {guideTargetMode ? 'Choose an encyclopedia subject' : 'Barotrauma Encyclopedia'}
                            </h1>
                            <p className="encyclopedia-subtitle">
                                {guideTargetMode
                                    ? 'Filter the reference index, then choose the subject your guide belongs to.'
                                    : 'A unified reference index for vanilla and modded entities, systems and locations.'}
                            </p>
                        </div>
                    </div>
                    <div className="encyclopedia-header-side">
                        <div className="encyclopedia-index-status">
                            <span>{Number(total).toLocaleString('en-US')}</span>
                            published entries
                        </div>
                    {guideTargetMode ? (
                        <div className="encyclopedia-level-actions">
                            <button className="btn btn-ghost" type="button" onClick={() => navigate('/guides/new')}>
                                ← Change guide type
                            </button>
                        </div>
                    ) : isAdmin && (
                        <div className="encyclopedia-level-actions">
                            <Link to="/admin/encyclopedia/new" className="btn btn-primary">Create page</Link>
                        </div>
                    )}
                    </div>
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

                <div className="encyclopedia-results-bar" aria-live="polite">
                    <span>{loading ? 'Reading reference index' : `${Number(total).toLocaleString('en-US')} matching entries`}</span>
                    <span>Page {page + 1} / {Math.max(totalPages, 1)}</span>
                </div>

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
                            <EncyclopediaCard
                                key={item.id || item.slug}
                                item={item}
                                actionLabel={guideTargetMode ? 'Write guide →' : 'Read article →'}
                                onSelect={guideTargetMode ? (selectedItem) => {
                                    navigate(`/guides/new/editor?targetType=ENCYCLOPEDIA&targetId=${encodeURIComponent(selectedItem.slug)}`);
                                } : undefined}
                            />
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
