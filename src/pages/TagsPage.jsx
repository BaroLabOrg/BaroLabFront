import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import { createTag, getTags } from '../api/tags';
import { mapCreateTagError } from '../api/tagErrorMapper';
import Pagination from '../components/Pagination';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './TagsPage.css';

const SORT_BY_VALUES = ['name', 'createdAt', 'created_at'];
const DIRECTION_VALUES = ['asc', 'desc'];
const PAGE_SIZE_VALUES = [10, 20, 50, 100];

const TAG_CATEGORIES = [
    { value: 'SECURITY', label: 'Security / Combat', tone: 'security' },
    { value: 'LIFE', label: 'Life / Medical', tone: 'life' },
    { value: 'ENGINEERING', label: 'Engineering / Tech', tone: 'engineering' },
    { value: 'META', label: 'Meta / System', tone: 'meta' },
    { value: 'INFO', label: 'Info / Specs', tone: 'info' },
];

function UsesIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
            <path d="M3 12l9 4.5L21 12M3 16.5 12 21l9-4.5" />
        </svg>
    );
}

function normalizeSortBy(value) {
    return SORT_BY_VALUES.includes(value) ? value : 'name';
}

function normalizeDirection(value) {
    return DIRECTION_VALUES.includes(value) ? value : 'asc';
}

function normalizePage(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) return 0;
    return parsed;
}

function normalizeSize(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return 20;
    return parsed;
}

