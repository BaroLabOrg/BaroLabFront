import { API_BASE, ApiRequestError } from './api';

function buildApiUrl(path) {
    if (!API_BASE) {
        throw new Error('VITE_API_BASE_URL is not configured');
    }
    return `${API_BASE}${path}`;
}

function getAuthHeader() {
    const token = localStorage.getItem('barolab_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function tryParseJson(text) {
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function normalizeString(value) {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim();
}

function normalizeErrorDetails(errorBody) {
    if (!errorBody || typeof errorBody !== 'object') {
        return [];
    }

    if (Array.isArray(errorBody.details)) {
        return errorBody.details
            .filter((detail) => detail && typeof detail === 'object')
            .map((detail) => ({
                code: normalizeString(detail.code),
                modId: normalizeString(detail.modId),
                dependencyId: normalizeString(detail.dependencyId),
                message: normalizeString(detail.message),
            }))
            .filter((detail) => detail.code || detail.modId || detail.dependencyId || detail.message);
    }

    if (Array.isArray(errorBody.errors)) {
        return errorBody.errors
            .filter((item) => typeof item === 'string' && item.trim().length > 0)
            .map((message) => ({
                code: '',
                modId: '',
                dependencyId: '',
                message: message.trim(),
            }));
    }

    return [];
}

function resolveErrorMessage(errorBody, status, fallbackText) {
    const bodyMessage = normalizeString(errorBody?.message) || normalizeString(errorBody?.error);
    if (bodyMessage) {
        return bodyMessage;
    }

    const fallback = normalizeString(fallbackText);
    if (fallback) {
        return fallback;
    }

    return `Error ${status}`;
}

export async function convertLoadOrder(payload) {
    const response = await fetch(buildApiUrl('/api/load-order/convert'), {
        method: 'POST',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
            Accept: 'application/xml, application/json',
        },
        body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
        const errorBody = tryParseJson(responseText);
        const details = normalizeErrorDetails(errorBody);
        const error = new ApiRequestError({
            message: resolveErrorMessage(errorBody, response.status, responseText),
            status: response.status,
            code: normalizeString(errorBody?.code) || undefined,
        });
        error.details = details;
        throw error;
    }

    return responseText;
}
