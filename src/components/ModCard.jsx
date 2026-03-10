import { Link } from 'react-router-dom';
import './ModCard.css';

export default function ModCard({ mod }) {
    const date = new Date(mod.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <Link to={`/mod/${mod.external_id}`} className="mod-card glass-card">
            <div
                className="mod-card-banner"
                style={mod.main_image ? { backgroundImage: `url(${mod.main_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!mod.main_image && <span className="mod-card-banner-placeholder">🔧</span>}
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
                        👤 {mod.author_username || 'Unknown'}
                    </span>
                    <span className="mod-card-date">{date}</span>
                </div>
                <div className="mod-card-stats">
                    <span className="mod-card-transitions" title="Переходы">
                        🔗 {mod.popularity ?? 0}
                    </span>
                    <span className="mod-card-read">Подробнее →</span>
                </div>
            </div>
        </Link>
    );
}
