import { useEffect, useEffectEvent, useState } from 'react';
import { getSteamSyncStatus, resetSteamSync, startSteamSync, stopSteamSync } from '../api/steamSync';

const POLL_INTERVAL_MS = 3000;

const DEFAULT_STATUS = {
    status: 'IDLE',
    current_cursor: '*',
    total_processed: 0,
    new_added: 0,
    updated_count: 0,
    errors: [],
};

function normalizeStatus(raw) {
    if (!raw || typeof raw !== 'object') {
        return DEFAULT_STATUS;
    }

    return {
        status: raw.status || 'IDLE',
        current_cursor: raw.current_cursor ?? raw.currentCursor ?? '*',
        total_processed: Number(raw.total_processed ?? raw.totalProcessed ?? 0) || 0,
        new_added: Number(raw.new_added ?? raw.newAdded ?? 0) || 0,
        updated_count: Number(raw.updated_count ?? raw.updatedCount ?? 0) || 0,
        errors: Array.isArray(raw.errors) ? raw.errors : [],
    };
}

function toErrorMessage(error) {
    if (error?.message) {
        return error.message;
    }
    return 'Failed to run Steam Workshop sync request';
}

export default function SteamSyncTab() {
    const [syncStatus, setSyncStatus] = useState(DEFAULT_STATUS);
    const [initialLoading, setInitialLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [error, setError] = useState('');

    const loadStatus = useEffectEvent(async ({ silent = false } = {}) => {
        if (!silent) {
            setInitialLoading(true);
        }
        try {
            const data = await getSteamSyncStatus();
            setSyncStatus(normalizeStatus(data));
            if (!silent) {
                setError('');
            }
        } catch (requestError) {
            setError(toErrorMessage(requestError));
        } finally {
            if (!silent) {
                setInitialLoading(false);
            }
        }
    });

    useEffect(() => {
        void loadStatus();
    }, []);

    useEffect(() => {
        const status = syncStatus.status;
        if (status !== 'RUNNING' && status !== 'STOPPING') {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            void loadStatus({ silent: true });
        }, POLL_INTERVAL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [syncStatus.status]);

    const runAction = async (actionName, actionFn) => {
        setActionLoading(actionName);
        setError('');
        try {
            const data = await actionFn();
            setSyncStatus(normalizeStatus(data));
        } catch (requestError) {
            setError(toErrorMessage(requestError));
        } finally {
            setActionLoading('');
        }
    };

    const status = syncStatus.status;
    const isIdle = status === 'IDLE';
    const isRunning = status === 'RUNNING';
    const isStopping = status === 'STOPPING';
    const controlsLocked = Boolean(actionLoading);

    return (
        <div className="admin-tab-content steam-sync-tab">
            <div className="steam-sync-controls">
                <button
                    className="btn btn-primary"
                    onClick={() => runAction('start', startSteamSync)}
                    disabled={controlsLocked || isRunning || isStopping}
                >
                    Start / Resume
                </button>
                <button
                    className="btn btn-danger"
                    onClick={() => runAction('stop', stopSteamSync)}
                    disabled={controlsLocked}
                >
                    Graceful Stop
                </button>
                <button
                    className="btn btn-ghost"
                    onClick={() => runAction('reset', resetSteamSync)}
                    disabled={controlsLocked || !isIdle}
                >
                    Reset Progress
                </button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="steam-sync-meta glass-card">
                <span className={`steam-sync-status status-${status.toLowerCase()}`}>{status}</span>
                <span className="steam-sync-cursor">cursor: {syncStatus.current_cursor}</span>
            </div>

            <div className="steam-sync-stats-grid">
                <article className="glass-card steam-sync-stat-card">
                    <p>Total Processed</p>
                    <strong>{syncStatus.total_processed.toLocaleString('en-US')}</strong>
                </article>
                <article className="glass-card steam-sync-stat-card">
                    <p>New Added</p>
                    <strong>{syncStatus.new_added.toLocaleString('en-US')}</strong>
                </article>
                <article className="glass-card steam-sync-stat-card">
                    <p>Updated</p>
                    <strong>{syncStatus.updated_count.toLocaleString('en-US')}</strong>
                </article>
            </div>

            <section className="steam-sync-terminal-wrap">
                <h3 className="steam-sync-terminal-title">Parser Errors (last 50)</h3>
                <div className="steam-sync-terminal">
                    {initialLoading ? (
                        <p>[loading] Fetching steam sync status...</p>
                    ) : syncStatus.errors.length === 0 ? (
                        <p>[ok] No parser errors</p>
                    ) : (
                        syncStatus.errors.map((line, index) => (
                            <p key={`${index}-${line}`}>{line}</p>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

