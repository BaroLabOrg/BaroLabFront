import { Link } from 'react-router-dom';
import './HomeModCard.css';

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
}

export default function HomeModCard({ mod }) {
    const externalId = mod.external_id || mod.externalId;
    const mainImage = mod.main_image || mod.mainImage;
    const author = mod.author_username || mod.authorUsername || mod.author?.username || 'Unknown';
    const updatedAt = mod.updated_at || mod.updatedAt;
    const popularity = mod.popularity ?? 0;
    const rating = mod.rating;
    const tags = mod.tags || [];

    return (
        <Link to={`/mod/${externalId}`} className="home-mod-card glass-card">
            <div
                className="home-mod-card-img"
                style={mainImage ? { backgroundImage: `url(${mainImage})` } : {}}
            >
                {!mainImage && <span className="home-mod-card-img-placeholder">🔧</span>}
            </div>
            <div className="home-mod-card-body">
                <h3 className="home-mod-card-title">{mod.title}</h3>
                <p className="home-mod-card-author">
                    <span className="home-mod-card-author-icon">◉</span> {author}
                </p>
                <p className="home-mod-card-desc">
                    {mod.description?.length > 90
                        ? mod.description.slice(0, 90) + '…'
                        : mod.description}
                </p>
                {tags.length > 0 && (
                    <div className="home-mod-card-tags">
                        {tags.slice(0, 3).map((t) => (
                            <span key={t.id || t.slug} className="home-mod-card-tag">
                                {(t.name || t.slug || '').toUpperCase()}
                            </span>
                        ))}
                    </div>
                )}
                <div className="home-mod-card-footer">
                    <span className="home-mod-card-stat">★ {rating ? rating.toFixed(1) : '—'}</span>
                    <span className="home-mod-card-stat">↑ {popularity >= 1000 ? (popularity / 1000).toFixed(0) + 'K' : popularity}</span>
                    <span className="home-mod-card-stat home-mod-card-date">Updated {formatRelativeTime(updatedAt)}</span>
                </div>
            </div>
        </Link>
    );
}
