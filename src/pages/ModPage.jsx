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
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        loadMod();
    }, [externalId]);

    const loadMod = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await modsApi.getMod(externalId);
            setMod(data);
            const images = [...(data.additional_images || [])].filter(Boolean);
            if (images.length > 0) setSelectedImage(images[0]);
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
                                {/* Image Gallery */}
                                {mod && (() => {
                                    const images = [...(mod.additional_images || [])].filter(Boolean);
                                    if (images.length === 0) return null;

                                    return (
                                        <div className="mod-media-gallery glass-card fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {/* Main Preview */}
                                            <div className="mod-gallery-preview" style={{ width: '100%', height: '400px', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', overflow: 'hidden' }}>
                                                {selectedImage ? (
                                                    <img
                                                        src={selectedImage}
                                                        alt="Preview"
                                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                    />
                                                ) : null}
                                            </div>

                                            {/* Thumbnails */}
                                            <div className="mod-gallery-thumbnails" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
                                                {images.map((img, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => setSelectedImage(img)}
                                                        style={{
                                                            height: '64px',
                                                            minWidth: '114px',
                                                            cursor: 'pointer',
                                                            borderRadius: '4px',
                                                            border: selectedImage === img ? '2px solid #5c85d6' : '2px solid transparent',
                                                            opacity: selectedImage === img ? 1 : 0.6,
                                                            transition: 'all 0.2s',
                                                            backgroundImage: `url(${img})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Content */}
                                <section className="mod-content-section glass-card fade-in">
                                    <h3 className="mod-content-heading">Описание</h3>
                                    <div className="mod-content-body">
                                        {mod.description || 'Нет описания.'}
                                    </div>
                                </section>

                                {/* Used in collections */}
                                <UsedInCollections />

                                {/* Guides */}
                                <GuidesSection />

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
