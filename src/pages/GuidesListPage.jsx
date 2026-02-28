import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as guideApi from '../api/modGuides';
import StatusBadge from '../components/StatusBadge';
import './GuidesListPage.css';

export default function GuidesListPage() {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadGuides();
    }, []);

    const loadGuides = async () => {
        try {
            const data = await guideApi.getAllGuides();
            // Filter out inactive/blocked guides for public view
            const activeGuides = data.filter(g => g.status === 'ACTIVE');
            const sortedData = activeGuides.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
            setGuides(sortedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                        Полезные гайды, советы и инструкции по модам от нашего сообщества.
                    </p>
                </div>

                <div className="guides-grid">
                    {guides.length === 0 ? (
                        <div className="no-guides-message">
                            Пока нет доступных руководств.
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
                                        {guide.content?.slice(0, 150)}
                                        {guide.content?.length > 150 ? '...' : ''}
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
            </main>
        </div>
    );
}
