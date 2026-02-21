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

// ═══════════ Posts ═══════════
export async function getPosts() {
    return request('/posts');
}

export async function createPost(title, content) {
    return request('/posts', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
    });
}

export async function getPostById(postId) {
    return request(`/post/${postId}`);
}

export async function activatePost(postId) {
    return request(`/post/${postId}/activate`, { method: 'PUT' });
}

export async function blockPost(postId) {
    return request(`/post/${postId}/block`, { method: 'PUT' });
}

// ═══════════ Comments ═══════════
export async function getComments(postId) {
    return request(`/post/${postId}/comment`);
}

export async function getCommentById(postId, commentId) {
    return request(`/post/${postId}/comment/${commentId}`);
}

export async function createComment(postId, body) {
    return request(`/post/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ body }),
    });
}

export async function activateComment(postId, commentId) {
    return request(`/post/${postId}/comment/${commentId}/activate`, {
        method: 'PUT',
    });
}

export async function blockComment(postId, commentId) {
    return request(`/post/${postId}/comment/${commentId}/block`, {
        method: 'PUT',
    });
}
