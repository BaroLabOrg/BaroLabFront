import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import * as guideApi from '../api/modGuides';
import * as modsApi from '../api/mods';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import './GuidesListPage.css';
import '../components/ModCard.css';

export default function GuidesListPage() {
    const PAGE_SIZE = 12;
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [guides, setGuides] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [totalGuides, setTotalGuides] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [mods, setMods] = useState([]);
    const [loadingMods, setLoadingMods] = useState(false);
    const [modsError, setModsError] = useState('');

    useEffect(() => {
        loadGuides(page);
    }, [page]);

    const loadGuides = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await guideApi.getAllGuides({
                page: targetPage,
                size: PAGE_SIZE,
                sortBy: 'createdAt',
                direction: 'desc',
            });
            setGuides(data.items);
            setTotalGuides(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setError(mapPaginationError(err, 'Не удалось загрузить руководства'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = async () => {
        setShowModal(true);
        if (mods.length === 0) {
            setLoadingMods(true);
            setModsError('');
            try {
                const data = await modsApi.getMods({
                    page: 0,
                    size: 100,
                    sortBy: 'title',
                    direction: 'asc',
                });
                const activeMods = data.items.filter((m) => m.status === 'ACTIVE');
                setMods(activeMods);
            } catch (err) {
                setModsError(mapPaginationError(err, 'Не удалось загрузить список модов'));
            } finally {
                setLoadingMods(false);
            }
        }
    };

    const handleModSelect = (modId) => {
        navigate(`/mod/${modId}/guides/new`);
    };

    if (loading) {
        return (
            <div className="page fade-in">
                <main className="container guides-page">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page fade-in">
                <main className="container guides-page">
                    <div className="error-message">Ошибка: {error}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page fade-in">
            <main className="container guides-page">
                <div className="guides-header-box glass-card shine">
                    <h1 className="guides-title">📚 Библиотека Руководств</h1>
                    <p className="guides-subtitle">
                        Полезные гайды, советы и инструкции по модам от нашего сообщества. Всего: {totalGuides}
                    </p>
                    {isAuthenticated ? (
                        <div className="guides-actions" style={{ marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" onClick={handleOpenModal}>
                                ✍️ Создать руководство
                            </button>
                        </div>
                    ) : (
                        <p className="auth-prompt" style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                            <Link to="/login" className="auth-link">Войдите в аккаунт</Link> или{' '}
                            <Link to="/sign-up" className="auth-link">зарегистрируйтесь</Link>, чтобы создавать руководства.
                        </p>
                    )}
                </div>

                <div className="guides-grid">
                    {guides.length === 0 ? (
                        <div className="no-guides-message">
                            На этой странице нет доступных руководств.
                        </div>
                    ) : (
                        guides.map((guide) => (
                            <div key={guide.id} className="guide-card glass-card hover-glow">
                                <div className="guide-card-content">
                                    <h2 className="guide-card-title">
                                        <Link to={`/mod/${guide.modId || guide.mod_id}/guides/${guide.id}`}>
                                            {guide.title}
                                        </Link>
                                    </h2>
                                    <div className="guide-card-meta">
                                        <span className="guide-card-author">👤 {guide.author?.username || guide.author?.login}</span>
                                        <span className="guide-card-date">
                                            🕒 {new Date(guide.createdAt || guide.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="guide-card-snippet">
                                        {guide.description?.slice(0, 150)}
                                        {guide.description?.length > 150 ? '...' : ''}
                                    </p>
                                </div>
                                <div className="guide-card-footer">
                                    <Link
                                        to={`/mod/${guide.modId || guide.mod_id}`}
                                        className="guide-card-mod-link"
                                    >
                                        К моду 🎮
                                    </Link>
                                    <Link
                                        to={`/mod/${guide.modId || guide.mod_id}/guides/${guide.id}`}
                                        className="btn btn-outline btn-sm"
                                    >
                                        Читать
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    disabled={loading}
                    onPageChange={setPage}
                />

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Выберите мод для руководства</h3>
                                <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <div className="modal-body">
                                {loadingMods ? (
                                    <div className="loading-state">
                                        <div className="loading-spinner" />
                                    </div>
                                ) : modsError ? (
                                    <div className="error-message">Ошибка: {modsError}</div>
                                ) : mods.length === 0 ? (
                                    <div className="no-guides-message">Нет доступных модов. Вы можете добавить мод на странице "Моды".</div>
                                ) : (
                                    <div className="mods-list">
                                        {mods.map(mod => (
                                            <div
                                                key={mod.id}
                                                className="mod-card glass-card hover-glow"
                                                style={{ cursor: 'pointer', opacity: 1, animation: 'none' }}
                                                onClick={() => handleModSelect(mod.external_id)}
                                            >
                                                <div className="mod-card-banner">
                                                    <span className="mod-card-banner-placeholder">🔧</span>
                                                </div>
                                                <div className="mod-card-body">
                                                    <h3 className="mod-card-title">{mod.title}</h3>
                                                    <p className="mod-card-content">
                                                        {mod.description?.length > 100
                                                            ? mod.description.slice(0, 100) + '…'
                                                            : mod.description}
                                                    </p>
                                                    <div className="mod-card-footer">
                                                        <span className="mod-card-author">
                                                            👤 {mod.author?.username || mod.author_username || 'Unknown'}
                                                        </span>
                                                        <span className="mod-card-date">
                                                            {new Date(mod.createdAt || mod.created_at).toLocaleDateString('ru-RU', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="mod-card-stats">
                                                        <span className="mod-card-transitions" title="Переходы">
                                                            🔗 {mod.popularity ?? 0}
                                                        </span>
                                                        <span className="mod-card-read">Создать руководство →</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
