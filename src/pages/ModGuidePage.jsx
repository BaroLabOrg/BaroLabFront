import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
                // Fetch Mod info for header/context
                const modData = await getMod(id);
                setMod(modData);

                // Fetch Guide content
                const guideData = await getModGuideById(id, guideId);
                setGuide(guideData);
            } catch (err) {
                // Ignore 404s for guides (just means it doesn't exist yet)
                if (!err.message.includes('404') && !err.message.toLowerCase().includes('not found')) {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, guideId]);

    if (loading) return <div className="guide-loading">Loading guide...</div>;

    // Error is only for severe errors, not for "guide not found"
    if (error) return <div className="guide-error">Error: {error}</div>;

    if (!mod) return <div className="guide-error">Mod not found.</div>;

    if (!guide) {
        return (
            <div className="guide-container">
                <h1>Guide for {mod.title}</h1>
                <p>No guide exists for this mod yet.</p>
                {user && (
                    <Link to={`/mod/${id}/guides/new`} className="guide-create-btn">
                        Create guide
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="guide-container">
            <header className="guide-header">
                <Link to={`/mod/${id}`} className="guide-back-link">← Back to mod</Link>
                <h1>{guide.title}</h1>
                <div className="guide-meta">
                    <span>For Mod: <Link to={`/mod/${id}`} >{mod.title}</Link></span>
                    {guide.author && <span> • Last updated by {guide.author.username}</span>}
                </div>
            </header>

            <div className="guide-content-wrapper">
                <div className="guide-markdown-body">
                    <GuideMarkdown>{guide.description}</GuideMarkdown>
                </div>
            </div>

            <div className="guide-admin-actions">
                {(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.id === guide.author?.id)) && (
                    <Link to={`/mod/${id}/guides/${guideId}/edit`} className="guide-edit-btn">
                        Edit
                    </Link>
                )}
            </div>
        </div>
    );
}
