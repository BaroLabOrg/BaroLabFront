import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mapPaginationError } from '../api/api';
import * as modsApi from '../api/mods';
import CommentItem from './CommentItem';
import ContentGlyph from './ContentGlyph';
import Pagination from './Pagination';
import './CommentsSection.css';

const PAGE_SIZE = 20;

export default function CommentsSection({ externalId }) {
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
            setError(mapPaginationError(err, 'Failed to load comments'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (event) => {
        event.preventDefault();
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
            <section className="mod-comments-section" aria-labelledby="comments-heading">
                <h3 id="comments-heading" className="mod-comments-title">Comments</h3>
                <div className="mod-comments-loading" aria-live="polite">Loading comments...</div>
            </section>
        );
    }

    return (
        <section className="mod-comments-section" aria-labelledby="comments-heading">
            <div className="mod-comments-header">
                <h3 id="comments-heading" className="mod-comments-title">Comments</h3>
                <span className="mod-comments-count" aria-label={`${totalComments} comments`}>
                    {totalComments}
                </span>
            </div>

            {isAuthenticated ? (
                <form className="mod-comment-form" onSubmit={handleAddComment}>
                    <textarea
                        className="mod-comment-input"
                        value={commentBody}
                        onChange={(event) => setCommentBody(event.target.value)}
                        placeholder="Write a comment..."
                        rows="4"
                        aria-label="Comment"
                        required
                        disabled={submitting}
                    />
                    <div className="mod-comment-actions">
                        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                            {submitting ? 'Posting...' : 'Post comment'}
                        </button>
                    </div>
                    {error && <div className="auth-error mod-comments-error">{error}</div>}
                </form>
            ) : (
                <div className="mod-comment-guest">
                    <ContentGlyph name="comment" size={19} />
                    <p>
                        <Link to="/login">Log in</Link> or{' '}
                        <Link to="/sign-up">sign up</Link> to join the discussion.
                    </p>
                </div>
            )}

            {!isAuthenticated && error && <div className="auth-error mod-comments-error">{error}</div>}

            <div className="mod-comments-list">
                {comments.length === 0 ? (
                    <div className="mod-comments-empty">
                        <span className="mod-comments-empty-icon">
                            <ContentGlyph name="comment" />
                        </span>
                        <div>
                            <strong>No comments yet</strong>
                            <p>Start the discussion about this mod.</p>
                        </div>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="mod-comment-entry">
                            <CommentItem comment={comment} />
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
