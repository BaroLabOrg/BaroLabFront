import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getModGuides } from '../api/modGuides';
import { mapPaginationError } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Pagination from './Pagination';
import './GuidesSection.css';

export default function GuidesSection() {
    const PAGE_SIZE = 10;
    const { externalId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [guides, setGuides] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const canCreateGuide = user !== null;
    const canEditGuide = (guideAuthorId) => user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.id === guideAuthorId);

    useEffect(() => {
        setPage(0);
    }, [externalId]);

    useEffect(() => {
        async function fetchGuides() {
            if (!externalId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const data = await getModGuides(externalId, {
                    page,
                    size: PAGE_SIZE,
                    sortBy: 'createdAt',
                    direction: 'desc',
                });
                setGuides(data.items);
                setTotalPages(data.total_pages);
                setHasNext(data.has_next);
                setHasPrevious(data.has_previous);
            } catch (err) {
                setError(mapPaginationError(err, 'Failed to load guides'));
            } finally {
                setLoading(false);
            }
        }

        fetchGuides();
    }, [externalId, page]);

    const handleCreateGuide = () => {
        navigate(`/mod/${externalId}/guides/new`);
    };

    const handleEditGuide = (guideId) => {
        navigate(`/mod/${externalId}/guides/${guideId}/edit`);
    };

    if (loading) {
        return (
            <section className="guides-section glass-card">
                <div className="guides-header">
                    <div className="guides-header-main">
                        <span className="guides-accent-bar" />
                        <h3 className="guides-title">Related guides</h3>
                    </div>
                </div>
                <div className="guides-empty">
                    <p>Loading...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="guides-section glass-card">
            <div className="guides-header">
                <div className="guides-header-main">
                    <span className="guides-accent-bar" />
                    <h3 className="guides-title">Related guides</h3>
                </div>
                {canCreateGuide && (
                    <button
                        onClick={handleCreateGuide}
                        className="btn btn-primary btn-sm guides-create-btn"
                    >
                        Create guide
                    </button>
                )}
            </div>

            {guides.length === 0 ? (
                <div className="guides-empty">
                    <span className="guides-empty-icon">📖</span>
                    <p>No guides for this mod yet.</p>
                </div>
            ) : (
                <ul className="guides-list">
                    {guides.map((guide) => {
                        const guideCreatedAt = guide.createdAt || guide.created_at;

                        return (
                            <li key={guide.id} className="guide-item">
                                <Link to={`/mod/${externalId}/guides/${guide.id}`} className="guide-link">
                                    <span className="guide-icon">📄</span>
                                    <div className="guide-info">
                                        <span className="guide-name">{guide.title}</span>
                                        <span className="guide-meta">
                                            Author: {guide.author?.username || 'Unknown'} · {guideCreatedAt ? new Date(guideCreatedAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </Link>
                                {canEditGuide(guide.author?.id) && (
                                    <div className="guides-item-actions">
                                        <button
                                            className="btn btn-secondary btn-sm guides-edit-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleEditGuide(guide.id);
                                            }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {error && (
                <div className="auth-error guides-error">
                    {error}
                </div>
            )}

            <Pagination
                page={page}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                disabled={loading}
                onPageChange={setPage}
            />
        </section>
    );
}
