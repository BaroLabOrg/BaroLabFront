import { Link } from 'react-router-dom';

const SOURCE_LABELS = { VANILLA: 'Vanilla', MOD: 'Mod' };

function humanize(value) {
    return String(value || '')
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}

export default function EncyclopediaCard({ item, onSelect, actionLabel = 'Read article →' }) {
    const content = (
        <>
            <span className="encyclopedia-card-image-link">
                {item.primaryImageUrl ? (
                    <img src={item.primaryImageUrl} alt={item.title} className="encyclopedia-card-image" />
                ) : (
                    <span className="encyclopedia-card-image-placeholder">📄</span>
                )}
            </span>
            <span className="encyclopedia-card-body">
                <span className="encyclopedia-card-meta">
                    <span>{humanize(item.entityType) || 'Other'}</span>
                    <span className={`encyclopedia-source-badge encyclopedia-source-badge-${String(item.entitySource || '').toLowerCase()}`}>
                        {SOURCE_LABELS[item.entitySource] || item.entitySource}
                    </span>
                </span>
                <span className="encyclopedia-card-title">{item.title}</span>
                <span className="encyclopedia-card-description">
                    {item.summary || item.shortDescription || 'Description is not available yet.'}
                </span>
                <span className="encyclopedia-card-action">{actionLabel}</span>
            </span>
        </>
    );

    if (onSelect) {
        return (
            <button
                type="button"
                className="encyclopedia-card glass-card encyclopedia-card-select"
                aria-label={`Write guide about ${item.title}`}
                onClick={() => onSelect(item)}
            >
                {content}
            </button>
        );
    }
    return <Link to={`/encyclopedia/${item.slug}`} aria-label={item.title} className="encyclopedia-card glass-card">{content}</Link>;
}
