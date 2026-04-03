import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as modsApi from '../api/mods';

import ModHero from '../components/ModHero';
import ModSidebar from '../components/ModSidebar';
import UsedInCollections from '../components/UsedInCollections';
import GuidesSection from '../components/GuidesSection';
import CommentsSection from '../components/CommentsSection';
import ImageGallery from '../components/ImageGallery';
import './ModPage.css';

export default function ModPage() {
    const { externalId } = useParams();
    const { isAuthenticated, isAdmin } = useAuth();

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

    const handleAddTag = async (tagId) => {
        try {
            await modsApi.addTagToMod(externalId, tagId);
            // Reload the mod to get updated tags
            await loadMod();
        } catch (err) {
            console.error('Failed to add tag:', err);
            // Optionally, show a toast or error message here
            alert('Error adding tag: ' + err.message);
        }
    };

    const handleRemoveTag = async (tagId) => {
        try {
            await modsApi.removeTagFromMod(externalId, tagId);
            // Reload the mod to get updated tags
            await loadMod();
        } catch (err) {
            console.error('Failed to remove tag:', err);
            alert('Error removing tag: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Loading mod...</p>
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
                        ← Back to mods
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page mod-page">
            <div className="container mod-page-container">
                <Link to="/mods" className="back-link">← Back to mods</Link>

                {mod && (
                    <>
                        <ModHero mod={mod} onSubscribe={handleSubscribe} />

                        <div className="mod-page-layout">
                            {/* Left column: content */}
                            <main className="mod-page-main">
                                {/* Image Gallery */}
                                <ImageGallery
                                    className="mod-media-gallery glass-card fade-in"
                                    title={mod.title}
                                    includeMainImage={false}
                                    additionalImages={Array.isArray(mod.additional_images)
                                        ? mod.additional_images
                                        : Array.isArray(mod.additionalImages)
                                            ? mod.additionalImages
                                            : []}
                                    previewAlt="Preview"
                                />

                                {/* Content */}
                                <section className="mod-content-section glass-card fade-in">
                                    <h3 className="mod-content-heading">Description</h3>
                                    <div className="mod-content-body">
                                        {mod.description || 'No description.'}
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
                            <ModSidebar 
                                mod={mod} 
                                tags={Array.isArray(mod.tags) ? mod.tags : []} 
                                onAddTag={handleAddTag}
                                onRemoveTag={handleRemoveTag}
                                isAuthenticated={isAuthenticated}
                                isAdmin={isAdmin}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
