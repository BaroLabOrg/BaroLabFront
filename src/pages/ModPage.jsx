import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as modsApi from '../api/mods';

import ModHero from '../components/ModHero';
import ModSidebar from '../components/ModSidebar';
import UsedInCollections from '../components/UsedInCollections';
import GuidesSection from '../components/GuidesSection';
import CommentsSection from '../components/CommentsSection';
import './ModPage.css';

export default function ModPage() {
    const { externalId } = useParams();

    const [mod, setMod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMod();
    }, [externalId]);

    const loadMod = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await modsApi.getMod(externalId);
            setMod(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = () => modsApi.subscribeMod(externalId);

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Загрузка мода...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !mod) {
        return (
            <div className="page">
                <div className="container">
                    <div className="auth-error">{error}</div>
                    <Link to="/mods" className="btn btn-ghost" style={{ marginTop: 16 }}>
                        ← Назад к модам
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page mod-page">
            <div className="container mod-page-container">
                <Link to="/mods" className="back-link">← Назад к модам</Link>

                {mod && (
                    <>
                        <ModHero mod={mod} onSubscribe={handleSubscribe} />

                        <div className="mod-page-layout">
                            {/* Left column: content */}
                            <main className="mod-page-main">
                                {/* Media banner */}
                                <div className="mod-media-block glass-card fade-in">
                                    <div className="mod-media-placeholder">
                                        <span className="mod-media-icon">🎮</span>
                                        <p>Изображение мода</p>
                                    </div>
                                </div>

                                {/* Used in collections */}
                                <UsedInCollections />

                                {/* Guides */}
                                <GuidesSection />

                                {/* Content */}
                                <section className="mod-content-section glass-card fade-in">
                                    <h3 className="mod-content-heading">Описание</h3>
                                    <div className="mod-content-body">
                                        {mod.content || 'Нет описания.'}
                                    </div>
                                </section>

                                {/* Comments */}
                                <CommentsSection externalId={externalId} />
                            </main>

                            {/* Right column: sidebar */}
                            <ModSidebar mod={mod} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
