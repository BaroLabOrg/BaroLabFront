import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as modsApi from '../api/mods';
import CommentItem from './CommentItem';
import './CommentsSection.css';

export default function CommentsSection({ externalId }) {
    const { isAuthenticated } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commentBody, setCommentBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (externalId) {
            loadComments();
        }
    }, [externalId]);

    const loadComments = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await modsApi.getModComments(externalId);
            setComments(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentBody.trim()) return;
        setSubmitting(true);
        try {
            const newComment = await modsApi.createModComment(externalId, commentBody);
            setComments([...comments, newComment]);
            setCommentBody('');
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <section className="mod-comments-section glass-card">
                <div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка комментариев...</div>
            </section>
        );
    }

    return (
        <section className="mod-comments-section glass-card">
            <h3 className="mod-comments-title">
                Комментарии <span className="mod-comments-count">{comments.length}</span>
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
                    {error && <div className="mod-hero-error" style={{ marginTop: 8, color: 'var(--error)' }}>{error}</div>}
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

            {!isAuthenticated && error && <div className="mod-hero-error" style={{ marginTop: 8, color: 'var(--error)' }}>{error}</div>}

            <div className="mod-comments-list">
                {comments.length === 0 ? (
                    <p className="mod-comments-empty">Комментариев пока нет. Будьте первым!</p>
                ) : (
                    comments.map((c) => (
                        <div key={c.id} style={{ marginBottom: '16px' }}>
                            <CommentItem comment={c} />
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
