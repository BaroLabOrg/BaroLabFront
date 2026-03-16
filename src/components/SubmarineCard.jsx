import { Link } from 'react-router-dom';
import TagChips from './TagChips';
import './SubmarineCard.css';

function formatNumber(value, fractionDigits = 0) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return '—';
    }
    return Number(value).toLocaleString('ru-RU', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}

function formatCrew(submarine) {
    if (submarine.recommendedCrewDisplay) return submarine.recommendedCrewDisplay;
    if (submarine.recommendedCrewMin === undefined || submarine.recommendedCrewMax === undefined) return '—';
    return `${submarine.recommendedCrewMin} - ${submarine.recommendedCrewMax}`;
}

function getStatusLabel(submarine) {
    if (submarine.blocked === true) return 'BLOCKED';
    if (submarine.active === true) return 'ACTIVE';
    return '';
}

export default function SubmarineCard({ submarine }) {
    const externalId = submarine.externalId ?? submarine.external_id;
    const statusLabel = getStatusLabel(submarine);

    return (
        <Link to={`/submarines/${externalId}`} className="submarine-card glass-card">
            <div className="submarine-card-head">
                <div>
                    <h3 className="submarine-card-title">{submarine.title}</h3>
                    <p className="submarine-card-subtitle">
                        {submarine.submarineClass || '—'} · Tier {submarine.tier ?? '—'}
                    </p>
                </div>
                {statusLabel && (
                    <span className={`submarine-card-status ${statusLabel === 'BLOCKED' ? 'blocked' : 'active'}`}>
                        {statusLabel}
                    </span>
                )}
            </div>

            <p className="submarine-card-description">
                {submarine.description?.length > 140
                    ? `${submarine.description.slice(0, 140)}…`
                    : submarine.description || 'Нет описания'}
            </p>

            <div className="submarine-card-metrics">
                <span>💰 {formatNumber(submarine.price)} mk</span>
                <span>👥 {formatCrew(submarine)}</span>
                <span>📦 {formatNumber(submarine.cargoCapacity)}</span>
                <span>↔ {formatNumber(submarine.maxHorizontalSpeedKph, 1)} км/ч</span>
                <span>🔫 {formatNumber(submarine.turretSlotCount)}</span>
                <span>🛠 {submarine.fabricationType || '—'}</span>
            </div>

            <div className="submarine-card-tags">
                <TagChips tags={Array.isArray(submarine.tags) ? submarine.tags : []} />
            </div>

            <div className="submarine-card-footer">Подробнее →</div>
        </Link>
    );
}
