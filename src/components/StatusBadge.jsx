import './StatusBadge.css';

export default function StatusBadge({ status }) {
    const normalized = String(status || '').toUpperCase();
    const variantByStatus = {
        ACTIVE: 'success',
        APPROVED: 'success',
        BLOCKED: 'danger',
        PENDING: 'warning',
        DRAFT: 'muted',
        INACTIVE: 'muted',
    };
    const variant = variantByStatus[normalized] || 'default';
    const label = normalized || 'UNKNOWN';

    return (
        <span className="status-badge" data-variant={variant}>
            {label}
        </span>
    );
}
