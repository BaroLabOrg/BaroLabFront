const API_BASE = 'http://localhost:8080';

export class ApiRequestError extends Error {
    constructor({ message, status, code }) {
        super(message);
        this.name = 'ApiRequestError';
        this.status = status;
        this.code = code;
    }
}

function getToken() {
    return localStorage.getItem('barolab_token');
}

function buildUrl(path, query) {
    if (!query) return `${API_BASE}${path}`;

    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        searchParams.set(key, String(value));
    });

    const queryString = searchParams.toString();
    return queryString ? `${API_BASE}${path}?${queryString}` : `${API_BASE}${path}`;
}

async function readJsonSafely(response) {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function buildRequestBody(body, headers) {
    if (body === undefined || body === null) return undefined;

    if (typeof body === 'string' || body instanceof FormData || body instanceof Blob) {
        return body;
    }

    if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    return JSON.stringify(body);
}

export async function request(path, options = {}) {
    const token = getToken();
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(buildUrl(path, options.query), {
        method: options.method || 'GET',
        headers,
        body: buildRequestBody(options.body, headers),
    });

    const responseBody = await readJsonSafely(response);
    if (!response.ok) {
        throw new ApiRequestError({
            message: responseBody?.message || `Error ${response.status}`,
            status: response.status,
            code: responseBody?.code,
        });
    }

    if (response.status === 204) return null;
    return responseBody;
}

export function normalizePagedResponse(response) {
    if (!response || typeof response !== 'object') {
        return {
            items: [],
            total: 0,
            page: 0,
            size: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
        };
    }

    const totalPagesRaw = response.total_pages ?? response.totalPages ?? 0;
    const hasNextRaw = response.has_next ?? response.hasNext ?? false;
    const hasPreviousRaw = response.has_previous ?? response.hasPrevious ?? false;

    return {
        ...response,
        items: Array.isArray(response.items) ? response.items : [],
        total: Number.isFinite(Number(response.total)) ? Number(response.total) : 0,
        page: Number.isFinite(Number(response.page)) ? Number(response.page) : 0,
        size: Number.isFinite(Number(response.size)) ? Number(response.size) : 0,
        total_pages: Number.isFinite(Number(totalPagesRaw)) ? Number(totalPagesRaw) : 0,
        has_next: Boolean(hasNextRaw),
        has_previous: Boolean(hasPreviousRaw),
    };
}

export function mapPaginationError(error, fallbackMessage = 'Не удалось загрузить данные') {
    if (error?.status === 400) {
        const details = error?.message || 'Некорректные параметры пагинации';
        return `Ошибка пагинации: ${details}`;
    }
    return error?.message || fallbackMessage;
}

// Auth
export async function login(login, password) {
    return request('/login', {
        method: 'POST',
        body: { login, password },
    });
}

export async function signUp(login, email, username, password) {
    return request('/sign-up', {
        method: 'POST',
        body: { login, email, username, password },
    });
}

export async function googleLogin(idToken) {
    return request('/api/v1/auth/google', {
        method: 'POST',
        body: { id_token: idToken },
    });
}

// Users
export async function getUsers({
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    direction = 'desc',
} = {}) {
    const response = await request('/users', {
        query: { page, size, sortBy, direction },
    });
    return normalizePagedResponse(response);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role),
    });
}

// Comments
export async function getComments(
    modId,
    {
        page = 0,
        size = 20,
        sortBy = 'createdAt',
        direction = 'desc',
    } = {},
) {
    const response = await request(`/mod/${modId}/comment`, {
        query: { page, size, sortBy, direction },
    });
    return normalizePagedResponse(response);
}

export async function getCommentById(modId, commentId) {
    return request(`/mod/${modId}/comment/${commentId}`);
}

export async function createComment(modId, body) {
    return request(`/mod/${modId}/comment`, {
        method: 'POST',
        body: { body },
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

export async function getModById(externalId) {
    return request(`/mod/${externalId}`);
}

export async function activateMod(externalId) {
    return request(`/mod/${externalId}/activate`, { method: 'PUT' });
}

export async function blockMod(externalId) {
    return request(`/mod/${externalId}/block`, { method: 'PUT' });
}


