import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createTag, getTags } from '../api/tags';
import { mapCreateTagError } from '../api/tagErrorMapper';
import './TagsPage.css';

const SORT_BY_VALUES = ['name', 'createdAt', 'created_at'];
const DIRECTION_VALUES = ['asc', 'desc'];

function normalizeSortBy(value) {
    return SORT_BY_VALUES.includes(value) ? value : 'name';
}

function normalizeDirection(value) {
    return DIRECTION_VALUES.includes(value) ? value : 'asc';
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

    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState('');

    const [newTagName, setNewTagName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fieldError, setFieldError] = useState('');
    const [formError, setFormError] = useState('');

    const loadTags = async (currentSortBy, currentDirection) => {
        setLoading(true);
        setLoadingError('');
        try {
            const data = await getTags({
                sortBy: currentSortBy,
                direction: currentDirection,
            });
            setTags(Array.isArray(data) ? data : []);
        } catch (error) {
            setLoadingError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTags(sortBy, direction);
    }, [sortBy, direction]);

    const handleSortByChange = (event) => {
        setSearchParams({
            sortBy: event.target.value,
            direction,
        });
    };

    const handleDirectionChange = (event) => {
        setSearchParams({
            sortBy,
            direction: event.target.value,
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
            await loadTags(sortBy, direction);
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
                        Глобальные теги системы. Создание тега не прикрепляет его к модификациям.
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
                        {tags.map((tag) => (
                            <article key={tag.id || tag.slug} className="tag-item-card glass-card">
                                <h3>{tag.name}</h3>
                                <p className="tag-slug">slug: {tag.slug}</p>
                                {tag.usageCount !== null && tag.usageCount !== undefined && (
                                    <p className="tag-usage">Использований: {tag.usageCount}</p>
                                )}
                                {formatTagDate(tag) && (
                                    <p className="tag-date">Создан: {formatTagDate(tag)}</p>
                                )}
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
}

