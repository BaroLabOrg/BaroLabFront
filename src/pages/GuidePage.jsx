import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGuideById } from '../api/modGuides';
import GuideMarkdown from '../components/guides/GuideMarkdown';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { absoluteSiteUrl, breadcrumbStructuredData, plainTextExcerpt } from '../seo/siteMetadata';
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

    const guideDescription = plainTextExcerpt(guide?.description)
        || 'Read this community-written Barotrauma guide on BaroLab.';
    const guideUpdatedAt = value(guide, 'updatedAt', 'updated_at') || value(guide, 'createdAt', 'created_at');
    const guideCreatedAt = value(guide, 'createdAt', 'created_at');
    useDocumentMeta({
        title: guide ? `${guide.title} — Barotrauma Guide | BaroLab` : 'Barotrauma Guide | BaroLab',
        description: guideDescription,
        canonicalPath: `/guides/${guideId}`,
        type: 'article',
        noIndex: Boolean(error && !guide),
        structuredData: guide ? [
            breadcrumbStructuredData([
                { name: 'BaroLab', path: '/' },
                { name: 'Barotrauma Guides', path: '/guides' },
                { name: guide.title, path: `/guides/${guideId}` },
            ]),
            {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: guide.title,
                description: guideDescription,
                url: absoluteSiteUrl(`/guides/${guideId}`),
                datePublished: guideCreatedAt,
                dateModified: guideUpdatedAt,
                author: guide.author ? {
                    '@type': 'Person',
                    name: guide.author.username || guide.author.login,
                } : undefined,
                publisher: {
                    '@type': 'Organization',
                    name: 'BaroLab',
                    url: absoluteSiteUrl('/'),
                },
            },
        ] : undefined,
    });

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
    const updatedAt = guideUpdatedAt;
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
