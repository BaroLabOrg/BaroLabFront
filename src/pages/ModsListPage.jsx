import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import * as modsApi from '../api/mods';
import * as tagsApi from '../api/tags';
import ModCard from '../components/ModCard';
import Pagination from '../components/Pagination';
import TagChips from '../components/TagChips';
import useDocumentMeta from '../hooks/useDocumentMeta';
import {
    DEFAULT_MOD_SORT_BY,
    DEFAULT_MOD_SORT_DIRECTION,
    MOD_SORT_OPTIONS,
    normalizeModSort,
} from '../utils/modSearch';
import './ModsListPage.css';

const PAGE_SIZE = 12;
const TAGS_PAGE_SIZE = 100;

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
    useDocumentMeta({
        title: 'Mods — BaroLab',
        description: 'Browse and discover Barotrauma mods. Find custom weapons, overhauls, creatures and more on BaroLab.',
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const guideTargetMode = searchParams.get('guideTarget') === '1';
    const query = normalizeQuery(searchParams.get('q'));
    const selectedTags = parseTags(searchParams);
    const selectedTagsKey = selectedTags.join(',');
    const page = normalizePage(searchParams.get('page'));
    const selectedSort = normalizeModSort(
        searchParams.get('sortBy') || DEFAULT_MOD_SORT_BY,
        searchParams.get('direction') || DEFAULT_MOD_SORT_DIRECTION,
    );
    const sortBy = selectedSort.sortBy;
    const direction = selectedSort.direction;

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

    const updateSearch = (nextValues = {}) => {
        const nextQuery = normalizeQuery(nextValues.q ?? query);
        const nextPage = normalizePage(nextValues.page ?? page);
        const nextTags = [...new Set((nextValues.tags ?? selectedTags)
            .map((tag) => String(tag || '').trim())
            .filter(Boolean))];
        const nextSort = normalizeModSort(
            nextValues.sortBy ?? sortBy,
            nextValues.direction ?? direction,
        );

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

        if (nextSort.sortBy === DEFAULT_MOD_SORT_BY && nextSort.direction === DEFAULT_MOD_SORT_DIRECTION) {
            nextParams.delete('sortBy');
            nextParams.delete('direction');
        } else {
            nextParams.set('sortBy', nextSort.sortBy);
            nextParams.set('direction', nextSort.direction);
        }

        setSearchParams(nextParams);
    };

    const loadMods = async ({ currentQuery, currentTags, currentPage, currentSortBy, currentDirection }) => {
        setLoading(true);
        setError('');
        try {
            const data = await modsApi.searchMods({
                q: currentQuery,
                tags: currentTags,
                page: currentPage,
                size: PAGE_SIZE,
                sortBy: currentSortBy,
                direction: currentDirection,
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
            currentSortBy: sortBy,
            currentDirection: direction,
        });
    }, [query, selectedTagsKey, page, sortBy, direction]);

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

    const handleSortChange = (event) => {
        const nextSort = MOD_SORT_OPTIONS.find((option) => option.value === event.target.value)
            || MOD_SORT_OPTIONS[0];
        updateSearch({
            q: query,
            tags: selectedTags,
            page: 0,
            sortBy: nextSort.sortBy,
            direction: nextSort.direction,
        });
    };

    const handleResetFilters = () => {
        setSearchInput('');
        setTagToAdd('');

        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('q');
        nextParams.delete('tags');
        nextParams.delete('page');
        nextParams.delete('sortBy');
        nextParams.delete('direction');
        setSearchParams(nextParams);
    };

    const hasActiveFilters = query.length > 0
        || selectedTags.length > 0
        || page > 0
        || sortBy !== DEFAULT_MOD_SORT_BY
        || direction !== DEFAULT_MOD_SORT_DIRECTION;
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
        <div className="page page--mods">
            <div className="container">
                <header className="mods-header-box">
                    <div className="mods-header-main">
                        <div className="mods-header-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                                <path d="M8 4h8M6 8h12M5 12h14M7 16h10M9 20h6" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="mods-title">{guideTargetMode ? 'Choose a mod for your guide' : 'Mods Library'}</h1>
                            <p className="mods-subtitle">
                                {guideTargetMode
                                    ? 'Use the workshop index, then choose the mod your guide belongs to.'
                                    : 'Search the community workshop by title, tags and activity.'}
                            </p>
                        </div>
                    </div>
                    <div className="mods-header-status">
                        <span>{Number(totalMods).toLocaleString('en-US')}</span>
                        indexed records
                    </div>
                    {guideTargetMode && (
                        <div className="mods-actions">
                            <button className="btn btn-ghost" type="button" onClick={() => navigate('/guides/new')}>
                                ← Change guide type
                            </button>
                        </div>
                    )}
                </header>

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
                            <button className="btn btn-primary" type="submit" disabled={loading}>
                                Search
                            </button>
                            <button
                                className="btn btn-ghost"
                                type="button"
                                disabled={!hasActiveFilters || loading}
                                onClick={handleResetFilters}
                            >
                                Reset
                            </button>
                        </div>
                    </form>

                    <div className="mods-sort-filter">
                        <label className="mods-search-label" htmlFor="mods-sort-select">
                            Sort mods
                        </label>
                        <select
                            id="mods-sort-select"
                            value={selectedSort.value}
                            onChange={handleSortChange}
                            disabled={loading}
                        >
                            {MOD_SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="mods-sort-hint">
                            Search matches mod titles only. This order is applied after name relevance.
                        </p>
                    </div>

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
                                disabled={!tagToAdd || loading}
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

                {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

                <div className="mods-results-bar" aria-live="polite">
                    <span>{loading ? 'Syncing workshop index' : `${Number(totalMods).toLocaleString('en-US')} matching records`}</span>
                    <span>Page {page + 1} / {Math.max(totalPages, 1)}</span>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Loading mods...</p>
                    </div>
                ) : mods.length === 0 ? (
                    <div className="empty-state fade-in">
                        <strong>No matching mods</strong>
                        <p>Try a broader title or remove one of the selected tags.</p>
                    </div>
                ) : (
                    <div className="mods-grid">
                        {mods.map((mod, i) => (
                            <ModCard
                                key={mod.id || mod.external_id || mod.externalId}
                                mod={mod}
                                style={{ animationDelay: `${i * 0.05}s` }}
                                actionLabel={guideTargetMode ? 'Write guide →' : 'Read more →'}
                                onSelect={guideTargetMode ? (selectedMod) => {
                                    const targetId = selectedMod.external_id || selectedMod.externalId;
                                    navigate(`/guides/new/editor?targetType=MOD&targetId=${encodeURIComponent(targetId)}`);
                                } : undefined}
                            />
                        ))}
                    </div>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    disabled={loading}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
}
