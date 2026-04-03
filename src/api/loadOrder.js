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

function mapErrorMessage(errorBody, status, fallbackText) {
    if (typeof fallbackText === 'string' && fallbackText.trim().length > 0) {
        return fallbackText.trim();
    }

    if (!errorBody || typeof errorBody !== 'object') {
        return `Error ${status}`;
    }

    if (typeof errorBody.message === 'string' && errorBody.message.trim().length > 0) {
        return errorBody.message;
    }

    if (typeof errorBody.error === 'string' && errorBody.error.trim().length > 0) {
        return errorBody.error;
    }

    if (Array.isArray(errorBody.errors) && errorBody.errors.length > 0) {
        const firstError = errorBody.errors.find((item) => typeof item === 'string' && item.trim().length > 0);
        if (firstError) {
            return firstError;
        }
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
        const fallbackMessage = errorBody ? '' : responseText;
        throw new ApiRequestError({
            message: mapErrorMessage(errorBody, response.status, fallbackMessage),
            status: response.status,
            code: errorBody?.code,
        });
    }

    return responseText;
}
