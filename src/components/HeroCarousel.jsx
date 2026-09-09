import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchMods, subscribeMod } from '../api/mods';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
import ImageWithFallback from './ImageWithFallback';
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
        <span className="hero-stars" aria-label={`${value ? value.toFixed(1) : 'No'} rating`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className={i <= stars ? 'star filled' : 'star'} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9L12 2.8Z" />
                </svg>
            ))}
            <span className="hero-rating-val">({value ? value.toFixed(1) : '—'})</span>
        </span>
    );
}

const INTERVAL = 6000;

export default function HeroCarousel() {
    const [mods, setMods] = useState([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const progressRef = useRef(null);
    const startRef = useRef(null);

    useEffect(() => {
        searchMods({ sortBy: 'popularity', direction: 'desc', size: 5 })
            .then((res) => setMods(res.items || []))
            .catch(() => setMods([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updatePreference = () => setReducedMotion(media.matches);
        updatePreference();
        media.addEventListener?.('change', updatePreference);
        return () => media.removeEventListener?.('change', updatePreference);
    }, []);

    const prev = useCallback(() => {
        setCurrent((c) => (c - 1 + mods.length) % mods.length);
        setProgress(0);
    }, [mods.length]);

    const next = useCallback(() => {
        setCurrent((c) => (c + 1) % mods.length);
        setProgress(0);
    }, [mods.length]);

    // Progress bar animation
    useEffect(() => {
        if (mods.length < 2 || paused || reducedMotion) return;
        setProgress(0);
        startRef.current = Date.now();

        const tick = () => {
            const elapsed = Date.now() - startRef.current;
            const pct = Math.min((elapsed / INTERVAL) * 100, 100);
            setProgress(pct);
            if (pct < 100) {
                progressRef.current = requestAnimationFrame(tick);
            }
        };
        progressRef.current = requestAnimationFrame(tick);

        const id = setTimeout(next, INTERVAL);
        return () => {
            clearTimeout(id);
            cancelAnimationFrame(progressRef.current);
        };
    }, [current, mods.length, next, paused, reducedMotion]);

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
        <section
            className="hero-carousel chamfer-lg"
            aria-label="Trending workshop mods"
            aria-roledescription="carousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
            }}
        >
            {/* Background — mod art, pushed back behind the rust gradient */}
            <Link to={`/mod/${externalId}`} className="hero-bg-link" aria-label={`Open ${mod.title}`}>
                <ImageWithFallback
                    className="hero-bg active"
                    src={mainImage}
                    alt={`${mod.title || 'Featured mod'} cover`}
                    fallbackLabel="Cover image unavailable"
                    referrerPolicy="no-referrer"
                />
                <div className="hero-overlay" />
            </Link>

            {/* Decorative marks */}
            <span className="hero-bracket hero-bracket-tl" aria-hidden="true" />
            <span className="hero-bracket hero-bracket-br" aria-hidden="true" />
            <svg className="hero-radar" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" fill="none" />
                <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.5" fill="none" />
                <circle cx="100" cy="100" r="100" stroke="currentColor" strokeWidth="0.5" fill="none" />
                <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="0.4" />
                <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="0.4" />
            </svg>
            <span className="hero-telemetry" aria-hidden="true">
                INDEX ▸ {String(current + 1).padStart(2, '0')} / {String(mods.length).padStart(2, '0')}
            </span>

            {/* Main content */}
            <div className="hero-content">
                <div className="hero-left" key={current}>
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        Live feed · Mod spotlight
                    </div>
                    <h2 className="hero-title">{mod.title}</h2>
                    <p className="hero-desc">
                        {steamBbcodeToExcerpt(mod.description, 160) || 'No description'}
                    </p>
                    <div className="hero-actions">
                        <button className="btn btn-primary hero-btn-download" onClick={handleDownload}>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 3v12m0 0 5-5m-5 5-5-5M5 20h14" />
                            </svg>
                            Download mod
                        </button>
                        <Link to={`/mod/${externalId}`} className="btn btn-outline hero-btn-guide">
                            View dossier
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M5 12h13M13 6l6 6-6 6" />
                            </svg>
                        </Link>
                    </div>
                    <div className="hero-status-line">
                        [ TECH DETAILS · STATUS: <b>TRENDING</b> ]
                    </div>
                </div>

                <div className="hero-right">
                    <div className="hero-meta-row">
                        <span className="hero-meta-label">RATING</span>
                        <StarRating value={rating} />
                    </div>
                    <div className="hero-meta-row">
                        <span className="hero-meta-label">DOWNLOADS</span>
                        <span className="hero-meta-val">{popularity.toLocaleString('en-US')}+</span>
                    </div>
                    <div className="hero-meta-row">
                        <span className="hero-meta-label">UPDATED</span>
                        <span className="hero-meta-val">{formatRelativeTime(updatedAt)}</span>
                    </div>
                </div>
            </div>

            {/* Dots */}
            <div className="hero-dots">
                {mods.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`hero-dot ${i === current ? 'active' : ''}`}
                        onClick={() => { setCurrent(i); setProgress(0); }}
                        aria-label={`Show ${mods[i].title}`}
                        aria-current={i === current ? 'true' : undefined}
                    />
                ))}
            </div>

            {/* Arrows */}
            <button type="button" className="hero-arrow hero-arrow-prev" onClick={prev} aria-label="Previous mod">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
            </button>
            <button type="button" className="hero-arrow hero-arrow-next" onClick={next} aria-label="Next mod">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
            </button>

            {/* Progress bar */}
            <div className="hero-progress" style={{ transform: `scaleX(${progress / 100})` }} />
        </section>
    );
}
