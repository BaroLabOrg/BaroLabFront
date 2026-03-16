import { API_BASE, normalizePagedResponse, request } from './api';

function getToken() {
    return localStorage.getItem('barolab_token');
}

// Mods
export async function getMods({
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    direction = 'desc',
} = {}) {
    const response = await request('/mods', {
        query: { page, size, sortBy, direction },
    });
    return normalizePagedResponse(response);
}

export async function searchMods({
    q = '',
    tags = [],
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    direction = 'desc',
} = {}) {
    const normalizedTags = Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim()).filter(Boolean).join(',')
        : String(tags || '').trim();

    const response = await request('/search/mods', {
        query: {
            q: String(q || '').trim(),
            tags: normalizedTags,
            page,
            size,
            sortBy,
            direction,
        },
    });
    return normalizePagedResponse(response);
}

export async function getMod(externalId) {
    return request(`/mod/${externalId}`);
}

export async function getModComments(
    externalId,
    {
        page = 0,
        size = 20,
        sortBy = 'createdAt',
        direction = 'desc',
    } = {},
) {
    const response = await request(`/mod/${externalId}/comment`, {
        query: { page, size, sortBy, direction },
    });
    return normalizePagedResponse(response);
}

export async function createModComment(externalId, body) {
    return request(`/mod/${externalId}/comment`, {
        method: 'POST',
        body: { body },
    });
}

export async function createMod(title, description, external_url, main_image, additional_images, required_mods, mods_above) {
    return request('/mods', {
        method: 'POST',
        body: {
            title,
            description,
            external_url,
            main_image,
            additional_images,
            required_mods,
            mods_above,
        },
    });
}

/**
 * Subscribe (click-through) to a mod on Steam Workshop.
 * The server returns 302 redirect to Steam, we follow it manually.
 */
export async function subscribeMod(externalId) {
    const token = getToken();
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}/mod/${externalId}/transition`, {
        method: 'POST',
        headers,
        credentials: 'include',
        redirect: 'manual',
    });

    if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 0) {
        const location = res.headers.get('Location');
        if (location) {
            window.location.assign(location);
        } else {
            window.location.assign(`https://steamcommunity.com/sharedfiles/filedetails/?id=${externalId}`);
        }
        return;
    }

    if (res.status === 429) {
        throw new Error('Можно раз в час. Попробуйте позже.');
    }

    if (!res.ok) {
        let errorMsg = `Error ${res.status}`;
        try {
            const body = await res.json();
            errorMsg = body.message || errorMsg;
        } catch {
            // No-op: keep default status message.
        }
        throw new Error(errorMsg);
    }
}

export async function addTagToMod(externalId, tagId) {
    return request(`/mod/${externalId}/tags/${tagId}`, { method: 'POST' });
}

export async function removeTagFromMod(externalId, tagId) {
    return request(`/mod/${externalId}/tags/${tagId}`, { method: 'DELETE' });
}

// Admin
export async function activateMod(externalId) {
    return request(`/mod/${externalId}/activate`, { method: 'PUT' });
}

export async function blockMod(externalId) {
    return request(`/mod/${externalId}/block`, { method: 'PUT' });
}
