import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import { createTag, getTags } from '../api/tags';
import { mapCreateTagError } from '../api/tagErrorMapper';
import Pagination from '../components/Pagination';
import './TagsPage.css';

const SORT_BY_VALUES = ['name', 'createdAt', 'created_at'];
const DIRECTION_VALUES = ['asc', 'desc'];
const PAGE_SIZE_VALUES = [10, 20, 50, 100];

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
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function TagsPage() {
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
            setLoadingError(mapPaginationError(error, 'Не удалось загрузить теги'));
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
            setFieldError('Введите название тега');
            return;
        }

        setSubmitting(true);
        try {
            await createTag(trimmedName);
            setNewTagName('');
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
                <section className="tags-header-box glass-card shine">
                    <h1 className="tags-title">Каталог тегов</h1>
                    <p className="tags-subtitle">
                        Глобальные теги системы. Создание тега не прикрепляет его к модификациям. Всего: {totalTags}
                    </p>
                </section>

                <section className="tags-controls glass-card">
                    <div className="tags-sort-controls">
                        <label className="tags-control-group">
                            <span>Сортировка</span>
                            <select value={sortBy} onChange={handleSortByChange}>
                                <option value="name">name</option>
                                <option value="createdAt">createdAt</option>
                                <option value="created_at">created_at</option>
                            </select>
                        </label>

                        <label className="tags-control-group">
                            <span>Направление</span>
                            <select value={direction} onChange={handleDirectionChange}>
                                <option value="asc">asc</option>
                                <option value="desc">desc</option>
                            </select>
                        </label>

                        <label className="tags-control-group">
                            <span>Размер страницы</span>
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
                        <label htmlFor="new-tag-name">Создать новый тег</label>
                        <div className="tags-create-row">
                            <input
                                id="new-tag-name"
                                type="text"
                                placeholder="Например, Medical"
                                value={newTagName}
                                onChange={(event) => setNewTagName(event.target.value)}
                                disabled={submitting}
                            />
                            <button className="btn btn-primary" type="submit" disabled={submitting}>
                                {submitting ? 'Создание...' : 'Создать'}
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
                        <p>Теги пока не созданы</p>
                    </div>
                ) : (
                    <section className="tags-grid">
                        {tags.map((tag) => {
                            const usageCount = tag.usageCount ?? tag.usage_count;

                            return (
                                <article key={tag.id || tag.slug} className="tag-item-card glass-card">
                                    <h3>{tag.name}</h3>
                                    <p className="tag-slug">slug: {tag.slug}</p>
                                    {usageCount !== null && usageCount !== undefined && (
                                        <p className="tag-usage">Использований: {usageCount}</p>
                                    )}
                                    {formatTagDate(tag) && (
                                        <p className="tag-date">Создан: {formatTagDate(tag)}</p>
                                    )}
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

