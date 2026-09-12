import { Link } from 'react-router-dom';
import TagChips from './TagChips';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
import ContentGlyph from './ContentGlyph';
import ImageWithFallback from './ImageWithFallback';
import './SubmarineCard.css';

function formatNumber(value, fractionDigits = 0) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '—';
    }
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}

function isKnown(value) {
    return value !== undefined && value !== null && !Number.isNaN(Number(value));
}

function formatCrew(submarine) {
    if (submarine.recommendedCrewDisplay) return submarine.recommendedCrewDisplay;
    const { recommendedCrewMin: min, recommendedCrewMax: max } = submarine;
    if (!isKnown(min) || !isKnown(max)) return null;
    return `${min} - ${max}`;
}

/**
 * One stat cell, and only if there's a value for it.
 *
 * Blank is more honest than a dash-with-unit here: until someone has read
 * the sub's file, it's not that the price is unknown — everything is.
 */
function stat(label, value, unit, glyph) {
    if (value === null || value === undefined) return null;
    const shown = typeof value === 'number' ? formatNumber(value) : value;
    return (
        <span key={label} className="submarine-card-stat">
            <ContentGlyph name={glyph} className="submarine-card-stat-icon" size={15} />
            <span className="submarine-card-stat-text">
                <small>{label}</small>
                <strong>{unit ? `${shown} ${unit}` : shown}</strong>
            </span>
        </span>
    );
}

function subtitle(submarine) {
    const parts = [];
    if (submarine.submarineClass) parts.push(submarine.submarineClass);
    if (isKnown(submarine.tier)) parts.push(`Tier ${submarine.tier}`);
    return parts.join(' · ');
}

function SubmarineCardStats({ submarine }) {
    const stats = [
        stat('Price', submarine.price, 'mk', 'price'),
        stat('Crew', formatCrew(submarine), '', 'crew'),
        stat('Cargo', submarine.cargoCapacity, '', 'cargo'),
        // Thrust, not speed: speed is computed by the game's physics, it
        // doesn't come from the sub file itself.
        stat('Thrust', submarine.engineForce, '', 'thrust'),
        stat('Turrets', submarine.turretSlotCount, '', 'weapon'),
        stat('Build', submarine.fabricationType, '', 'build'),
    ].filter(Boolean);

    if (stats.length === 0) {
        return <p className="submarine-card-metrics-empty">Stats not read yet</p>;
    }
    return <div className="submarine-card-metrics">{stats}</div>;
}

export default function SubmarineCard({ submarine, onSelect, actionLabel = 'Read more' }) {
    const externalId = submarine.externalId ?? submarine.external_id;
    const mainImage = submarine.main_image || submarine.mainImage;
    const previewAlt = submarine.title ? `${submarine.title} preview` : 'Submarine preview';
    const descriptionExcerpt = steamBbcodeToExcerpt(submarine.description, 140);

    const content = (
        <>
            {/* "Open this" affordance — same bottom-right placement as every other
                homepage card (see .home-mod-card-go / .home-cat-go). */}
            <span className="submarine-card-go" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
            </span>
            <div className="submarine-card-preview">
                <ImageWithFallback
                    className="submarine-card-preview-image"
                    src={mainImage}
                    alt={previewAlt}
                    fallbackLabel="Preview unavailable"
                    referrerPolicy="no-referrer"
                />
            </div>

            <div className="submarine-card-head">
                <div>
                    <h3 className="submarine-card-title">{submarine.title}</h3>
                    {subtitle(submarine) && (
                        <p className="submarine-card-subtitle">{subtitle(submarine)}</p>
                    )}
                </div>
            </div>

            <p className="submarine-card-description">
                {descriptionExcerpt || 'No description'}
            </p>

            <SubmarineCardStats submarine={submarine} />

            <div className="submarine-card-tags">
                <TagChips tags={Array.isArray(submarine.tags) ? submarine.tags : []} />
            </div>

            <div className="submarine-card-footer">{actionLabel}</div>
        </>
    );

    if (onSelect) {
        return (
            <button
                type="button"
                className="submarine-card glass-card"
                aria-label={`Write guide about ${submarine.title}`}
                onClick={() => onSelect(submarine)}
            >
                {content}
            </button>
        );
    }
    return <Link to={`/submarines/${externalId}`} className="submarine-card glass-card">{content}</Link>;
}

