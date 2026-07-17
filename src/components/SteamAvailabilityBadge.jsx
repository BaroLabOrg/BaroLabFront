import './SteamAvailabilityBadge.css';

function formatCheckedAt(value) {
    if (!value) return 'Never checked';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown check time' : `Last checked: ${date.toLocaleString('en-US')}`;
}

export default function SteamAvailabilityBadge({ managed, status, lastCheckedAt, failureCount = 0 }) {
    const normalizedStatus = managed === false
        ? 'NOT_TRACKED'
        : String(status || 'UNKNOWN').toUpperCase();
    const title = managed === false
        ? 'This content is not checked through Steam'
        : `${formatCheckedAt(lastCheckedAt)}; consecutive failures: ${Number(failureCount) || 0}`;

    return (
        <span className="steam-availability-badge" data-status={normalizedStatus} title={title}>
            Steam: {normalizedStatus.replace('_', ' ')}
        </span>
    );
}
