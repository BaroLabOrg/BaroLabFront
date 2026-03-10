import { useState } from 'react';
import './ModHero.css';

export default function ModHero({ mod, onSubscribe }) {
    const [subscribing, setSubscribing] = useState(false);
    const [subError, setSubError] = useState('');

    const subtitle = mod.description
        ? mod.description.length > 150
            ? mod.description.slice(0, 150) + '…'
            : mod.description
        : 'Описание мода';

    const handleSubscribe = async () => {
        setSubscribing(true);
        setSubError('');
        try {
            await onSubscribe();
        } catch (err) {
            setSubError(err.message);
        } finally {
            setSubscribing(false);
        }
    };

    return (
        <div className="mod-hero glass-card fade-in">
            <div className="mod-hero-left">
                <div
                    className="mod-hero-avatar"
                    style={mod.main_image ? { backgroundImage: `url(${mod.main_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                    {!mod.main_image && <span className="mod-hero-avatar-placeholder">🔧</span>}
                </div>
                <div className="mod-hero-info">
                    <h1 className="mod-hero-title">{mod.title}</h1>
                    <p className="mod-hero-subtitle">{subtitle}</p>
                    <div className="mod-hero-meta">
                        <span className="mod-hero-author">👤 {mod.author_username || 'Unknown'}</span>
                        <span className="mod-hero-separator">·</span>
                        <span className="mod-hero-date">
                            {new Date(mod.created_at).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mod-hero-right">
                <button
                    className="mod-hero-subscribe-btn btn btn-primary"
                    onClick={handleSubscribe}
                    disabled={subscribing}
                >
                    {subscribing ? 'Загрузка...' : '⬇ Download'}
                </button>
                <div className="mod-hero-stats">
                    <span className="mod-hero-transitions-badge" title="Переходы в Steam Workshop">
                        🔗 {mod.popularity ?? 0} переходов
                    </span>
                </div>
                {subError && <div className="mod-hero-error">{subError}</div>}
            </div>
        </div>
    );
}
