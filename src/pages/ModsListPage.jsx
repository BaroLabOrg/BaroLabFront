import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as modsApi from '../api/mods';
import ModCard from '../components/ModCard';
import './ModsListPage.css';

export default function ModsListPage() {
    const { isAuthenticated } = useAuth();
    const [mods, setMods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    useEffect(() => {
        loadMods();
    }, []);

    const loadMods = async () => {
        try {
            const data = await modsApi.getMods();
            const activeMods = data.filter(m => m.status === 'ACTIVE');
            setMods(activeMods);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMod = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const parsedAdditional = additionalImages ? additionalImages.split(',').map(s => s.trim()).filter(Boolean) : [];
            const parsedRequired = requiredMods ? requiredMods.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : [];
            const parsedModsAbove = modsAbove ? modsAbove.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : [];

            const newMod = await modsApi.createMod(title, description, externalUrl, mainImage, parsedAdditional, parsedRequired, parsedModsAbove);
            setMods([newMod, ...mods]);
            setTitle('');
            setDescription('');
            setExternalUrl('');
            setMainImage('');
            setAdditionalImages('');
            setRequiredMods('');
            setModsAbove('');
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Загрузка модов...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <div className="mods-header-box glass-card shine">
                    <h1 className="mods-title">🔧 Библиотека Модов</h1>
                    <p className="mods-subtitle">
                        Steam Workshop моды сообщества
                    </p>
                    {isAuthenticated ? (
                        <div className="mods-actions" style={{ marginTop: '1.5rem' }}>
                            <button
                                id="create-mod-toggle"
                                className="btn btn-primary"
                                onClick={() => setShowForm(!showForm)}
                            >
                                {showForm ? '✕ Закрыть' : '➕ Добавить мод'}
                            </button>
                        </div>
                    ) : (
                        <p className="auth-prompt" style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                            <Link to="/login" className="auth-link">Войдите в аккаунт</Link> или{' '}
                            <Link to="/sign-up" className="auth-link">зарегистрируйтесь</Link>, чтобы добавлять моды.
                        </p>
                    )}
                </div>

                {isAuthenticated && showForm && (
                    <form className="create-mod-form glass-card fade-in" onSubmit={handleCreateMod}>
                        <h3 className="form-title">Добавить мод</h3>
                        <div className="form-group">
                            <label className="form-label">Название</label>
                            <input
                                id="mod-title-input"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Название мода"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Описание</label>
                            <textarea
                                id="mod-content-input"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Описание мода"
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
                            <label className="form-label">Главная картинка (URL)</label>
                            <input
                                id="mod-main-image-input"
                                type="url"
                                value={mainImage}
                                onChange={(e) => setMainImage(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Дополнительные картинки (URL, через запятую)</label>
                            <input
                                id="mod-additional-images-input"
                                type="text"
                                value={additionalImages}
                                onChange={(e) => setAdditionalImages(e.target.value)}
                                placeholder="https://img1.jpg, https://img2.jpg"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Необходимые моды (ID из Steam, через запятую)</label>
                            <input
                                id="mod-required-input"
                                type="text"
                                value={requiredMods}
                                onChange={(e) => setRequiredMods(e.target.value)}
                                placeholder="12345678, 87654321"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Моды выше (ID из Steam, через запятую)</label>
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
                            {creating ? 'Публикация...' : 'Опубликовать'}
                        </button>
                    </form>
                )}

                {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

                {mods.length === 0 ? (
                    <div className="empty-state fade-in">
                        <span className="empty-icon">🔧</span>
                        <p>Модов пока нет. Добавьте первый!</p>
                    </div>
                ) : (
                    <div className="mods-grid">
                        {mods.map((mod, i) => (
                            <ModCard key={mod.id} mod={mod} style={{ animationDelay: `${i * 0.05}s` }} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
