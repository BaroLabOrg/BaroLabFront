import { useState } from 'react';
import { Link } from 'react-router-dom';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
import './ModHero.css';

function DownloadIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 3v9m-4-3 4 4 4-4M4 16h12" />
        </svg>
    );
}

export default function ModHero({ mod, onSubscribe, canWriteGuide = false }) {
    const [subscribing, setSubscribing] = useState(false);
    const [subError, setSubError] = useState('');
    const authorName = mod.author_username || mod.authorUsername || 'Unknown';
    const authorSteamId = mod.author_steam_id || mod.authorSteamId || null;
    const steamProfileUrl = authorSteamId ? `https://steamcommunity.com/profiles/${authorSteamId}` : null;
    const versionLabel = mod.version || mod.mod_version || mod.modVersion || '';
    const externalId = mod.external_id || mod.externalId;

    const subtitle = steamBbcodeToExcerpt(mod.description, 180)
        || 'Community modification for Barotrauma.';

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
        <header className="mod-hero fade-in">
            <div className="mod-hero-left">
                <div className="mod-hero-avatar">
                    {mod.main_image ? (
                        <img src={mod.main_image} alt={`${mod.title} cover`} referrerPolicy="no-referrer" />
                    ) : (
                        <svg viewBox="0 0 48 48" aria-hidden="true">
                            <path d="m29 8 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" />
                            <path d="M20 27 9 38m2-8 7 7" />
                        </svg>
                    )}
                </div>
                <div className="mod-hero-info">
                    <h1 className="mod-hero-title">
                        {mod.title}
                        {versionLabel && <span className="mod-version">v{versionLabel}</span>}
                    </h1>
                    <p className="mod-hero-subtitle">{subtitle}</p>
                    <div className="mod-hero-meta">
                        {steamProfileUrl ? (
                            <a className="mod-hero-author-link" href={steamProfileUrl} target="_blank" rel="noreferrer">
                                {authorName}
                            </a>
                        ) : (
                            <span>{authorName}</span>
                        )}
                        {mod.created_at && (
                            <time dateTime={mod.created_at}>
                                Published {new Date(mod.created_at).toLocaleDateString('en-US', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })}
                            </time>
                        )}
                        <span>{Number(mod.popularity ?? 0).toLocaleString()} Workshop visits</span>
                    </div>
                </div>
            </div>

            <div className="mod-hero-right">
                {canWriteGuide && externalId && (
                    <Link className="mod-hero-guide-link" to={`/guides/new/editor?targetType=MOD&targetId=${encodeURIComponent(externalId)}`}>
                        Write a guide
                    </Link>
                )}
                <button className="mod-hero-subscribe-btn" onClick={handleSubscribe} disabled={subscribing}>
                    <DownloadIcon />
                    {subscribing ? 'Opening Workshop…' : 'Open in Workshop'}
                </button>
                {subError && <div className="mod-hero-error" role="alert">{subError}</div>}
            </div>
        </header>
    );
}
