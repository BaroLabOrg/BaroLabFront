import { request } from './api';

export function startSteamAvailabilityCheck() {
    return request('/api/admin/steam-availability/start', { method: 'POST' });
}

export function stopSteamAvailabilityCheck() {
    return request('/api/admin/steam-availability/stop', { method: 'POST' });
}

export function getSteamAvailabilityStatus() {
    return request('/api/admin/steam-availability/status');
}

export function getSteamAvailabilityHistory() {
    return request('/api/admin/steam-availability/history');
}
