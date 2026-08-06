import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGuideById } from '../api/modGuides';
import GuideMarkdown from '../components/guides/GuideMarkdown';
import './ModGuidePage.css';

function value(object, camel, snake) {
    return object?.[camel] ?? object?.[snake];
}

export default function GuidePage() {
    const { guideId } = useParams();
    const { user } = useAuth();
    const [guide, setGuide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        getGuideById(guideId)
            .then((result) => { if (!cancelled) setGuide(result); })
            .catch((err) => { if (!cancelled) setError(err?.message || 'Guide not found.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [guideId]);

    if (loading) return <div className="guide-loading">Loading guide...</div>;
    if (!guide) return <div className="guide-error">{error || 'Guide not found.'}</div>;

    const targetTitle = value(guide, 'targetTitle', 'target_title') || 'BaroLab content';
    const targetHref = value(guide, 'targetHref', 'target_href') || '/guides';
    const targetType = value(guide, 'targetType', 'target_type') || 'CONTENT';
    const canEdit = user && (
        user.role === 'ADMIN'
        || user.role === 'SUPER_ADMIN'
        || user.id === guide.author?.id
    );

    return (
        <div className="guide-container">
            <header className="guide-header">
                <Link to={targetHref} className="guide-back-link">← Back to {targetType.toLowerCase()}</Link>
                <h1>{guide.title}</h1>
                <div className="guide-meta">
                    <span>For {targetType.toLowerCase()}: <Link to={targetHref}>{targetTitle}</Link></span>
                    {guide.author && <span> · Last updated by {guide.author.username || guide.author.login}</span>}
                </div>
            </header>
            <div className="guide-content-wrapper">
                <div className="guide-markdown-body">
                    <GuideMarkdown>{guide.description}</GuideMarkdown>
                </div>
            </div>
            {canEdit && (
                <div className="guide-admin-actions">
                    <Link to={`/guides/${guideId}/edit`} className="guide-edit-btn">Edit</Link>
                </div>
            )}
        </div>
    );
}
