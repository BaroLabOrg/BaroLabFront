const API_BASE = 'http://localhost:8080';

class ApiRequestError extends Error {
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

async function readJsonSafely(response) {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function buildUrl(path, query) {
    if (!query) {
        return `${API_BASE}${path}`;
    }

    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        searchParams.set(key, String(value));
    });

    const queryString = searchParams.toString();
    return queryString ? `${API_BASE}${path}?${queryString}` : `${API_BASE}${path}`;
}

async function request(path, options = {}) {
    const token = getToken();
    const response = await fetch(buildUrl(path, options.query), {
        method: options.method || 'GET',
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
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

export async function getTags({ sortBy, direction } = {}) {
    return request('/api/tags', {
        query: { sortBy, direction },
    });
}

export async function getTagById(tagId) {
    return request(`/api/tags/${tagId}`);
}

export async function createTag(name) {
    return request('/api/tags', {
        method: 'POST',
        body: { name },
    });
}
