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
        const error = new Error(errorMsg);
        error.status = res.status;
        throw error;
    }

    if (res.status === 204) return null;

    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// ═══════════ Auth ═══════════
export async function login(login, password) {
    return request('/login', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
    });
}

export async function signUp(login, email, username, password) {
    return request('/sign-up', {
        method: 'POST',
        body: JSON.stringify({ login, email, username, password }),
    });
}

export async function googleLogin(idToken) {
    return request('/api/v1/auth/google', {
        method: 'POST',
        body: JSON.stringify({ id_token: idToken }),
    });
}

// ═══════════ Users ═══════════
export async function getUsers() {
    return request('/users');
}

export async function getUserById(userId) {
    return request(`/user/${userId}`);
}

export async function activateUser(userId) {
    return request(`/user/${userId}/activate`, { method: 'PUT' });
}

export async function blockUser(userId) {
    return request(`/user/${userId}/block`, { method: 'PUT' });
}

export async function updateUserRole(userId, role) {
    return request(`/user/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify(role),
    });
}

// ═══════════ Comments ═══════════
export async function getComments(modId) {
    return request(`/mod/${modId}/comment`);
}

export async function getCommentById(modId, commentId) {
    return request(`/mod/${modId}/comment/${commentId}`);
}

export async function createComment(modId, body) {
    return request(`/mod/${modId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ body }),
    });
}

export async function activateComment(modId, commentId) {
    return request(`/mod/${modId}/comment/${commentId}/activate`, {
        method: 'PUT',
    });
}

export async function blockComment(modId, commentId) {
    return request(`/mod/${modId}/comment/${commentId}/block`, {
        method: 'PUT',
    });
}

// ═══════════ Mods ═══════════
export async function getMods() {
    return request('/mods');
}

export async function getModById(externalId) {
    return request(`/mod/${externalId}`);
}

export async function activateMod(externalId) {
    return request(`/mod/${externalId}/activate`, { method: 'PUT' });
}

export async function blockMod(externalId) {
    return request(`/mod/${externalId}/block`, { method: 'PUT' });
}


