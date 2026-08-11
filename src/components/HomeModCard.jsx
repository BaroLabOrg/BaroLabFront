import { Link } from 'react-router-dom';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
import ImageWithFallback from './ImageWithFallback';
import './HomeModCard.css';

function MetricIcon({ type }) {
    if (type === 'rating') {
        return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>;
    }
    if (type === 'activity') {
        return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16 10 11l3 3 6-7M14 7h5v5" /></svg>;
    }
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /></svg>;
}

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
            <ImageWithFallback
                className="home-mod-card-img"
                src={mainImage}
                alt={`${mod.title || 'Mod'} cover`}
                fallbackLabel="Cover unavailable"
                referrerPolicy="no-referrer"
            />
            <div className="home-mod-card-body">
                <h3 className="home-mod-card-title">{mod.title}</h3>
                <p className="home-mod-card-author">
                    <span className="home-mod-card-author-icon"><MetricIcon type="author" /></span> {author}
                </p>
                <p className="home-mod-card-desc">
                    {steamBbcodeToExcerpt(mod.description, 90) || 'No description'}
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
                    <span className="home-mod-card-stat"><MetricIcon type="rating" /> {rating ? rating.toFixed(1) : '—'}</span>
                    <span className="home-mod-card-stat"><MetricIcon type="activity" /> {popularity >= 1000 ? (popularity / 1000).toFixed(0) + 'K' : popularity}</span>
                    <span className="home-mod-card-stat home-mod-card-date">Updated {formatRelativeTime(updatedAt)}</span>
                </div>
            </div>
        </Link>
    );
}
