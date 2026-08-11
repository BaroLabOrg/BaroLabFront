import ContentGlyph from './ContentGlyph';
import './WorkshopAuthorCard.css';

function ExternalLinkIcon() {
    return (
        <svg className="workshop-author-card-external" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M8 5h7v7M15 5l-8 8M13 15H5V7" />
        </svg>
    );
}

export default function WorkshopAuthorCard({
    authorName,
    authorSteamId,
    variant = 'mod',
}) {
    const displayName = String(authorName || '').trim() || 'Unknown author';
    const normalizedSteamId = String(authorSteamId || '').trim();
    const steamProfileUrl = /^\d{15,20}$/.test(normalizedSteamId)
        ? `https://steamcommunity.com/profiles/${normalizedSteamId}`
        : null;
    const className = `workshop-author-card workshop-author-card--${variant}`;

    const content = (
        <>
            <span className="workshop-author-card-avatar" aria-hidden="true">
                <ContentGlyph name="person" size={20} />
            </span>
            <span className="workshop-author-card-copy">
                <strong>{displayName}</strong>
                <small>{steamProfileUrl ? 'Steam Workshop author' : 'BaroLab author'}</small>
            </span>
            {steamProfileUrl && <ExternalLinkIcon />}
        </>
    );

    if (!steamProfileUrl) {
        return <div className={className}>{content}</div>;
    }

    return (
        <a
            className={`${className} workshop-author-card--link`}
            href={steamProfileUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Open ${displayName}'s Steam profile`}
        >
            {content}
        </a>
    );
}
