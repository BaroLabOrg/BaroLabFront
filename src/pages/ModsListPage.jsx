import { useState, useEffect } from 'react';
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
    const [content, setContent] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadMods();
    }, []);

    const loadMods = async () => {
        try {
            const data = await modsApi.getMods();
            setMods(data);
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
            const newMod = await modsApi.createMod(title, content, externalUrl);
            setMods([newMod, ...mods]);
            setTitle('');
            setContent('');
            setExternalUrl('');
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
                    {isAuthenticated && (
                        <div className="mods-actions" style={{ marginTop: '1.5rem' }}>
                            <button
                                id="create-mod-toggle"
                                className="btn btn-primary"
                                onClick={() => setShowForm(!showForm)}
                            >
                                {showForm ? '✕ Закрыть' : '➕ Добавить мод'}
                            </button>
                        </div>
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
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
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
