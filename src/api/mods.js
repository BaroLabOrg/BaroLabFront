const API_BASE = 'http://localhost:8080';

function getToken() {
    return localStorage.getItem('barolab_token');
}

async function request(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        let errorMsg = `Error ${res.status}`;
        try {
            const body = await res.json();
            errorMsg = body.message || errorMsg;
        } catch { }
        throw new Error(errorMsg);
    }

    if (res.status === 204) return null;

    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// ═══════════ Mods ═══════════

export async function getMods() {
    return request('/mods');
}

export async function getMod(externalId) {
    return request(`/mod/${externalId}`);
}

export async function getModComments(externalId) {
    return request(`/mod/${externalId}/comment`);
}

export async function createModComment(externalId, body) {
    return request(`/mod/${externalId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ body }),
    });
}

export async function createMod(title, description, external_url, main_image, additional_images, required_mods, mods_above) {
    return request('/mods', {
        method: 'POST',
        body: JSON.stringify({
            title,
            description,
            external_url,
            main_image,
            additional_images,
            required_mods,
            mods_above
        }),
    });
}

/**
 * Subscribe (click-through) to a mod on Steam Workshop.
 * The server returns 302 redirect to Steam — we follow it manually.
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

    // 302 redirect — browser won't follow it automatically with redirect:'manual'
    if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 0) {
        // With redirect:'manual', fetch returns opaqueredirect — headers are hidden.
        // Fallback: construct the Steam URL from the externalId.
        const location = res.headers.get('Location');
        if (location) {
            window.location.assign(location);
        } else {
            // Fallback to direct Steam URL
            window.location.assign(
                `https://steamcommunity.com/sharedfiles/filedetails/?id=${externalId}`
            );
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
        } catch { }
        throw new Error(errorMsg);
    }
}

// ═══════════ Admin ═══════════

export async function activateMod(externalId) {
    return request(`/mod/${externalId}/activate`, { method: 'PUT' });
}

export async function blockMod(externalId) {
    return request(`/mod/${externalId}/block`, { method: 'PUT' });
}
