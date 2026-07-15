import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    getSteamAvailabilityHistory,
    getSteamAvailabilityStatus,
    startSteamAvailabilityCheck,
    stopSteamAvailabilityCheck,
} from '../api/steamAvailability';

const POLL_INTERVAL_MS = 3000;

const DEFAULT_STATUS = {
    status: 'IDLE',
    run_id: null,
    trigger_type: null,
    total_records: 0,
    processed_records: 0,
    available_count: 0,
    unavailable_count: 0,
    recovered_count: 0,
    error_count: 0,
    started_at: null,
    completed_at: null,
    last_error: null,
};

function normalizeStatus(raw) {
    if (!raw || typeof raw !== 'object') return DEFAULT_STATUS;
    return {
        status: raw.status || 'IDLE',
        run_id: raw.run_id ?? raw.runId ?? null,
        trigger_type: raw.trigger_type ?? raw.triggerType ?? null,
        total_records: Number(raw.total_records ?? raw.totalRecords ?? 0) || 0,
        processed_records: Number(raw.processed_records ?? raw.processedRecords ?? 0) || 0,
        available_count: Number(raw.available_count ?? raw.availableCount ?? 0) || 0,
        unavailable_count: Number(raw.unavailable_count ?? raw.unavailableCount ?? 0) || 0,
        recovered_count: Number(raw.recovered_count ?? raw.recoveredCount ?? 0) || 0,
        error_count: Number(raw.error_count ?? raw.errorCount ?? 0) || 0,
        started_at: raw.started_at ?? raw.startedAt ?? null,
        completed_at: raw.completed_at ?? raw.completedAt ?? null,
        last_error: raw.last_error ?? raw.lastError ?? null,
    };
}

function normalizeHistory(raw) {
    return {
        since: raw?.since ?? null,
        runs: Array.isArray(raw?.runs) ? raw.runs.map(normalizeStatus) : [],
        events: Array.isArray(raw?.events) ? raw.events : [],
    };
}

function errorMessage(error) {
    return error?.message || 'Failed to run Steam availability request';
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-US');
}

