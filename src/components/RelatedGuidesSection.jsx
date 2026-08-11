import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllGuides } from '../api/modGuides';
import { useAuth } from '../context/AuthContext';
import ContentGlyph from './ContentGlyph';
import './GuidesSection.css';

export default function RelatedGuidesSection({ targetType, targetId }) {
    const { isAuthenticated } = useAuth();
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const headingId = `related-guides-${String(targetType).toLowerCase()}`;
    const subjectLabel = targetType === 'SUBMARINE' ? 'submarine' : 'subject';

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        getAllGuides({ targetType, targetId, page: 0, size: 6, sortBy: 'createdAt', direction: 'desc' })
            .then((response) => { if (!cancelled) setGuides(response.items || []); })
            .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load guides.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [targetId, targetType]);

    return (
        <section className="guides-section related-guides-section" aria-labelledby={headingId}>
            <div className="guides-header">
                <div className="guides-header-main">
                    <h3 id={headingId} className="guides-title">Related guides</h3>
                    {guides.length > 0 && <span className="guides-count">{guides.length}</span>}
                </div>
                {isAuthenticated && (
                    <Link
                        className="btn btn-sm guides-create-btn"
                        to={`/guides/new/editor?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`}
                    >
                        Write guide
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="guides-loading" aria-live="polite">
                    <span className="guides-loading-line" />
                    <span className="guides-loading-line guides-loading-line-short" />
                </div>
            ) : error ? (
                <div className="guides-empty guides-empty-error" role="status">
                    <span className="guides-empty-icon">
                        <ContentGlyph name="guide" />
                    </span>
                    <div className="guides-empty-copy">
                        <strong>Guides unavailable</strong>
                        <p>{error}</p>
                    </div>
                </div>
            ) : guides.length === 0 ? (
                <div className="guides-empty">
                    <span className="guides-empty-icon">
                        <ContentGlyph name="guide" />
                    </span>
                    <div className="guides-empty-copy">
                        <strong>No field guides yet</strong>
                        <p>Guides written for this {subjectLabel} will appear here.</p>
                    </div>
                </div>
            ) : (
                <ul className="guides-list">
                    {guides.map((guide) => (
                        <li className="guide-item" key={guide.id}>
                            <Link to={`/guides/${guide.id}`} className="guide-link">
                                <span className="guide-icon">
                                    <ContentGlyph name="document" size={18} />
                                </span>
                                <span className="guide-info">
                                    <span className="guide-name">{guide.title}</span>
                                    <span className="guide-meta">
                                        Author: {guide.author?.username || guide.author?.login || 'Unknown'}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
