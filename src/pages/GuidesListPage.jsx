import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import * as guideApi from '../api/modGuides';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './GuidesListPage.css';
import '../components/ModCard.css';

export default function GuidesListPage() {
    useDocumentMeta({
        title: 'Guides — BaroLab',
        description: 'Read Barotrauma community guides on engineering, wiring, medical procedures, modding and more on BaroLab.',
    });

    const PAGE_SIZE = 12;
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [guides, setGuides] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [totalGuides, setTotalGuides] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadGuides(page);
    }, [page]);

    const loadGuides = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await guideApi.getAllGuides({
                page: targetPage,
                size: PAGE_SIZE,
                sortBy: 'createdAt',
                direction: 'desc',
            });
            setGuides(data.items);
            setTotalGuides(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setError(mapPaginationError(err, 'Failed to load guides'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => navigate('/guides/new');

    if (loading) {
        return (
        <div className="page page--guides fade-in">
            <main className="container guides-page">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page page--guides fade-in">
                <main className="container guides-page">
                    <div className="error-message">Error: {error}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="page page--guides fade-in">
            <main className="container guides-page">
                <div className="guides-header-box glass-card shine">
                    <h1 className="guides-title">📚 Guides Library</h1>
                    <p className="guides-subtitle">
                        Helpful guides, tips, and instructions from the community. Total: {totalGuides}
                    </p>
                    {isAuthenticated ? (
                        <div className="guides-actions" style={{ marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" onClick={handleOpenModal}>
                                ✍️ Create guide
                            </button>
                        </div>
                    ) : (
                        <p className="auth-prompt" style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                            <Link to="/login" className="auth-link">Log in</Link> or{' '}
                            <Link to="/sign-up" className="auth-link">sign up</Link> to create guides.
                        </p>
                    )}
                </div>

                <div className="guides-grid">
                    {guides.length === 0 ? (
                        <div className="no-guides-message">
                            No guides available on this page.
                        </div>
                    ) : (
                        guides.map((guide) => (
                            <div key={guide.id} className="guide-card glass-card hover-glow">
                                <div className="guide-card-content">
                                    <h2 className="guide-card-title">
                                        <Link to={`/guides/${guide.id}`}>
                                            {guide.title}
                                        </Link>
                                    </h2>
                                    <div className="guide-card-meta">
                                        <span className="guide-card-author">👤 {guide.author?.username || guide.author?.login}</span>
                                        <span className="guide-card-date">
                                            🕒 {new Date(guide.createdAt || guide.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="guide-card-snippet">
                                        {guide.description?.slice(0, 150)}
                                        {guide.description?.length > 150 ? '...' : ''}
                                    </p>
                                </div>
                                <div className="guide-card-footer">
                                    <Link
                                        to={guide.targetHref || guide.target_href || `/mod/${guide.modId || guide.mod_id}`}
                                        className="guide-card-mod-link"
                                    >
                                        {guide.targetTitle || guide.target_title || 'View subject'}
                                    </Link>
                                    <Link
                                        to={`/guides/${guide.id}`}
                                        className="btn btn-outline btn-sm"
                                    >
                                        Read
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    disabled={loading}
                    onPageChange={setPage}
                />

            </main>
        </div>
    );
}