export default function SteamAvailabilityTab() {
    const [status, setStatus] = useState(DEFAULT_STATUS);
    const [history, setHistory] = useState({ since: null, runs: [], events: [] });
    const [initialLoading, setInitialLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [error, setError] = useState('');

    const loadHistory = useCallback(async () => {
        const data = await getSteamAvailabilityHistory();
        setHistory(normalizeHistory(data));
    }, []);

    const loadStatus = useCallback(async ({ silent = false, refreshHistory = false } = {}) => {
        try {
            const data = await getSteamAvailabilityStatus();
            const next = normalizeStatus(data);
            setStatus(next);
            if (refreshHistory || !['RUNNING', 'STOPPING'].includes(next.status)) {
                await loadHistory();
            }
            if (!silent) setError('');
        } catch (requestError) {
            setError(errorMessage(requestError));
        } finally {
            if (!silent) setInitialLoading(false);
        }
    }, [loadHistory]);

    useEffect(() => {
        void loadStatus({ refreshHistory: true });
    }, [loadStatus]);

    useEffect(() => {
        if (!['RUNNING', 'STOPPING'].includes(status.status)) return undefined;
        const intervalId = window.setInterval(() => void loadStatus({ silent: true }), POLL_INTERVAL_MS);
        return () => window.clearInterval(intervalId);
    }, [loadStatus, status.status]);

    const runAction = async (name, action) => {
        setActionLoading(name);
        setError('');
        try {
            setStatus(normalizeStatus(await action()));
            await loadHistory();
        } catch (requestError) {
            setError(errorMessage(requestError));
        } finally {
            setActionLoading('');
        }
    };

    const progress = useMemo(() => {
        if (status.total_records === 0) return 0;
        return Math.min(100, Math.round((status.processed_records / status.total_records) * 100));
    }, [status.processed_records, status.total_records]);

    const running = status.status === 'RUNNING' || status.status === 'STOPPING';

    return (
        <div className="admin-tab-content steam-sync-tab steam-availability-tab">
            <div className="steam-sync-controls">
                <button
                    className="btn btn-primary"
                    disabled={Boolean(actionLoading) || running}
                    onClick={() => runAction('start', startSteamAvailabilityCheck)}
                >
                    Start Availability Check
                </button>
                <button
                    className="btn btn-danger"
                    disabled={Boolean(actionLoading) || !running}
                    onClick={() => runAction('stop', stopSteamAvailabilityCheck)}
                >
                    Graceful Stop
                </button>
                <button
                    className="btn btn-ghost"
                    disabled={Boolean(actionLoading)}
                    onClick={() => loadStatus({ refreshHistory: true })}
                >
                    Refresh
                </button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="steam-sync-meta glass-card">
                <span className={`steam-sync-status status-${status.status.toLowerCase()}`}>{status.status}</span>
                <span className="steam-sync-cursor">
                    {status.trigger_type || 'NO RUN'} · started {formatDate(status.started_at)}
                </span>
            </div>

            <div className="steam-availability-progress glass-card">
                <div className="steam-availability-progress-label">
                    <span>Progress</span>
                    <strong>{status.processed_records.toLocaleString('en-US')} / {status.total_records.toLocaleString('en-US')} ({progress}%)</strong>
                </div>
                <div className="steam-availability-progress-track" aria-label="Availability check progress">
                    <span style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="steam-sync-stats-grid steam-availability-stats-grid">
                {[
                    ['Available', status.available_count],
                    ['Unavailable Responses', status.unavailable_count],
                    ['Recovered', status.recovered_count],
                    ['Errors', status.error_count],
                ].map(([label, value]) => (
                    <article key={label} className="glass-card steam-sync-stat-card">
                        <p>{label}</p>
                        <strong>{value.toLocaleString('en-US')}</strong>
                    </article>
                ))}
            </div>

            {status.last_error && <div className="auth-error">Last error: {status.last_error}</div>}

            <section className="steam-availability-history">
                <h3 className="steam-sync-terminal-title">Run History (last 7 days)</h3>
                <div className="steam-availability-table-wrap glass-card">
                    <table className="steam-availability-table">
                        <thead>
                            <tr><th>Started</th><th>Status</th><th>Trigger</th><th>Processed</th><th>Results</th><th>Errors</th></tr>
                        </thead>
                        <tbody>
                            {history.runs.map((run) => (
                                <tr key={run.run_id || run.started_at}>
                                    <td>{formatDate(run.started_at)}</td>
                                    <td>{run.status}</td>
                                    <td>{run.trigger_type || '—'}</td>
                                    <td>{run.processed_records} / {run.total_records}</td>
                                    <td>{run.unavailable_count} unavailable, {run.recovered_count} recovered</td>
                                    <td>{run.error_count}</td>
                                </tr>
                            ))}
                            {!initialLoading && history.runs.length === 0 && (
                                <tr><td colSpan="6">No availability runs during the last 7 days.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="steam-sync-terminal-wrap">
                <h3 className="steam-sync-terminal-title">Availability Changes (last 7 days)</h3>
                <div className="steam-sync-terminal">
                    {initialLoading ? (
                        <p>[loading] Fetching availability history...</p>
                    ) : history.events.length === 0 ? (
                        <p>[ok] No availability state changes</p>
                    ) : history.events.map((event) => (
                        <p key={event.id}>
                            [{formatDate(event.checked_at ?? event.checkedAt)}] [{event.content_type ?? event.contentType}] #{event.external_id ?? event.externalId}
                            {' '}{event.title}: {event.previous_status ?? event.previousStatus} → {event.new_status ?? event.newStatus}
                            {event.message ? ` — ${event.message}` : ''}
                        </p>
                    ))}
                </div>
            </section>
        </div>
    );
}
