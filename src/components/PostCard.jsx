import { Link } from 'react-router-dom';

import './PostCard.css';

export default function PostCard({ post }) {
    const date = new Date(post.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    const ratingValue = typeof post?.rating === 'number' ? post.rating : 0;
    const ratingTone = ratingValue > 0 ? 'positive' : ratingValue < 0 ? 'negative' : 'neutral';

    return (
        <Link to={`/post/${post.id}`} className="post-card glass-card">
            <div className="post-card-header">
                <span className="post-card-author" style={{ marginRight: 'auto', opacity: 0.8, fontSize: '0.9rem' }}>
                    👤 {post.author_username || post.user_id?.slice(0, 8)}
                </span>
                <span className="post-card-date">{date}</span>
            </div>
            <h3 className="post-card-title">{post.title}</h3>
            <p className="post-card-content">{post.description}</p>
            <div className="post-card-footer">
                <span className={`post-card-rating rating-value rating-${ratingTone}`}>
                    {post.rating}
                </span>
                <span className="post-card-read">Читать →</span>
            </div>
        </Link>
    );
}
