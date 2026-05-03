import { normalizePagedResponse, request } from './api';

export async function getModGuides(
    modId,
    {
        page = 0,
        size = 20,
        sortBy = 'createdAt',
        direction = 'desc',
    } = {},
) {
    const response = await request(`/mod/${modId}/guide`, {
        query: { page, size, sortBy, direction },
    });
    return normalizePagedResponse(response);
}

export async function getModGuideById(modId, guideId) {
    return request(`/mod/${modId}/guide/${guideId}`);
}

export async function createModGuide(modId, title, description) {
    return request(`/mod/${modId}/guide`, {
        method: 'POST',
        body: { title, description },
    });
}

export async function updateModGuide(modId, guideId, title, description) {
    return request(`/mod/${modId}/guide/${guideId}`, {
        method: 'PUT',
        body: { title, description },
    });
}

export async function deleteModGuide(modId, guideId) {
    return request(`/mod/${modId}/guide/${guideId}`, {
        method: 'DELETE',
    });
}

export async function getAllGuides({
    q,
    status,
    author,
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    direction = 'desc',
} = {}) {
    const response = await request('/guides', {
        query: { q, status, author, page, size, sortBy, direction },
    });
    return normalizePagedResponse(response);
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
