import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllGuides } from '../api/modGuides';
import { useAuth } from '../context/AuthContext';
import './GuidesSection.css';

export default function RelatedGuidesSection({ targetType, targetId }) {
    const { isAuthenticated } = useAuth();
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        <section className="guides-section glass-card">
            <div className="guides-header">
                <div className="guides-header-main">
                    <span className="guides-accent-bar" />
                    <h3 className="guides-title">Related guides</h3>
                </div>
                {isAuthenticated && (
                    <Link
                        className="btn btn-primary btn-sm guides-create-btn"
                        to={`/guides/new/editor?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`}
                    >
                        Write guide
                    </Link>
                )}
            </div>
            {loading ? (
                <div className="guides-empty"><p>Loading guides...</p></div>
            ) : error ? (
                <div className="guides-empty"><p>{error}</p></div>
            ) : guides.length === 0 ? (
                <div className="guides-empty"><p>No guides for this subject yet.</p></div>
            ) : (
                <ul className="guides-list">
                    {guides.map((guide) => (
                        <li className="guide-item" key={guide.id}>
                            <Link to={`/guides/${guide.id}`} className="guide-link">
                                <span className="guide-icon">📄</span>
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