function formatTagDate(tag) {
    const value = tag.createdAt || tag.created_at;
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getCategoryLabel(categoryValue) {
    const cat = TAG_CATEGORIES.find(c => c.value === categoryValue);
    return cat ? cat.label : categoryValue;
}

function getCategoryTone(categoryValue) {
    const cat = TAG_CATEGORIES.find(c => c.value === categoryValue);
    return cat ? cat.tone : 'info';
}

export default function TagsPage() {
    useDocumentMeta({
        title: 'Tags — BaroLab',
        description: 'Browse categorization tags for Barotrauma mods and submarines on BaroLab.',
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const sortBy = normalizeSortBy(searchParams.get('sortBy'));
    const direction = normalizeDirection(searchParams.get('direction'));
    const page = normalizePage(searchParams.get('page'));
    const size = normalizeSize(searchParams.get('size'));

    const [tags, setTags] = useState([]);
    const [totalTags, setTotalTags] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState('');

    const [newTagName, setNewTagName] = useState('');
    const [newTagCategory, setNewTagCategory] = useState('INFO');
    const [submitting, setSubmitting] = useState(false);
    const [fieldError, setFieldError] = useState('');
    const [formError, setFormError] = useState('');

    const updateSearch = (nextValues) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(nextValues).forEach(([key, value]) => {
            next.set(key, String(value));
        });
        setSearchParams(next);
    };

    const loadTags = async (currentSortBy, currentDirection, currentPage, currentSize) => {
        setLoading(true);
        setLoadingError('');
        try {
            const data = await getTags({
                page: currentPage,
                size: currentSize,
                sortBy: currentSortBy,
                direction: currentDirection,
            });
            setTags(data.items);
            setTotalTags(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (error) {
            setLoadingError(mapPaginationError(error, 'Failed to load tags'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTags(sortBy, direction, page, size);
    }, [sortBy, direction, page, size]);

    const handleSortByChange = (event) => {
        updateSearch({
            sortBy: event.target.value,
            direction,
            page: 0,
            size,
        });
    };

    const handleDirectionChange = (event) => {
        updateSearch({
            sortBy,
            direction: event.target.value,
            page: 0,
            size,
        });
    };

    const handleSizeChange = (event) => {
        updateSearch({
            sortBy,
            direction,
            page: 0,
            size: event.target.value,
        });
    };

    const handlePageChange = (nextPage) => {
        updateSearch({
            sortBy,
            direction,
            page: nextPage,
            size,
        });
    };

    const handleCreateTag = async (event) => {
        event.preventDefault();
        setFieldError('');
        setFormError('');

        const trimmedName = newTagName.trim();
        if (!trimmedName) {
            setFieldError('Enter tag name');
            return;
        }

        setSubmitting(true);
        try {
            await createTag(trimmedName, newTagCategory);
            setNewTagName('');
            setNewTagCategory('INFO');
            if (page === 0) {
                await loadTags(sortBy, direction, 0, size);
            } else {
                updateSearch({
                    sortBy,
                    direction,
                    page: 0,
                    size,
                });
            }
        } catch (error) {
            const mappedError = mapCreateTagError(error);
            if (mappedError.target === 'field') {
                setFieldError(mappedError.message);
            } else {
                setFormError(mappedError.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page">
            <div className="container tags-page">
                <section className="tags-header-box">
                    <h1 className="tags-title">Tag Catalog</h1>
                    <p className="tags-subtitle">
                        Global system tags. Creating a tag does not attach it to mods. Total: {totalTags}
                    </p>
                </section>

                <section className="tags-controls">
                    <div className="tags-sort-controls">
                        <label className="tags-control-group">
                            <span>Sorting</span>
                            <select value={sortBy} onChange={handleSortByChange}>
                                <option value="name">name</option>
                                <option value="createdAt">createdAt</option>
                                <option value="created_at">created_at</option>
                            </select>
                        </label>

                        <label className="tags-control-group">
                            <span>Direction</span>
                            <select value={direction} onChange={handleDirectionChange}>
                                <option value="asc">asc</option>
                                <option value="desc">desc</option>
                            </select>
                        </label>

                        <label className="tags-control-group">
                            <span>Page size</span>
                            <select value={size} onChange={handleSizeChange}>
                                {PAGE_SIZE_VALUES.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <form className="tags-create-form" onSubmit={handleCreateTag}>
                        <label htmlFor="new-tag-name">Create new tag</label>
                        <div className="tags-create-row">
                            <input
                                id="new-tag-name"
                                type="text"
                                placeholder="For example, Medical"
                                value={newTagName}
                                onChange={(event) => setNewTagName(event.target.value)}
                                disabled={submitting}
                            />
                            <select
                                value={newTagCategory}
                                onChange={(event) => setNewTagCategory(event.target.value)}
                                disabled={submitting}
                                className="tags-category-select"
                            >
                                {TAG_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            <button className="btn btn-primary" type="submit" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create'}
                            </button>
                        </div>

                        {fieldError && <p className="tags-form-error tags-form-error-field">{fieldError}</p>}
                        {formError && <p className="tags-form-error">{formError}</p>}
                    </form>
                </section>

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                    </div>
                ) : loadingError ? (
                    <div className="auth-error">{loadingError}</div>
                ) : tags.length === 0 ? (
                    <div className="empty-state">
                        <p>No tags created yet</p>
                    </div>
                ) : (
                    <section className="tags-grid">
                        {tags.map((tag) => {
                            const usageCount = tag.usageCount ?? tag.usage_count;
                            const category = tag.category ?? tag.categoryValue;
                            const isVanilla = tag.isVanilla ?? tag.is_vanilla ?? false;
                            const dateLabel = formatTagDate(tag);

                            return (
                                <article
                                    key={tag.id || tag.slug}
                                    className="tag-row"
                                    data-tone={getCategoryTone(category)}
                                >
                                    <span className="tag-row-dot" aria-hidden="true" />
                                    <h3 className="tag-row-name">{tag.name}</h3>
                                    <span className="tag-row-slug">slug: {tag.slug}</span>
                                    {isVanilla && <span className="tag-row-vanilla">Vanilla</span>}
                                    <span className="tag-row-meta">
                                        {category && (
                                            <span className="tag-row-cat">{getCategoryLabel(category)}</span>
                                        )}
                                        {usageCount !== null && usageCount !== undefined && (
                                            <span className="tag-row-uses" title="Usage count">
                                                <UsesIcon />
                                                {Number(usageCount).toLocaleString('en-US')}
                                            </span>
                                        )}
                                        {dateLabel && (
                                            <span className="tag-row-date" title="Created">{dateLabel}</span>
                                        )}
                                    </span>
                                </article>
                            );
                        })}
                    </section>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    disabled={loading || submitting}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
}
