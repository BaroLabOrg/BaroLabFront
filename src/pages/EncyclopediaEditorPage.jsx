import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ENCYCLOPEDIA_ENTITY_TYPES,
    ENCYCLOPEDIA_RELATION_TYPES,
    archiveEncyclopediaArticle,
    autoGenerateAndPublishEncyclopediaArticles,
    createEncyclopediaArticle,
    getAvailableEncyclopediaEntities,
    getEncyclopediaEditor,
    getEncyclopediaList,
    previewEncyclopediaDraft,
    publishEncyclopediaDraft,
    saveEncyclopediaDraft,
    updateEncyclopediaInfobox,
    updateEncyclopediaMetadata,
    updateEncyclopediaRelations,
} from '../api/encyclopedia';
import { useAuth } from '../context/AuthContext';
import './EncyclopediaEditorPage.css';

function buildEmptyInfoboxField(sortOrder = 0) {
    return { fieldKey: '', fieldLabel: '', fieldValue: '', sortOrder };
}

function buildEmptyRelation(sortOrder = 0) {
    return { targetEntityId: '', relationType: 'RELATED', sortOrder, title: '', slug: '' };
}

function sanitizeInfoboxFields(fields) {
    return (fields || [])
        .map((field, index) => ({
            fieldKey: String(field.fieldKey || '').trim(),
            fieldLabel: String(field.fieldLabel || '').trim(),
            fieldValue: String(field.fieldValue || '').trim(),
            sortOrder: Number(field.sortOrder ?? index) || 0,
        }))
        .filter((field) => field.fieldKey && field.fieldLabel && field.fieldValue);
}

