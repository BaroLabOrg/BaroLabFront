import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mapPaginationError } from '../api/api';
import * as modsApi from '../api/mods';
import * as tagsApi from '../api/tags';
import ModCard from '../components/ModCard';
import Pagination from '../components/Pagination';
import TagChips from '../components/TagChips';
import './ModsListPage.css';

const PAGE_SIZE = 12;
const TAGS_PAGE_SIZE = 100;
const MODS_SORT_BY = 'createdAt';
const MODS_DIRECTION = 'desc';

function normalizePage(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) return 0;
    return parsed;
}

function normalizeQuery(value) {
    return String(value || '').trim();
}

function parseTags(searchParams) {
    const rawValues = searchParams.getAll('tags');
    const values = rawValues.flatMap((value) =>
        String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
    );

    return [...new Set(values)];
}

function getTagFilterValue(tag) {
    return String(tag?.slug || tag?.name || '').trim();
}

export default function ModsListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const query = normalizeQuery(searchParams.get('q'));
    const selectedTags = parseTags(searchParams);
    const selectedTagsKey = selectedTags.join(',');
    const page = normalizePage(searchParams.get('page'));

    const [mods, setMods] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [totalMods, setTotalMods] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState(query);

    const [allTags, setAllTags] = useState([]);
    const [tagToAdd, setTagToAdd] = useState('');
    const [tagsLoading, setTagsLoading] = useState(true);
    const [tagsError, setTagsError] = useState('');

    // Create mod state
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [mainImage, setMainImage] = useState('');
    const [additionalImages, setAdditionalImages] = useState('');
    const [requiredMods, setRequiredMods] = useState('');
    const [modsAbove, setModsAbove] = useState('');
    const [creating, setCreating] = useState(false);

    const updateSearch = (nextValues = {}) => {
        const nextQuery = normalizeQuery(nextValues.q ?? query);
        const nextPage = normalizePage(nextValues.page ?? page);
        const nextTags = [...new Set((nextValues.tags ?? selectedTags)
            .map((tag) => String(tag || '').trim())
            .filter(Boolean))];

        const nextParams = new URLSearchParams(searchParams);

        if (nextQuery) {
            nextParams.set('q', nextQuery);
        } else {
            nextParams.delete('q');
        }

        if (nextTags.length > 0) {
            nextParams.set('tags', nextTags.join(','));
        } else {
            nextParams.delete('tags');
        }

        if (nextPage > 0) {
            nextParams.set('page', String(nextPage));
        } else {
            nextParams.delete('page');
        }

        setSearchParams(nextParams);
    };

    const loadMods = async ({ currentQuery, currentTags, currentPage }) => {
        setLoading(true);
        setError('');
        try {
            const data = await modsApi.searchMods({
                q: currentQuery,
                tags: currentTags,
                page: currentPage,
                size: PAGE_SIZE,
                sortBy: MODS_SORT_BY,
                direction: MODS_DIRECTION,
            });
            setMods(data.items);
            setTotalMods(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setMods([]);
            setTotalMods(0);
            setTotalPages(0);
            setHasNext(false);
            setHasPrevious(false);
            setError(mapPaginationError(err, 'Failed to load mods'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    useEffect(() => {
        loadMods({
            currentQuery: query,
            currentTags: selectedTags,
            currentPage: page,
        });
    }, [query, selectedTagsKey, page]);

    useEffect(() => {
        let cancelled = false;

        const loadTags = async () => {
            setTagsLoading(true);
            setTagsError('');
            try {
                const data = await tagsApi.getTags({
                    page: 0,
                    size: TAGS_PAGE_SIZE,
                    sortBy: 'name',
                    direction: 'asc',
                });

                if (!cancelled) {
                    setAllTags(Array.isArray(data.items) ? data.items : []);
                }
            } catch (err) {
                if (!cancelled) {
                    setAllTags([]);
                    setTagsError(mapPaginationError(err, 'Failed to load tags'));
                }
            } finally {
                if (!cancelled) {
                    setTagsLoading(false);
                }
            }
        };

        loadTags();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        updateSearch({
            q: searchInput,
            tags: selectedTags,
            page: 0,
        });
    };

    const handlePageChange = (nextPage) => {
        updateSearch({
            q: query,
            tags: selectedTags,
            page: nextPage,
        });
    };

    const handleAddTagFilter = () => {
        if (!tagToAdd || selectedTags.includes(tagToAdd)) return;
        updateSearch({
            q: query,
            tags: [...selectedTags, tagToAdd],
            page: 0,
        });
        setTagToAdd('');
    };

    const handleRemoveTagFilter = (tagValue) => {
        updateSearch({
            q: query,
            tags: selectedTags.filter((tag) => tag !== tagValue),
            page: 0,
        });
    };

    const handleResetFilters = () => {
        setSearchInput('');
        setTagToAdd('');

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('q');
        nextParams.delete('tags');
        nextParams.delete('page');
        setSearchParams(nextParams);
    };

    const handleCreateMod = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');
        try {
            const parsedAdditional = additionalImages ? additionalImages.split(',').map(s => s.trim()).filter(Boolean) : [];
            const parsedRequired = requiredMods ? requiredMods.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : [];
            const parsedModsAbove = modsAbove ? modsAbove.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : [];

            await modsApi.createMod(title, description, externalUrl, mainImage, parsedAdditional, parsedRequired, parsedModsAbove);
            setTitle('');
            setDescription('');
            setExternalUrl('');
            setMainImage('');
            setAdditionalImages('');
            setRequiredMods('');
            setModsAbove('');
            setShowForm(false);
            if (page === 0) {
                await loadMods({
                    currentQuery: query,
                    currentTags: selectedTags,
                    currentPage: 0,
                });
            } else {
                updateSearch({
                    q: query,
                    tags: selectedTags,
                    page: 0,
                });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const hasActiveFilters = query.length > 0 || selectedTags.length > 0 || page > 0;
    const selectableTags = allTags.filter((tag) => {
        const value = getTagFilterValue(tag);
        return value && !selectedTags.includes(value);
    });

    const selectedTagObjects = selectedTags.map((value) => {
        const selectedTag = allTags.find((tag) => getTagFilterValue(tag) === value);
        if (selectedTag) {
            return {
                id: value,
                name: selectedTag.name || selectedTag.slug || value,
                slug: selectedTag.slug || value,
            };
        }

        return {
            id: value,
            name: value,
            slug: value,
        };
    });

    return (
        <div className="page">
            <div className="container">
                <div className="mods-header-box glass-card shine">
                    <h1 className="mods-title">🔧 Mods Library</h1>
                    <p className="mods-subtitle">
                        Community Steam Workshop mods · total: {totalMods}
                    </p>
                    {isAuthenticated ? (
                        <div className="mods-actions" style={{ marginTop: '1.5rem' }}>
                            <button
                                id="create-mod-toggle"
                                className="btn btn-primary"
                                onClick={() => setShowForm(!showForm)}
                            >
                                {showForm ? '✕ Close' : '➕ Add mod'}
                            </button>
                        </div>
                    ) : (
                        <p className="auth-prompt" style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                            <Link to="/login" className="auth-link">Log in</Link> or{' '}
                            <Link to="/sign-up" className="auth-link">sign up</Link> to add mods.
                        </p>
                    )}
                </div>

                <section className="mods-search-panel glass-card">
                    <form className="mods-search-form" onSubmit={handleSearchSubmit}>
                        <label className="mods-search-label" htmlFor="mods-search-input">
                            Search by mod name
                        </label>
                        <div className="mods-search-row">
                            <input
                                id="mods-search-input"
                                type="text"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Enter mod name"
                                autoComplete="off"
                            />
                            <button className="btn btn-primary" type="submit" disabled={loading || creating}>
                                Search
                            </button>
                            <button
                                className="btn btn-ghost"
                                type="button"
                                disabled={!hasActiveFilters || loading || creating}
                                onClick={handleResetFilters}
                            >
                                Reset
                            </button>
                        </div>
                    </form>

                    <div className="mods-tags-filter">
                        <label className="mods-search-label" htmlFor="mods-tag-select">
                            Filter by tags
                        </label>
                        <div className="mods-tag-row">
                            <select
                                id="mods-tag-select"
                                value={tagToAdd}
                                onChange={(event) => setTagToAdd(event.target.value)}
                                disabled={tagsLoading || selectableTags.length === 0}
                            >
                                <option value="">Select tag</option>
                                {selectableTags.map((tag) => {
                                    const value = getTagFilterValue(tag);
                                    return (
                                        <option key={tag.id || value} value={value}>
                                            {tag.name || value}
                                        </option>
                                    );
                                })}
                            </select>
                            <button
                                className="btn btn-ghost"
                                type="button"
                                onClick={handleAddTagFilter}
                                disabled={!tagToAdd || loading || creating}
                            >
                                Add tag
                            </button>
                        </div>

                        {tagsLoading && <p className="mods-tags-meta">Loading tags...</p>}
                        {tagsError && <p className="mods-tags-error">{tagsError}</p>}

                        <div className="mods-selected-tags">
                            <span className="mods-tags-meta">Selected tags</span>
                            <TagChips
                                tags={selectedTagObjects}
                                showRemoveButton
                                onRemove={handleRemoveTagFilter}
                            />
                        </div>
                    </div>
                </section>

                {isAuthenticated && showForm && (
                    <form className="create-mod-form glass-card fade-in" onSubmit={handleCreateMod}>
                        <h3 className="form-title">Add mod</h3>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input
                                id="mod-title-input"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Mod title"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                id="mod-content-input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mod description"
                                required
                                rows="4"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Steam Workshop URL</label>
                            <input
                                id="mod-url-input"
                                type="url"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                placeholder="https://steamcommunity.com/sharedfiles/filedetails/?id=..."
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Main image (URL)</label>
                            <input
                                id="mod-main-image-input"
                                type="url"
                                value={mainImage}
                                onChange={(e) => setMainImage(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Additional images (URLs, comma-separated)</label>
                            <input
                                id="mod-additional-images-input"
                                type="text"
                                value={additionalImages}
                                onChange={(e) => setAdditionalImages(e.target.value)}
                                placeholder="https://img1.jpg, https://img2.jpg"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Required mods (Steam IDs, comma-separated)</label>
                            <input
                                id="mod-required-input"
                                type="text"
                                value={requiredMods}
                                onChange={(e) => setRequiredMods(e.target.value)}
                                placeholder="12345678, 87654321"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mods above (Steam IDs, comma-separated)</label>
                            <input
                                id="mod-above-input"
                                type="text"
                                value={modsAbove}
                                onChange={(e) => setModsAbove(e.target.value)}
                                placeholder="11223344"
                            />
                        </div>
                        <button
                            id="submit-mod"
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating}
                        >
                            {creating ? 'Publishing...' : 'Publish'}
                        </button>
                    </form>
                )}

                {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Loading mods...</p>
                    </div>
                ) : mods.length === 0 ? (
                    <div className="empty-state fade-in">
                        <span className="empty-icon">🔧</span>
                        <p>No mods found for the current query.</p>
                    </div>
                ) : (
                    <div className="mods-grid">
                        {mods.map((mod, i) => (
                            <ModCard
                                key={mod.id || mod.external_id || mod.externalId}
                                mod={mod}
                                style={{ animationDelay: `${i * 0.05}s` }}
                            />
                        ))}
                    </div>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    disabled={loading || creating}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
}
