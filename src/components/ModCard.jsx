import { Link } from 'react-router-dom';
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

    const content = (
        <>
            <div
                className="mod-card-banner"
                style={mainImage ? { backgroundImage: `url(${mainImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!mainImage && (
                    <span className="mod-card-banner-placeholder" aria-hidden="true">
                        <svg viewBox="0 0 32 32" focusable="false">
                            <path d="M7 7h18v18H7zM11 3v8M21 3v8M11 21v8M21 21v8M3 11h8M21 11h8M3 21h8M21 21h8" />
                            <path d="M13 13h6v6h-6z" />
                        </svg>
                    </span>
                )}
            </div>
            <div className="mod-card-body">
                <h3 className="mod-card-title">{mod.title}</h3>
                <p className="mod-card-content">
                    {mod.description?.length > 100
                        ? mod.description.slice(0, 100) + '…'
                        : mod.description}
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

