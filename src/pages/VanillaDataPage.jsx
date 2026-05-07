import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CONTENT_TYPES, ITEM_CATEGORIES, listVanillaContent, getVanillaContentByIdentifier } from '../api/vanillaData.js';
import { API_BASE } from '../api/api.js';
import Pagination from '../components/Pagination';
import './VanillaDataPage.css';

function iconUrl(key) {
    if (!key) return null;
    return `${API_BASE}api/v1/assets/icon?key=${encodeURIComponent(key)}`;
}

const PAGE_SIZE = 20;

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function JsonViewer({ data }) {
    const [collapsed, setCollapsed] = useState(false);
    if (data === null || data === undefined) return <span className="vd-null">null</span>;
    const text = JSON.stringify(data, null, 2);
    const lines = text.split('\n');
    return (
        <div className="vd-json-viewer">
            <pre className="vd-json-pre">{collapsed ? lines.slice(0, 4).join('\n') + (lines.length > 4 ? '\n  ...' : '') : text}</pre>
            {lines.length > 4 && (
                <button className="vd-json-toggle btn btn-ghost btn-sm" onClick={() => setCollapsed(c => !c)}>
                    {collapsed ? '▼ expand' : '▲ collapse'}
                </button>
            )}
        </div>
    );
}

function DetailModal({ item, onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    if (!item) return null;

    return (
        <div className="vd-modal-overlay" onClick={onClose}>
            <div className="vd-modal glass-card" onClick={e => e.stopPropagation()}>
                <div className="vd-modal-header">
                    <div className="vd-modal-title-row">
                        {item.icon_s3_key && (
                            <img
                                className="vd-modal-icon"
                                src={iconUrl(item.icon_s3_key)}
                                alt={item.display_name || item.identifier}
                                onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}
                        <div>
                            <h2 className="vd-modal-title">{item.display_name || item.identifier}</h2>
                            <span className="vd-modal-identifier">{item.identifier}</span>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm vd-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="vd-modal-body">
                    {item.display_description && (
                        <p className="vd-modal-desc">{item.display_description}</p>
                    )}
                    <div className="vd-modal-meta">
                        {item.source_file && (
                            <div className="vd-meta-row">
                                <span className="vd-meta-label">Source file</span>
                                <span className="vd-meta-value vd-mono">{item.source_file}</span>
                            </div>
                        )}
                        {item.variant_of && (
                            <div className="vd-meta-row">
                                <span className="vd-meta-label">Variant of</span>
                                <span className="vd-meta-value vd-mono">{item.variant_of}</span>
                            </div>
                        )}
                        <div className="vd-meta-row">
                            <span className="vd-meta-label">Created</span>
                            <span className="vd-meta-value">{formatDate(item.created_at)}</span>
                        </div>
                        <div className="vd-meta-row">
                            <span className="vd-meta-label">Updated</span>
                            <span className="vd-meta-value">{formatDate(item.updated_at)}</span>
                        </div>
                    </div>
                    <div className="vd-modal-payload">
                        <p className="vd-payload-label">payload_json</p>
                        <JsonViewer data={item.payload_json} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContentTab({ typePath }) {
    const isItems = typePath === 'items';

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [page, setPage] = useState(0);
    const [searchDraft, setSearchDraft] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const load = useCallback(async (targetPage, q, category) => {
        setLoading(true);
        setError('');
        try {
            const data = await listVanillaContent(typePath, {
                page: targetPage,
                size: PAGE_SIZE,
                sortBy: 'identifier',
                direction: 'asc',
                q: q || undefined,
                category: category || undefined,
            });
            setItems(data.items);
            setTotal(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setError(err?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [typePath]);

    useEffect(() => {
        setPage(0);
        setSearchDraft('');
        setAppliedSearch('');
        setActiveCategory('');
        setItems([]);
        setSelectedItem(null);
    }, [typePath]);

    useEffect(() => {
        load(page, appliedSearch, activeCategory);
    }, [page, appliedSearch, activeCategory, load]);

    const handleSearch = () => {
        setAppliedSearch(searchDraft);
        setPage(0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleClear = () => {
        setSearchDraft('');
        setAppliedSearch('');
        setPage(0);
    };

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        setPage(0);
    };

    const handleRowClick = async (identifier) => {
        setDetailLoading(true);
        try {
            const detail = await getVanillaContentByIdentifier(typePath, identifier);
            setSelectedItem(detail);
        } catch (err) {
            setError(err?.message || 'Failed to load detail');
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="vd-tab-content">
            {selectedItem && (
                <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}

            <div className="vd-toolbar glass-card">
                <div className="vd-search-row">
                    <input
                        className="vd-search-input"
                        type="search"
                        placeholder="Search by identifier or display name…"
                        value={searchDraft}
                        onChange={e => setSearchDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleSearch} disabled={loading}>
                        Search
                    </button>
                    {appliedSearch && (
                        <button className="btn btn-outline btn-sm" onClick={handleClear}>
                            Clear
                        </button>
                    )}
                </div>
                {isItems && (
                    <div className="vd-category-row">
                        {ITEM_CATEGORIES.map(cat => (
                            <button
                                key={cat.key}
                                className={`vd-category-btn ${activeCategory === cat.key ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(cat.key)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}
                <p className="vd-toolbar-hint">
                    {total > 0
                        ? <><strong className="vd-hint-count">{total}</strong> records · <span className="vd-hint-action">↗ click a row to inspect payload</span></>
                        : 'No records ingested yet for this type'}
                </p>
            </div>

            {error && <div className="auth-error vd-error">{error}</div>}

            {loading ? (
                <div className="loading-state">
                    <div className="loading-spinner" />
                </div>
            ) : items.length === 0 ? (
                <div className="vd-empty">
                    {appliedSearch
                        ? `No results for "${appliedSearch}"`
                        : 'No data ingested yet. Run the vanilla pipeline first.'}
                </div>
            ) : (
                <div className="vd-table-wrap">
                    <table className="vd-table">
                        <thead>
                            <tr>
                                <th>Identifier</th>
                                <th>Display Name</th>
                                <th>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr
                                    key={item.id || item.identifier}
                                    className={`vd-row ${detailLoading ? 'vd-row-loading' : ''}`}
                                    onClick={() => handleRowClick(item.identifier)}
                                    title="Click to inspect payload"
                                >
                                    <td className="vd-cell-identifier vd-mono">{item.identifier}</td>
                                    <td className="vd-cell-name">{item.display_name || <span className="vd-null">—</span>}</td>
                                    <td className="vd-cell-date">{formatDate(item.updated_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination
                page={page}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                disabled={loading}
                onPageChange={setPage}
            />
        </div>
    );
}

export default function VanillaDataPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeKey = searchParams.get('type') || CONTENT_TYPES[0].key;
    const activeType = CONTENT_TYPES.find(t => t.key === activeKey) || CONTENT_TYPES[0];

    const setActiveKey = (key) => {
        setSearchParams({ type: key });
    };

    return (
        <div className="page">
            <div className="container">
                <div className="vd-header">
                    <h1 className="page-title">◈ Vanilla Data</h1>
                    <p className="page-subtitle">
                        Read-only view of ingested Barotrauma vanilla content — {CONTENT_TYPES.length} content types
                    </p>
                </div>

                <div className="vd-tabs-wrap">
                    <div className="vd-tabs">
                        {CONTENT_TYPES.map(t => (
                            <button
                                key={t.key}
                                className={`vd-tab ${activeKey === t.key ? 'active' : ''}`}
                                onClick={() => setActiveKey(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="vd-content fade-in" key={activeKey}>
                    <ContentTab typePath={activeType.path} />
                </div>
            </div>
        </div>
    );
}
