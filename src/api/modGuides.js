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

export async function getGuideById(guideId) {
    return request(`/guides/${guideId}`);
}

export async function createGuide({ targetType, targetId, title, description }) {
    return request('/guides', {
        method: 'POST',
        body: {
            target_type: targetType,
            target_id: String(targetId),
            title,
            description,
        },
    });
}

export async function updateGuide(guideId, title, description) {
    return request(`/guides/${guideId}`, {
        method: 'PUT',
        body: { title, description },
    });
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
    targetType,
    targetId,
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    direction = 'desc',
} = {}) {
    const response = await request('/guides', {
        query: { q, status, author, targetType, targetId, page, size, sortBy, direction },
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
