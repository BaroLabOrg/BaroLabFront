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

export async function getModGuides(modId) {
    return request(`/mod/${modId}/guide`);
}

export async function getModGuideById(modId, guideId) {
    return request(`/mod/${modId}/guide/${guideId}`);
}

export async function createModGuide(modId, title, content) {
    return request(`/mod/${modId}/guide`, {
        method: 'POST',
        body: JSON.stringify({ title, content }),
    });
}

export async function updateModGuide(modId, guideId, title, content) {
    return request(`/mod/${modId}/guide/${guideId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content }),
    });
}

export async function deleteModGuide(modId, guideId) {
    return request(`/mod/${modId}/guide/${guideId}`, {
        method: 'DELETE',
    });
}

export async function getAllGuides() {
    return request('/guides');
}

export async function activateGuide(guideId) {
    return request(`/guides/${guideId}/activate`, {
        method: 'PUT',
    });
}

export async function blockGuide(guideId) {
    return request(`/guides/${guideId}/block`, {
        method: 'PUT',
    });
}
