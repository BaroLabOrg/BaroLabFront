import { Link } from 'react-router-dom';
import './ModCard.css';

export default function ModCard({ mod }) {
    const externalId = mod.external_id || mod.externalId;
    const mainImage = mod.main_image || mod.mainImage;
    const authorName = mod.author_username || mod.authorUsername || mod.author?.username || 'Unknown';
    const createdAt = mod.created_at || mod.createdAt;
    const createdDate = createdAt ? new Date(createdAt) : null;
    const date = createdDate && !Number.isNaN(createdDate.getTime())
        ? createdDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
        : '';

    return (
        <Link to={`/mod/${externalId}`} className="mod-card glass-card">
            <div
                className="mod-card-banner"
                style={mainImage ? { backgroundImage: `url(${mainImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!mainImage && <span className="mod-card-banner-placeholder">🔧</span>}
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
                        👤 {authorName}
                    </span>
                    <span className="mod-card-date">{date}</span>
                </div>
                <div className="mod-card-stats">
                    <span className="mod-card-transitions" title="Visits">
                        🔗 {mod.popularity ?? 0}
                    </span>
                    <span className="mod-card-read">Read more →</span>
                </div>
            </div>
        </Link>
    );
}

