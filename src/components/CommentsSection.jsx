import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mapPaginationError } from '../api/api';
import * as modsApi from '../api/mods';
import CommentItem from './CommentItem';
import Pagination from './Pagination';
import './CommentsSection.css';

export default function CommentsSection({ externalId }) {
    const PAGE_SIZE = 20;
    const { isAuthenticated } = useAuth();
    const [comments, setComments] = useState([]);
    const [totalComments, setTotalComments] = useState(0);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentBody, setCommentBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setPage(0);
    }, [externalId]);

    useEffect(() => {
        if (!externalId) return;
        loadComments(page);
    }, [externalId, page]);

    const loadComments = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await modsApi.getModComments(externalId, {
                page: targetPage,
                size: PAGE_SIZE,
                sortBy: 'createdAt',
                direction: 'desc',
            });
            setComments(data.items);
            setTotalComments(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setError(mapPaginationError(err, 'Не удалось загрузить комментарии'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentBody.trim()) return;
        setSubmitting(true);
        try {
            await modsApi.createModComment(externalId, commentBody);
            setCommentBody('');
            setError('');
            if (page === 0) {
                await loadComments(0);
            } else {
                setPage(0);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <section className="mod-comments-section glass-card">
                <div className="mod-comments-loading">Загрузка комментариев...</div>
            </section>
        );
    }

    return (
        <section className="mod-comments-section glass-card">
            <h3 className="mod-comments-title">
                Комментарии <span className="mod-comments-count">{totalComments}</span>
            </h3>

            {isAuthenticated ? (
                <form className="mod-comment-form" onSubmit={handleAddComment}>
                    <textarea
                        className="mod-comment-input"
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder="Напишите комментарий..."
                        rows="3"
                        required
                        disabled={submitting}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                        {submitting ? 'Отправка...' : 'Отправить'}
                    </button>
                    {error && <div className="auth-error mod-comments-error">{error}</div>}
                </form>
            ) : (
                <div className="mod-comment-guest">
                    <p>
                        <Link to="/login">Войдите</Link> или{' '}
                        <Link to="/sign-up">зарегистрируйтесь</Link>, чтобы оставить
                        комментарий.
                    </p>
                </div>
            )}

            {!isAuthenticated && error && <div className="auth-error mod-comments-error">{error}</div>}

            <div className="mod-comments-list">
                {comments.length === 0 ? (
                    <p className="mod-comments-empty">Комментариев пока нет. Будьте первым!</p>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} className="mod-comment-entry">
                            <CommentItem comment={c} />
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
        </section>
    );
}
