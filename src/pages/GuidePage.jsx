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

    if (loading) return <div className="guide-loading">Loading guide…</div>;
    if (!guide) return <div className="guide-error">{error || 'Guide not found.'}</div>;

    const targetTitle = value(guide, 'targetTitle', 'target_title') || 'BaroLab content';
    const targetHref = value(guide, 'targetHref', 'target_href') || '/guides';
    const targetType = value(guide, 'targetType', 'target_type') || 'CONTENT';
    const updatedAt = value(guide, 'updatedAt', 'updated_at') || value(guide, 'createdAt', 'created_at');
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
                    <span className="guide-subject-label">{targetType.toLowerCase()} guide</span>
                    <Link to={targetHref} className="guide-subject-link">{targetTitle}</Link>
                    {guide.author && <span>By {guide.author.username || guide.author.login}</span>}
                    {updatedAt && <time dateTime={updatedAt}>{new Date(updatedAt).toLocaleDateString()}</time>}
                </div>
            </header>
            <div className="guide-content-wrapper">
                <div className="guide-markdown-body">
                    <GuideMarkdown hoistInfobox>{guide.description}</GuideMarkdown>
                </div>
            </div>
            {canEdit && (
                <div className="guide-admin-actions">
                    <Link to={`/guides/${guideId}/edit`} className="guide-edit-btn">Edit guide</Link>
                </div>
            )}
        </div>
    );
}
