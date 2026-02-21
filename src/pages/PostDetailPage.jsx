import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api/api';

import CommentItem from '../components/CommentItem';
import './PostDetailPage.css';

export default function PostDetailPage() {
    const { postId } = useParams();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // New comment
    const [commentBody, setCommentBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [postId]);

    const loadData = async () => {
        try {
            const [postData, commentsData] = await Promise.all([
                api.getPostById(postId),
                api.getComments(postId),
            ]);
            setPost(postData);
            setComments(commentsData);
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
            const newComment = await api.createComment(postId, commentBody);
            setComments([...comments, newComment]);
            setCommentBody('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Загрузка поста...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !post) {
        return (
            <div className="page">
                <div className="container">
                    <div className="auth-error">{error}</div>
                    <Link to="/" className="btn btn-ghost" style={{ marginTop: 16 }}>
                        ← Назад к постам
                    </Link>
                </div>
            </div>
        );
    }

    const date = post
        ? new Date(post.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : '';

    return (
        <div className="page">
            <div className="container">
                <Link to="/" className="back-link">← Назад к постам</Link>

                {post && (
                    <article className="post-detail glass-card fade-in">
                        <div className="post-detail-meta">
                            <span className="post-detail-author" style={{ marginRight: 16 }}>
                                👤 {post.author_username || post.user_id?.slice(0, 8)}
                            </span>
                            <span className="post-detail-date">{date}</span>
                            <span className="post-detail-rating">★ {post.rating}</span>
                        </div>
                        <h1 className="post-detail-title">{post.title}</h1>
                        <div className="post-detail-body">
                            {post.content}
                        </div>
                    </article>
                )}

                {/* Comments Section */}
                <section className="comments-section fade-in">
                    <h2 className="comments-title">
                        Комментарии <span className="comments-count">{comments.length}</span>
                    </h2>

                    <form className="comment-form" onSubmit={handleAddComment}>
                        <textarea
                            id="comment-input"
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                            placeholder="Напишите комментарий..."
                            rows="3"
                            required
                        />
                        <button
                            id="submit-comment"
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={submitting}
                        >
                            {submitting ? 'Отправка...' : 'Отправить'}
                        </button>
                    </form>

                    {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <p className="no-comments">Комментариев пока нет. Будьте первым!</p>
                        ) : (
                            comments.map((c) => <CommentItem key={c.id} comment={c} />)
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
