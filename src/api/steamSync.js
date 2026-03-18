import { request } from './api';

export function startSteamSync() {
    return request('/api/admin/steam-sync/start', {
        method: 'POST',
    });
}

export function stopSteamSync() {
    return request('/api/admin/steam-sync/stop', {
        method: 'POST',
    });
}

export function resetSteamSync() {
    return request('/api/admin/steam-sync/reset', {
        method: 'POST',
    });
}

export function getSteamSyncStatus() {
    return request('/api/admin/steam-sync/status');
}

