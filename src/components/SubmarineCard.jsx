import { Link } from 'react-router-dom';
import TagChips from './TagChips';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
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
 * Одна цифра на карточке, и только если она есть.
 *
 * Пустое место здесь честнее прочерка с единицей: до тех пор, пока файл лодки
 * никто не прочитал, у неё неизвестна не цена, а всё сразу.
 */
function stat(label, value, unit = '') {
    if (value === null || value === undefined) return null;
    const shown = typeof value === 'number' ? formatNumber(value) : value;
    return (
        <span key={label}>
            <small>{label}</small>
            <strong>{unit ? `${shown} ${unit}` : shown}</strong>
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
        stat('Price', submarine.price, 'mk'),
        stat('Crew', formatCrew(submarine)),
        stat('Cargo', submarine.cargoCapacity),
        // Тяга, а не скорость: скорость считает физика игры, из файла лодки
        // она не следует
        stat('Thrust', submarine.engineForce),
        stat('Turrets', submarine.turretSlotCount),
        stat('Build', submarine.fabricationType),
    ].filter(Boolean);

    if (stats.length === 0) {
        return <p className="submarine-card-metrics-empty">Stats not read yet</p>;
    }
    return <div className="submarine-card-metrics">{stats}</div>;
}

export default function SubmarineCard({ submarine, onSelect, actionLabel = 'Read more →' }) {
    const externalId = submarine.externalId ?? submarine.external_id;
    const mainImage = submarine.main_image || submarine.mainImage;
    const previewAlt = submarine.title ? `${submarine.title} preview` : 'Submarine preview';
    const descriptionExcerpt = steamBbcodeToExcerpt(submarine.description, 140);

    const content = (
        <>
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

