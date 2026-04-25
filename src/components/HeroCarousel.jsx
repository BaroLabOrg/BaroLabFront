import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { searchMods, subscribeMod } from '../api/mods';
import './HeroCarousel.css';

function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'TODAY';
    if (days === 1) return '1 DAY AGO';
    return `${days} DAYS AGO`;
}

function StarRating({ value }) {
    const stars = Math.round((value || 0) * 2) / 2;
    return (
        <span className="hero-stars">
            {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= stars ? 'star filled' : 'star'}>★</span>
            ))}
            <span className="hero-rating-val">({value ? value.toFixed(1) : '—'})</span>
        </span>
    );
}

export default function HeroCarousel() {
    const [mods, setMods] = useState([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        searchMods({ sortBy: 'popularity', direction: 'desc', size: 5 })
            .then((res) => setMods(res.items || []))
            .catch(() => setMods([]))
            .finally(() => setLoading(false));
    }, []);

    const prev = useCallback(() => setCurrent((c) => (c - 1 + mods.length) % mods.length), [mods.length]);
    const next = useCallback(() => setCurrent((c) => (c + 1) % mods.length), [mods.length]);

    useEffect(() => {
        if (mods.length < 2) return;
        const id = setInterval(next, 6000);
        return () => clearInterval(id);
    }, [mods.length, next]);

    if (loading) {
        return <div className="hero-skeleton"><div className="loading-spinner" /></div>;
    }

    if (!mods.length) return null;

    const mod = mods[current];
    const externalId = mod.external_id || mod.externalId;
    const mainImage = mod.main_image || mod.mainImage;
    const updatedAt = mod.updated_at || mod.updatedAt;
    const popularity = mod.popularity ?? 0;
    const rating = mod.rating;

    const handleDownload = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await subscribeMod(externalId);
        } catch {
            window.open(`https://steamcommunity.com/sharedfiles/filedetails/?id=${externalId}`, '_blank');
        }
    };

    return (
        <div className="hero-carousel">
            <Link to={`/mod/${externalId}`} className="hero-bg-link">
                {mainImage && (
                    <div
                        className="hero-bg"
                        style={{ backgroundImage: `url(${mainImage})` }}
                    />
                )}
                <div className="hero-overlay" />
            </Link>

            <div className="hero-stub-version">V_CORE: 1.4.2</div>

            <div className="hero-content container">
                <div className="hero-left">
                    <h1 className="hero-title">{mod.title}</h1>
                    <p className="hero-desc">
                        {mod.description?.length > 160
                            ? mod.description.slice(0, 160) + '…'
                            : mod.description}
                    </p>
                    <div className="hero-actions">
                        <button className="btn btn-primary hero-btn-download" onClick={handleDownload}>
                            Download Mod
                        </button>
                        <Link to={`/mod/${externalId}`} className="btn btn-outline hero-btn-guide">
                            Read Guide
                        </Link>
                    </div>
                    <div className="hero-stub-status">[TECH DETAILS: STATUS: TRENDING]</div>
                </div>

                <div className="hero-right">
                    <div className="hero-meta-row">
                        <span className="hero-meta-label">RATING:</span>
                        <StarRating value={rating} />
                    </div>
                    <div className="hero-meta-row">
                        <span className="hero-meta-label">DOWNLOADS:</span>
                        <span className="hero-meta-val">{popularity.toLocaleString('en-US')}+</span>
                    </div>
                    <div className="hero-meta-row">
                        <span className="hero-meta-label">LAST UPDATED:</span>
                        <span className="hero-meta-val">{formatRelativeTime(updatedAt)}</span>
                    </div>
                </div>
            </div>

            <div className="hero-dots">
                {mods.map((_, i) => (
                    <button
                        key={i}
                        className={`hero-dot ${i === current ? 'active' : ''}`}
                        onClick={() => setCurrent(i)}
                        aria-label={`Slide ${i + 1}`}
                    />
                ))}
            </div>

            <button className="hero-arrow hero-arrow-prev" onClick={prev} aria-label="Previous">‹</button>
            <button className="hero-arrow hero-arrow-next" onClick={next} aria-label="Next">›</button>
        </div>
    );
}
