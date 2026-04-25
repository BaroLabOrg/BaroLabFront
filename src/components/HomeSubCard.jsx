import { Link } from 'react-router-dom';
import './HomeSubCard.css';

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
}

export default function HomeSubCard({ submarine }) {
    const externalId = submarine.external_id || submarine.externalId;
    const mainImage = submarine.main_image || submarine.mainImage;
    const author = submarine.author_username || submarine.authorUsername || 'Unknown';
    const updatedAt = submarine.updated_at || submarine.updatedAt;
    const tags = submarine.tags || [];
    const popularity = submarine.popularity ?? 0;
    const rating = submarine.rating;

    return (
        <Link to={`/submarines/${externalId}`} className="home-sub-card glass-card">
            <div
                className="home-sub-card-img"
                style={mainImage ? { backgroundImage: `url(${mainImage})` } : {}}
            >
                {!mainImage && <span className="home-sub-card-img-placeholder">🚢</span>}
            </div>
            <div className="home-sub-card-body">
                <h3 className="home-sub-card-title">{submarine.title}</h3>
                {tags.length > 0 && (
                    <div className="home-sub-card-tags">
                        {tags.slice(0, 3).map((t) => (
                            <span key={t.id || t.slug} className="home-sub-card-tag">
                                {(t.name || t.slug || '').toUpperCase()}
                            </span>
                        ))}
                    </div>
                )}
                <div className="home-sub-card-footer">
                    <span className="home-sub-card-stat">★ {rating ? rating.toFixed(1) : '—'}</span>
                    <span className="home-sub-card-stat">↑ {popularity >= 1000 ? (popularity / 1000).toFixed(0) + 'K' : popularity}</span>
                    <span className="home-sub-card-stat home-sub-card-date">Updated {formatRelativeTime(updatedAt)}</span>
                    <span className="home-sub-card-author">◉ {author}</span>
                </div>
            </div>
        </Link>
    );
}
