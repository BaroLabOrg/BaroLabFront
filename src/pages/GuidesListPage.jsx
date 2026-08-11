import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import * as guideApi from '../api/modGuides';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './GuidesListPage.css';

const PAGE_SIZE = 12;

function ManualIcon() {
    return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M9 8.5h21a6 6 0 0 1 6 6v25H15a6 6 0 0 1-6-6v-25Z" />
            <path d="M15 8.5v31M20 17h10M20 23h10M20 29h7" />
            <path d="M36 14.5h3v25h-3" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h11M11 6l4 4-4 4" />
        </svg>
    );
}

function formatGuideDate(value) {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function GuidesListPage() {
    useDocumentMeta({
        title: 'Guides — BaroLab',
        description: 'Read Barotrauma community guides on engineering, wiring, medical procedures, modding and more on BaroLab.',
    });

    const { isAuthenticated } = useAuth();
    const [guides, setGuides] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [totalGuides, setTotalGuides] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function loadGuides() {
            setLoading(true);
            setError('');
            try {
                const data = await guideApi.getAllGuides({
                    page,
                    size: PAGE_SIZE,
                    sortBy: 'createdAt',
                    direction: 'desc',
                });
                if (cancelled) return;
                setGuides(data.items);
                setTotalGuides(data.total);
                setTotalPages(data.total_pages);
                setHasNext(data.has_next);
                setHasPrevious(data.has_previous);
            } catch (err) {
                if (!cancelled) setError(mapPaginationError(err, 'Failed to load guides'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadGuides();
        return () => { cancelled = true; };
    }, [page, retryKey]);

    const pageStart = guides.length ? page * PAGE_SIZE + 1 : 0;
    const pageEnd = page * PAGE_SIZE + guides.length;

    return (
        <div className="page page--guides fade-in">
            <main className="container guides-page">
                <header className="guides-masthead">
                    <div className="guides-masthead-copy">
                        <div className="guides-manual-mark"><ManualIcon /></div>
                        <div>
                            <h1>Community field manuals</h1>
                            <p>Practical knowledge for crews: systems, survival, modding and everything between.</p>
                        </div>
                    </div>
                    <div className="guides-masthead-actions">
                        <span className="guides-index-status">
                            <span>{totalGuides.toLocaleString()}</span> published
                        </span>
                        {isAuthenticated ? (
                            <Link to="/guides/new" className="guides-create-link">Create a guide</Link>
                        ) : (
                            <p className="guides-auth-note">
                                <Link to="/login">Log in</Link> to share a guide.
                            </p>
                        )}
                    </div>
                </header>

                <div className="guides-results-bar" aria-live="polite">
                    <span>{loading ? 'Opening the archive…' : `${pageStart}–${pageEnd} of ${totalGuides}`}</span>
                    <span>Newest first</span>
                </div>

                {loading ? (
                    <div className="guides-state" role="status">
                        <div className="loading-spinner" />
                        <p>Loading field manuals…</p>
                    </div>
                ) : error ? (
                    <div className="guides-state guides-state--error" role="alert">
                        <h2>The archive could not be opened</h2>
                        <p>{error}</p>
                        <button type="button" className="btn btn-outline" onClick={() => setRetryKey((current) => current + 1)}>
                            Try again
                        </button>
                    </div>
                ) : guides.length === 0 ? (
                    <div className="guides-state guides-state--empty">
                        <ManualIcon />
                        <h2>No guides published yet</h2>
                        <p>The archive is ready for the first crew-tested procedure.</p>
                        {isAuthenticated && <Link to="/guides/new" className="guides-create-link">Write the first guide</Link>}
                    </div>
                ) : (
                    <section className="guides-ledger" aria-label="Published guides">
                        {guides.map((guide) => {
                            const author = guide.author?.username || guide.author?.login || 'BaroLab crew';
                            const targetTitle = guide.targetTitle || guide.target_title || 'BaroLab subject';
                            return (
                                <Link key={guide.id} to={`/guides/${guide.id}`} className="guide-ledger-entry">
                                    <div className="guide-ledger-meta">
                                        <span>{formatGuideDate(guide.createdAt || guide.created_at)}</span>
                                        <span>By {author}</span>
                                    </div>
                                    <div className="guide-ledger-body">
                                        <h2>{guide.title}</h2>
                                        <p>
                                            {guide.description?.slice(0, 180) || 'Open this guide to read the complete procedure.'}
                                            {guide.description?.length > 180 ? '…' : ''}
                                        </p>
                                    </div>
                                    <div className="guide-ledger-subject">
                                        <span>Subject</span>
                                        <strong>{targetTitle}</strong>
                                    </div>
                                    <span className="guide-ledger-arrow"><ArrowIcon /></span>
                                </Link>
                            );
                        })}
                    </section>
                )}

                {!loading && !error && guides.length > 0 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        hasNext={hasNext}
                        hasPrevious={hasPrevious}
                        disabled={loading}
                        onPageChange={setPage}
                    />
                )}
            </main>
        </div>
    );
}