function sanitizeRelations(relations) {
    return (relations || [])
        .map((relation, index) => ({
            targetEntityId: String(relation.targetEntityId || '').trim(),
            relationType: relation.relationType || 'RELATED',
            sortOrder: Number(relation.sortOrder ?? index) || 0,
        }))
        .filter((relation) => relation.targetEntityId);
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function EncyclopediaEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const isCreateMode = !id;

    const [loading, setLoading] = useState(!isCreateMode);
    const [actionLoading, setActionLoading] = useState(false);
    const [batchActionLoading, setBatchActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [batchError, setBatchError] = useState('');
    const [batchResult, setBatchResult] = useState(null);

    const [createEntityId, setCreateEntityId] = useState('');
    const [createSummary, setCreateSummary] = useState('');
    const [createDraft, setCreateDraft] = useState('');
    const [createEntitySearchInput, setCreateEntitySearchInput] = useState('');
    const [createEntitySearch, setCreateEntitySearch] = useState('');
    const [createEntityTypeFilter, setCreateEntityTypeFilter] = useState('');
    const [availableEntities, setAvailableEntities] = useState([]);
    const [availableEntitiesLoading, setAvailableEntitiesLoading] = useState(false);
    const [availableEntitiesError, setAvailableEntitiesError] = useState('');
    const [availableEntitiesPage, setAvailableEntitiesPage] = useState(0);
    const [availableEntitiesTotalPages, setAvailableEntitiesTotalPages] = useState(0);
    const [availableEntitiesTotal, setAvailableEntitiesTotal] = useState(0);

    const [editorState, setEditorState] = useState(null);
    const [summary, setSummary] = useState('');
    const [draftMarkdown, setDraftMarkdown] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewLinks, setPreviewLinks] = useState([]);
    const [infoboxFields, setInfoboxFields] = useState([]);
    const [relations, setRelations] = useState([]);

    const [relationSearchInput, setRelationSearchInput] = useState('');
    const [relationSearchLoading, setRelationSearchLoading] = useState(false);
    const [relationSearchError, setRelationSearchError] = useState('');
    const [relationSearchResults, setRelationSearchResults] = useState([]);

    const applyEditorState = (response) => {
        setEditorState(response);
        setSummary(response?.article?.summary || '');
        setDraftMarkdown(response?.article?.draftMarkdown || response?.article?.publishedMarkdown || '');
        setPreviewHtml('');
        setPreviewLinks([]);
        setInfoboxFields((response?.infobox || []).map((field, index) => ({
            fieldKey: field.fieldKey || '',
            fieldLabel: field.fieldLabel || '',
            fieldValue: field.fieldValue || '',
            sortOrder: Number(field.sortOrder ?? index) || 0,
        })));
        setRelations((response?.manualRelations || []).map((relation, index) => ({
            targetEntityId: relation.id || '',
            relationType: relation.relationType || 'RELATED',
            sortOrder: Number(relation.sortOrder ?? index) || 0,
            title: relation.title || '',
            slug: relation.slug || '',
        })));
    };

    useEffect(() => {
        if (isCreateMode) return;
        let cancelled = false;

        const loadEditor = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await getEncyclopediaEditor(id);
                if (!cancelled) applyEditorState(response);
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'Не удалось загрузить редактор энциклопедии');
                    setEditorState(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadEditor();
        return () => { cancelled = true; };
    }, [id, isCreateMode]);

    useEffect(() => {
        if (!isCreateMode) return;
        let cancelled = false;

        const loadAvailableEntities = async () => {
            setAvailableEntitiesLoading(true);
            setAvailableEntitiesError('');
            try {
                const response = await getAvailableEncyclopediaEntities({
                    q: createEntitySearch,
                    entityType: createEntityTypeFilter || undefined,
                    page: availableEntitiesPage,
                    size: 10,
                });
                if (!cancelled) {
                    setAvailableEntities(Array.isArray(response.items) ? response.items : []);
                    setAvailableEntitiesTotal(Number(response.total || 0));
                    setAvailableEntitiesTotalPages(Number(response.total_pages || 0));
                }
            } catch (err) {
                if (!cancelled) {
                    setAvailableEntities([]);
                    setAvailableEntitiesTotal(0);
                    setAvailableEntitiesTotalPages(0);
                    setAvailableEntitiesError(err?.message || 'Не удалось загрузить доступные сущности');
                }
            } finally {
                if (!cancelled) {
                    setAvailableEntitiesLoading(false);
                }
            }
        };

        loadAvailableEntities();
        return () => { cancelled = true; };
    }, [isCreateMode, createEntitySearch, createEntityTypeFilter, availableEntitiesPage]);

    const handleCreateSearchSubmit = (event) => {
        event.preventDefault();
        setAvailableEntitiesPage(0);
        setCreateEntitySearch(createEntitySearchInput.trim());
    };

    const handleSelectAvailableEntity = (entity) => {
        if (!entity?.id) return;
        setCreateEntityId(entity.id);
        if (!createSummary.trim()) {
            setCreateSummary(entity.shortDescription || '');
        }
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        if (!createEntityId.trim()) {
            setError('Выберите сущность из списка или укажите UUID вручную');
            return;
        }

        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const created = await createEncyclopediaArticle({
                entityId: createEntityId.trim(),
                summary: createSummary.trim(),
                draftMarkdown: createDraft,
            });
            navigate(`/admin/encyclopedia/${created.entityId}/edit`, { replace: true });
        } catch (err) {
            setError(err?.message || 'Не удалось создать страницу энциклопедии');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAutoGenerateAndPublish = async () => {
        if (!isAdmin) return;

        setBatchActionLoading(true);
        setBatchError('');
        setBatchResult(null);
        try {
            const result = await autoGenerateAndPublishEncyclopediaArticles();
            setBatchResult(result);
        } catch (err) {
            setBatchError(err?.message || 'Не удалось выполнить авто-генерацию и публикацию статей');
        } finally {
            setBatchActionLoading(false);
        }
    };

    const handleSaveMetadata = async () => {
        if (!editorState?.entityId) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const updated = await updateEncyclopediaMetadata(editorState.entityId, { summary: summary.trim() });
            applyEditorState(updated);
            setSuccess('Метаданные сохранены');
        } catch (err) {
            setError(err?.message || 'Не удалось сохранить метаданные');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!editorState?.entityId) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const updated = await saveEncyclopediaDraft(editorState.entityId, draftMarkdown);
            applyEditorState(updated);
            setSuccess('Черновик сохранен');
        } catch (err) {
            setError(err?.message || 'Не удалось сохранить черновик');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!editorState?.entityId) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const preview = await previewEncyclopediaDraft(editorState.entityId, draftMarkdown);
            setPreviewHtml(preview.renderedHtml || '');
            setPreviewLinks(preview.links || []);
            setSuccess('Превью обновлено');
        } catch (err) {
            setError(err?.message || 'Не удалось построить превью');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!editorState?.entityId) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const updated = await publishEncyclopediaDraft(editorState.entityId, draftMarkdown);
            applyEditorState(updated);
            setSuccess('Статья опубликована');
        } catch (err) {
            setError(err?.message || 'Не удалось опубликовать статью');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveInfobox = async () => {
        if (!editorState?.entityId) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const payload = sanitizeInfoboxFields(infoboxFields);
            const updated = await updateEncyclopediaInfobox(editorState.entityId, payload);
            applyEditorState(updated);
            setSuccess('Infobox сохранен');
        } catch (err) {
            setError(err?.message || 'Не удалось сохранить infobox');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveRelations = async () => {
        if (!editorState?.entityId) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const payload = sanitizeRelations(relations);
            const updated = await updateEncyclopediaRelations(editorState.entityId, payload);
            applyEditorState(updated);
            setSuccess('Ручные связи сохранены');
        } catch (err) {
            setError(err?.message || 'Не удалось сохранить ручные связи');
        } finally {
            setActionLoading(false);
        }
    };

    const handleArchive = async () => {
        if (!editorState?.entityId) return;
        if (!window.confirm('Архивировать статью? Публичная страница будет скрыта.')) return;

        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const updated = await archiveEncyclopediaArticle(editorState.entityId);
            applyEditorState(updated);
            setSuccess('Статья архивирована');
        } catch (err) {
            setError(err?.message || 'Не удалось архивировать статью');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRelationSearch = async () => {
        const query = relationSearchInput.trim();
        if (!query) {
            setRelationSearchResults([]);
            setRelationSearchError('');
            return;
        }

        setRelationSearchLoading(true);
        setRelationSearchError('');
        try {
            const result = await getEncyclopediaList({
                q: query,
                page: 0,
                size: 8,
                sortBy: 'title',
                direction: 'asc',
            });
            setRelationSearchResults(result.items || []);
        } catch (err) {
            setRelationSearchResults([]);
            setRelationSearchError(err?.message || 'Не удалось найти сущности для связи');
        } finally {
            setRelationSearchLoading(false);
        }
    };

    const handleAddRelationFromSearch = (item) => {
        if (!item?.id) return;
        if (editorState?.entityId && String(item.id) === String(editorState.entityId)) return;
        const exists = relations.some((relation) => String(relation.targetEntityId) === String(item.id));
        if (exists) return;

        setRelations((current) => ([
            ...current,
            {
                targetEntityId: item.id,
                relationType: 'RELATED',
                sortOrder: current.length,
                title: item.title || '',
                slug: item.slug || '',
            },
        ]));
    };

    const selectedCreateEntity = availableEntities.find(
        (entity) => String(entity.id) === String(createEntityId),
    ) || null;

    if (isCreateMode) {
        return (
            <div className="page">
                <div className="container encyclopedia-editor-page">
                    <Link to="/encyclopedia" className="back-link">← Назад к энциклопедии</Link>
                    <section className="encyclopedia-editor-card glass-card">
                        <h1>Создание страницы энциклопедии</h1>
                        <p className="encyclopedia-editor-muted">
                            Сначала выберите ванильную сущность без статьи, затем создайте черновик.
                        </p>
                        {isAdmin && (
                            <div className="encyclopedia-batch-block">
                                <div className="encyclopedia-batch-header">
                                    <h2>Массовое заполнение энциклопедии</h2>
                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        onClick={handleAutoGenerateAndPublish}
                                        disabled={batchActionLoading}
                                    >
                                        {batchActionLoading
                                            ? 'Обработка...'
                                            : 'Авто-создать и опубликовать статьи'}
                                    </button>
                                </div>
                                {batchError && <div className="auth-error">{batchError}</div>}
                                {batchResult && (
                                    <div className="encyclopedia-batch-result">
                                        <p><strong>Проверено:</strong> {batchResult.totalChecked}</p>
                                        <p><strong>Создано:</strong> {batchResult.created}</p>
                                        <p><strong>Обновлено:</strong> {batchResult.updated}</p>
                                        <p><strong>Опубликовано:</strong> {batchResult.published}</p>
                                        <p><strong>Пропущено (manual):</strong> {batchResult.skippedManual}</p>
                                        <p><strong>Пропущено (без изменений):</strong> {batchResult.skippedUnchanged}</p>
                                        <p><strong>Ошибок:</strong> {batchResult.failed}</p>
                                        {Array.isArray(batchResult.errors) && batchResult.errors.length > 0 && (
                                            <div className="encyclopedia-batch-errors">
                                                {batchResult.errors.map((entry, index) => (
                                                    <p key={`${entry}-${index}`}>{entry}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <form className="encyclopedia-create-form" onSubmit={handleCreate}>
                            <div className="available-entities-block">
                                <label htmlFor="create-entity-search-input">Поиск сущности</label>
                                <div className="relation-search-row">
                                    <input
                                        id="create-entity-search-input"
                                        value={createEntitySearchInput}
                                        onChange={(event) => setCreateEntitySearchInput(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                handleCreateSearchSubmit(event);
                                            }
                                        }}
                                        placeholder="Название, slug или source identifier"
                                    />
                                    <select
                                        value={createEntityTypeFilter}
                                        onChange={(event) => {
                                            setCreateEntityTypeFilter(event.target.value);
                                            setAvailableEntitiesPage(0);
                                        }}
                                    >
                                        <option value="">Все типы</option>
                                        {ENCYCLOPEDIA_ENTITY_TYPES.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="btn btn-ghost"
                                        type="button"
                                        onClick={handleCreateSearchSubmit}
                                        disabled={availableEntitiesLoading}
                                    >
                                        {availableEntitiesLoading ? 'Поиск...' : 'Найти'}
                                    </button>
                                </div>
                                {availableEntitiesError && <p className="relation-search-error">{availableEntitiesError}</p>}
                                {availableEntitiesLoading ? (
                                    <p className="encyclopedia-editor-muted">Загрузка списка сущностей...</p>
                                ) : availableEntities.length === 0 ? (
                                    <p className="encyclopedia-editor-muted">Подходящие сущности не найдены.</p>
                                ) : (
                                    <>
                                        <div className="relation-search-results">
                                            {availableEntities.map((entity) => {
                                                const isSelected = String(createEntityId) === String(entity.id);
                                                return (
                                                    <button
                                                        key={entity.id}
                                                        className={`available-entity-btn ${isSelected ? 'relation-result-btn-selected' : ''}`}
                                                        type="button"
                                                        onClick={() => handleSelectAvailableEntity(entity)}
                                                    >
                                                        {entity.primaryImageUrl ? (
                                                            <img
                                                                src={entity.primaryImageUrl}
                                                                alt={entity.title}
                                                                className="available-entity-thumb"
                                                            />
                                                        ) : (
                                                            <span className="available-entity-thumb-placeholder">📄</span>
                                                        )}
                                                        <span className="available-entity-content">
                                                            <strong>{entity.title}</strong>
                                                            <span>{entity.slug}</span>
                                                            <span>{entity.entityType}</span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="available-entities-pagination">
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                type="button"
                                                disabled={availableEntitiesPage <= 0 || availableEntitiesLoading}
                                                onClick={() => setAvailableEntitiesPage((current) => Math.max(0, current - 1))}
                                            >
                                                Предыдущая
                                            </button>
                                            <span className="encyclopedia-editor-muted">
                                                Страница {availableEntitiesTotalPages > 0 ? availableEntitiesPage + 1 : 0}
                                                {' из '}
                                                {availableEntitiesTotalPages}
                                                {' · Всего: '}
                                                {availableEntitiesTotal}
                                            </span>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                type="button"
                                                disabled={
                                                    availableEntitiesLoading
                                                    || availableEntitiesTotalPages === 0
                                                    || availableEntitiesPage + 1 >= availableEntitiesTotalPages
                                                }
                                                onClick={() => setAvailableEntitiesPage((current) => current + 1)}
                                            >
                                                Следующая
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            {selectedCreateEntity && (
                                <div className="available-entity-preview">
                                    {selectedCreateEntity.primaryImageUrl ? (
                                        <img
                                            src={selectedCreateEntity.primaryImageUrl}
                                            alt={selectedCreateEntity.title}
                                            className="available-entity-preview-image"
                                        />
                                    ) : (
                                        <div className="available-entity-preview-placeholder">Нет изображения</div>
                                    )}
                                    <div className="available-entity-preview-meta">
                                        <strong>{selectedCreateEntity.title}</strong>
                                        <span>{selectedCreateEntity.entityType}</span>
                                        <span>{selectedCreateEntity.slug}</span>
                                    </div>
                                </div>
                            )}
                            <label>
                                Entity UUID (fallback)
                                <input
                                    value={createEntityId}
                                    onChange={(event) => setCreateEntityId(event.target.value)}
                                    placeholder="e.g. f278f4d5-1478-4ebc-9b9f-2ec2cbf1f74a"
                                    required
                                />
                            </label>
                            <label>
                                Summary
                                <textarea
                                    rows="3"
                                    value={createSummary}
                                    onChange={(event) => setCreateSummary(event.target.value)}
                                    placeholder="Краткое описание статьи"
                                />
                            </label>
                            <label>
                                Draft markdown
                                <textarea
                                    rows="10"
                                    value={createDraft}
                                    onChange={(event) => setCreateDraft(event.target.value)}
                                    placeholder="Начальный markdown..."
                                />
                            </label>
                            {error && <div className="auth-error">{error}</div>}
                            {success && <div className="editor-success">{success}</div>}
                            <button className="btn btn-primary" type="submit" disabled={actionLoading}>
                                {actionLoading ? 'Создание...' : 'Создать'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Загрузка редактора...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!editorState) {
        return (
            <div className="page">
                <div className="container encyclopedia-editor-page">
                    {error && <div className="auth-error">{error}</div>}
                    <Link to="/encyclopedia" className="back-link">← Назад к энциклопедии</Link>
                </div>
            </div>
        );
    }

    const renderedPreviewHtml = previewHtml || editorState.article.renderedHtml || '';

    return (
        <div className="page">
            <div className="container encyclopedia-editor-page">
                <Link to={`/encyclopedia/${editorState.slug}`} className="back-link">← Открыть публичную страницу</Link>

                <section className="encyclopedia-editor-header glass-card">
                    <div>
                        <h1>{editorState.title}</h1>
                        <p className="encyclopedia-editor-muted">
                            {editorState.entityType} · {editorState.primaryCategory || 'Без категории'}
                            {editorState.secondaryCategory ? ` / ${editorState.secondaryCategory}` : ''}
                        </p>
                        <p className="encyclopedia-editor-muted">
                            Status: {editorState.article.articleStatus} · Published: {formatDate(editorState.article.publishedAt)}
                            {' · '}Updated: {formatDate(editorState.article.updatedAt)}
                        </p>
                    </div>
                    <div className="encyclopedia-editor-header-actions">
                        <button className="btn btn-ghost" onClick={handleSaveMetadata} disabled={actionLoading}>Сохранить metadata</button>
                        <button className="btn btn-ghost" onClick={handleSaveDraft} disabled={actionLoading}>Save draft</button>
                        <button className="btn btn-ghost" onClick={handlePreview} disabled={actionLoading}>Preview</button>
                        <button className="btn btn-primary" onClick={handlePublish} disabled={actionLoading}>Publish</button>
                        <button className="btn btn-danger" onClick={handleArchive} disabled={actionLoading}>Archive</button>
                    </div>
                </section>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="editor-success">{success}</div>}

                <section className="encyclopedia-editor-card glass-card">
                    <h2>Metadata</h2>
                    <label>
                        Summary
                        <textarea rows="3" value={summary} onChange={(event) => setSummary(event.target.value)} />
                    </label>
                </section>

                <section className="encyclopedia-editor-card glass-card">
                    <h2>Markdown</h2>
                    <div className="encyclopedia-editor-panes">
                        <div className="encyclopedia-editor-pane">
                            <label htmlFor="encyclopedia-draft-textarea">Черновик markdown</label>
                            <textarea
                                id="encyclopedia-draft-textarea"
                                rows="24"
                                value={draftMarkdown}
                                onChange={(event) => setDraftMarkdown(event.target.value)}
                            />
                        </div>
                        <div className="encyclopedia-editor-pane">
                            <label>Preview HTML</label>
                            {renderedPreviewHtml ? (
                                <div
                                    className="encyclopedia-preview-html"
                                    dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                                />
                            ) : (
                                <p className="encyclopedia-editor-muted">Превью пока не сгенерировано.</p>
                            )}
                        </div>
                    </div>
                    <div className="encyclopedia-preview-links">
                        <h3>Wiki links</h3>
                        {previewLinks.length === 0 ? (
                            <p className="encyclopedia-editor-muted">Нет данных preview по wiki-links.</p>
                        ) : (
                            <ul>
                                {previewLinks.map((link) => (
                                    <li key={`${link.rawText}-${link.resolvedSlug || 'missing'}`}>
                                        <strong>{link.rawText}</strong>
                                        {' → '}
                                        {link.resolved ? (
                                            <Link to={`/encyclopedia/${link.resolvedSlug}`}>{link.resolvedSlug}</Link>
                                        ) : (
                                            <span className="unresolved-link">unresolved</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section className="encyclopedia-editor-card glass-card">
                    <div className="encyclopedia-editor-section-header">
                        <h2>Infobox fields</h2>
                        <div className="editor-actions-inline">
                            <button
                                className="btn btn-ghost btn-sm"
                                type="button"
                                onClick={() => setInfoboxFields((current) => [...current, buildEmptyInfoboxField(current.length)])}
                            >
                                + Поле
                            </button>
                            <button className="btn btn-primary btn-sm" type="button" onClick={handleSaveInfobox} disabled={actionLoading}>
                                Сохранить infobox
                            </button>
                        </div>
                    </div>

                    {infoboxFields.length === 0 ? (
                        <p className="encyclopedia-editor-muted">Поля infobox не добавлены.</p>
                    ) : (
                        <div className="encyclopedia-editor-rows">
                            {infoboxFields.map((field, index) => (
                                <div key={`infobox-${index}`} className="encyclopedia-editor-row">
                                    <input value={field.fieldKey} onChange={(event) => setInfoboxFields((current) => current.map((item, i) => (i === index ? { ...item, fieldKey: event.target.value } : item)))} placeholder="field_key" />
                                    <input value={field.fieldLabel} onChange={(event) => setInfoboxFields((current) => current.map((item, i) => (i === index ? { ...item, fieldLabel: event.target.value } : item)))} placeholder="field_label" />
                                    <input value={field.fieldValue} onChange={(event) => setInfoboxFields((current) => current.map((item, i) => (i === index ? { ...item, fieldValue: event.target.value } : item)))} placeholder="field_value" />
                                    <input type="number" value={field.sortOrder} onChange={(event) => setInfoboxFields((current) => current.map((item, i) => (i === index ? { ...item, sortOrder: Number(event.target.value) || 0 } : item)))} placeholder="sort_order" />
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setInfoboxFields((current) => current.filter((_, i) => i !== index))}>Удалить</button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="encyclopedia-editor-card glass-card">
                    <div className="encyclopedia-editor-section-header">
                        <h2>Ручные связи</h2>
                        <div className="editor-actions-inline">
                            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setRelations((current) => [...current, buildEmptyRelation(current.length)])}>+ Связь</button>
                            <button className="btn btn-primary btn-sm" type="button" onClick={handleSaveRelations} disabled={actionLoading}>Сохранить связи</button>
                        </div>
                    </div>

                    <div className="relation-search-block">
                        <label htmlFor="relation-search-input">Поиск сущностей для связи</label>
                        <div className="relation-search-row">
                            <input
                                id="relation-search-input"
                                value={relationSearchInput}
                                onChange={(event) => setRelationSearchInput(event.target.value)}
                                placeholder="Введите часть названия"
                            />
                            <button className="btn btn-ghost" type="button" onClick={handleRelationSearch} disabled={relationSearchLoading}>
                                {relationSearchLoading ? 'Поиск...' : 'Найти'}
                            </button>
                        </div>
                        {relationSearchError && <p className="relation-search-error">{relationSearchError}</p>}
                        {relationSearchResults.length > 0 && (
                            <div className="relation-search-results">
                                {relationSearchResults.map((item) => (
                                    <button key={item.id} className="relation-result-btn" type="button" onClick={() => handleAddRelationFromSearch(item)}>
                                        <strong>{item.title}</strong>
                                        <span>{item.slug}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {relations.length === 0 ? (
                        <p className="encyclopedia-editor-muted">Ручные связи не добавлены.</p>
                    ) : (
                        <div className="encyclopedia-editor-rows">
                            {relations.map((relation, index) => (
                                <div key={`relation-${index}`} className="encyclopedia-editor-row relation-row">
                                    <input value={relation.targetEntityId} onChange={(event) => setRelations((current) => current.map((item, i) => (i === index ? { ...item, targetEntityId: event.target.value } : item)))} placeholder="target_entity_id" />
                                    <select value={relation.relationType} onChange={(event) => setRelations((current) => current.map((item, i) => (i === index ? { ...item, relationType: event.target.value } : item)))}>
                                        {ENCYCLOPEDIA_RELATION_TYPES.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    <input type="number" value={relation.sortOrder} onChange={(event) => setRelations((current) => current.map((item, i) => (i === index ? { ...item, sortOrder: Number(event.target.value) || 0 } : item)))} placeholder="sort_order" />
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setRelations((current) => current.filter((_, i) => i !== index))}>Удалить</button>
                                    {(relation.title || relation.slug) && <p className="relation-row-hint">{relation.title || relation.slug}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="encyclopedia-editor-card glass-card">
                    <h2>Imported properties (read-only)</h2>
                    {editorState.importedProperties.length === 0 ? (
                        <p className="encyclopedia-editor-muted">Свойства не найдены.</p>
                    ) : (
                        <div className="encyclopedia-imported-table-wrap">
                            <table className="encyclopedia-imported-table">
                                <thead>
                                    <tr>
                                        <th>Ключ</th>
                                        <th>Значение</th>
                                        <th>Тип</th>
                                        <th>Origin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editorState.importedProperties.map((property) => (
                                        <tr key={`${property.propertyKey}-${property.propertyValue}`}>
                                            <td>{property.propertyKey}</td>
                                            <td>{property.propertyValue}</td>
                                            <td>{property.valueType}</td>
                                            <td>{property.origin}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
