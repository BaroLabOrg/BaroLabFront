import './StatusBadge.css';

export default function StatusBadge({ status }) {
    const isActive = status === 'ACTIVE';
    return (
        <span className={`status-badge ${isActive ? 'status-active' : 'status-blocked'}`}>
            <span className="status-dot" />
            {isActive ? 'Active' : 'Blocked'}
        </span>
    );
}
