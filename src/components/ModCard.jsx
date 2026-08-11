import { Link } from 'react-router-dom';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
import ImageWithFallback from './ImageWithFallback';
import './ModCard.css';

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const exactNumberFormatter = new Intl.NumberFormat('en-US');

export default function ModCard({ mod, onSelect, actionLabel = 'Read more →', style }) {
    const externalId = mod.external_id || mod.externalId;
    const mainImage = mod.main_image || mod.mainImage;
    const authorName = mod.author_username || mod.authorUsername || mod.author?.username || 'Unknown';
    const createdAt = mod.created_at || mod.createdAt;
    const subscriptions = Number.isFinite(Number(mod.popularity)) ? Number(mod.popularity) : 0;
    const subscriptionLabel = compactNumberFormatter.format(subscriptions);
    const createdDate = createdAt ? new Date(createdAt) : null;
    const date = createdDate && !Number.isNaN(createdDate.getTime())
        ? createdDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
        : '';
    const descriptionExcerpt = steamBbcodeToExcerpt(mod.description, 100);

    const content = (
        <>
            <div className="mod-card-banner">
                <ImageWithFallback
                    className="mod-card-banner-image"
                    src={mainImage}
                    alt={`${mod.title || 'Mod'} cover`}
                    fallbackLabel="Cover unavailable"
                    referrerPolicy="no-referrer"
                />
            </div>
            <div className="mod-card-body">
                <h3 className="mod-card-title">{mod.title}</h3>
                <p className="mod-card-content">
                    {descriptionExcerpt || 'No description'}
                </p>
                <div className="mod-card-footer">
                    <span className="mod-card-author">
                        By {authorName}
                    </span>
                    <span className="mod-card-date" title={date ? `Published on Steam: ${date}` : undefined}>
                        {date}
                    </span>
                </div>
                <div className="mod-card-stats">
                    <span
                        className="mod-card-transitions"
                        title={`${exactNumberFormatter.format(subscriptions)} Steam subscribers`}
                        aria-label={`${exactNumberFormatter.format(subscriptions)} Steam subscribers`}
                    >
                        {subscriptionLabel} subscribers
                    </span>
                    <span className="mod-card-read">{actionLabel}</span>
                </div>
            </div>
        </>
    );

    if (onSelect) {
        return (
            <button
                type="button"
                className="mod-card glass-card"
                style={style}
                aria-label={`Write guide about ${mod.title}`}
                onClick={() => onSelect(mod)}
            >
                {content}
            </button>
        );
    }
    return <Link to={`/mod/${externalId}`} className="mod-card glass-card" style={style}>{content}</Link>;
}

