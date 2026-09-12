import { Link } from 'react-router-dom';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
import { getTagTone } from '../utils/modTagTone';
import ContentGlyph from './ContentGlyph';
import ImageWithFallback from './ImageWithFallback';
import './HomeModCard.css';

const STEAM_ID_PATTERN = /^\d{15,20}$/;

// Compact integer formatting shared by the rating and download stats: plain
// integers under 1000 ("4"), otherwise a rounded K-suffix ("677K") — never a
// forced decimal, so a whole-number rating never renders as "4.0".
function formatCompact(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    if (num >= 1000) return `${Math.round(num / 1000)}K`;
    return String(Math.round(num));
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
    const authorSteamId = String(mod.author_steam_id || mod.authorSteamId || '').trim();
    const authorProfileUrl = STEAM_ID_PATTERN.test(authorSteamId)
        ? `https://steamcommunity.com/profiles/${authorSteamId}`
        : null;
    const updatedAt = mod.updated_at || mod.updatedAt;
    const popularity = mod.popularity ?? 0;
    const rating = mod.rating;
    const tags = mod.tags || [];

    const authorLine = (
        <>
            <ContentGlyph name="person" className="home-mod-card-author-icon" size={13} />
            {author}
        </>
    );

    return (
        <article className="home-mod-card">
            <span className="home-mod-card-go" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
            </span>
            <ImageWithFallback
                className="home-mod-card-img"
                src={mainImage}
                alt={`${mod.title || 'Mod'} cover`}
                fallbackLabel="Cover unavailable"
                referrerPolicy="no-referrer"
            />
            <div className="home-mod-card-body">
                <div className="home-mod-card-heading">
                    {/* The whole card is clickable via this link's stretched ::after
                        (see CSS) — that keeps the author link below a real, separate
                        <a>, avoiding an invalid nested-anchor. */}
                    <Link to={`/mod/${externalId}`} className="home-mod-card-title-link">
                        <h3 className="home-mod-card-title">{mod.title}</h3>
                    </Link>
                    {authorProfileUrl ? (
                        <a
                            className="home-mod-card-author home-mod-card-author--link"
                            href={authorProfileUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`Open ${author}'s Steam profile`}
                        >
                            {authorLine}
                        </a>
                    ) : (
                        <span className="home-mod-card-author">{authorLine}</span>
                    )}
                </div>
                <p className="home-mod-card-desc">
                    {steamBbcodeToExcerpt(mod.description, 90) || 'No description'}
                </p>
                {tags.length > 0 && (
                    <div className="home-mod-card-tags">
                        {tags.slice(0, 3).map((t) => (
                            <span
                                key={t.id || t.slug}
                                className={`home-mod-card-tag home-mod-card-tag--${getTagTone(t)}`}
                            >
                                {(t.name || t.slug || '').toUpperCase()}
                            </span>
                        ))}
                    </div>
                )}
                <div className="home-mod-card-footer">
                    <span className="home-mod-card-stat home-mod-card-stat--rating">
                        <ContentGlyph name="star" size={13} />
                        {rating ? formatCompact(rating) : '—'}
                    </span>
                    <span className="home-mod-card-stat">
                        <ContentGlyph name="download" size={13} />
                        {formatCompact(popularity) ?? 0}
                    </span>
                    <span className="home-mod-card-stat home-mod-card-date">Updated {formatRelativeTime(updatedAt)}</span>
                </div>
            </div>
        </article>
    );
}
