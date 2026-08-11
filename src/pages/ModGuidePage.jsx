import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getModGuideById } from '../api/modGuides';
import { getMod } from '../api/mods';
import GuideMarkdown from '../components/guides/GuideMarkdown';
import './ModGuidePage.css';

export default function ModGuidePage() {
    const { id, guideId } = useParams();
    const { user } = useAuth();
    const [guide, setGuide] = useState(null);
    const [mod, setMod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const modData = await getMod(id);
                setMod(modData);
                const guideData = await getModGuideById(id, guideId);
                setGuide(guideData);
            } catch (err) {
                if (!err.message.includes('404') && !err.message.toLowerCase().includes('not found')) {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, guideId]);

    if (loading) return <div className="guide-loading">Loading guide…</div>;
    if (error) return <div className="guide-error">Error: {error}</div>;
    if (!mod) return <div className="guide-error">Mod not found.</div>;

    if (!guide) {
        return (
            <div className="guide-container guide-empty-page">
                <Link to="/guides" className="guide-back-link">← All guides</Link>
                <h1>Guide for {mod.title}</h1>
                <p>No guide exists for this mod yet.</p>
                {user && <Link to={`/mod/${id}/guides/new`} className="guide-create-btn">Create guide</Link>}
            </div>
        );
    }

    const canEdit = user && (
        user.role === 'ADMIN'
        || user.role === 'SUPER_ADMIN'
        || user.id === guide.author?.id
    );

    return (
        <div className="guide-container">
            <header className="guide-header">
                <Link to="/guides" className="guide-back-link">← All guides</Link>
                <h1>{guide.title}</h1>
                <div className="guide-meta">
                    <span className="guide-subject-label">Mod guide</span>
                    <Link to={`/mod/${id}`} className="guide-subject-link">{mod.title}</Link>
                    {guide.author && <span>By {guide.author.username}</span>}
                </div>
            </header>

            <div className="guide-content-wrapper">
                <div className="guide-markdown-body">
                    <GuideMarkdown hoistInfobox>{guide.description}</GuideMarkdown>
                </div>
            </div>

            {canEdit && (
                <div className="guide-admin-actions">
                    <Link to={`/mod/${id}/guides/${guideId}/edit`} className="guide-edit-btn">Edit guide</Link>
                </div>
            )}
        </div>
    );
}
