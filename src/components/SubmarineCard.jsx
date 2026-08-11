import { Link } from 'react-router-dom';
import TagChips from './TagChips';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
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

function formatCrew(submarine) {
    if (submarine.recommendedCrewDisplay) return submarine.recommendedCrewDisplay;
    if (submarine.recommendedCrewMin === undefined || submarine.recommendedCrewMax === undefined) return '—';
    return `${submarine.recommendedCrewMin} - ${submarine.recommendedCrewMax}`;
}

export default function SubmarineCard({ submarine, onSelect, actionLabel = 'Read more →' }) {
    const externalId = submarine.externalId ?? submarine.external_id;
    const mainImage = submarine.main_image || submarine.mainImage;
    const previewAlt = submarine.title ? `${submarine.title} preview` : 'Submarine preview';
    const descriptionExcerpt = steamBbcodeToExcerpt(submarine.description, 140);

    const content = (
        <>
            {mainImage ? (
                <div className="submarine-card-preview">
                    <img
                        className="submarine-card-preview-image"
                        src={mainImage}
                        alt={previewAlt}
                        loading="lazy"
                    />
                </div>
            ) : (
                <div className="submarine-card-preview submarine-card-preview-empty" aria-hidden="true">
                    <svg viewBox="0 0 42 26" focusable="false">
                        <path d="M5 13c4-7 11-9 25-9 6 0 9 3 11 9-2 6-5 9-11 9-14 0-21-2-25-9Z" />
                        <path d="M17 4V1h8v3M7 13H1M31 8l6-4M31 18l6 4" />
                    </svg>
                </div>
            )}

            <div className="submarine-card-head">
                <div>
                    <h3 className="submarine-card-title">{submarine.title}</h3>
                    <p className="submarine-card-subtitle">
                        {submarine.submarineClass || '—'} · Tier {submarine.tier ?? '—'}
                    </p>
                </div>
            </div>

            <p className="submarine-card-description">
                {descriptionExcerpt || 'No description'}
            </p>

            <div className="submarine-card-metrics">
                <span><small>Price</small><strong>{formatNumber(submarine.price)} mk</strong></span>
                <span><small>Crew</small><strong>{formatCrew(submarine)}</strong></span>
                <span><small>Cargo</small><strong>{formatNumber(submarine.cargoCapacity)}</strong></span>
                <span><small>Speed</small><strong>{formatNumber(submarine.maxHorizontalSpeedKph, 1)} km/h</strong></span>
                <span><small>Turrets</small><strong>{formatNumber(submarine.turretSlotCount)}</strong></span>
                <span><small>Build</small><strong>{submarine.fabricationType || '—'}</strong></span>
            </div>

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

