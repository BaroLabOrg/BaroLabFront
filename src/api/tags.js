import { normalizePagedResponse, request } from './api';

export async function getTags({
    page = 0,
    size = 20,
    sortBy = 'name',
    direction = 'asc',
} = {}) {
    const response = await request('/api/tags', {
        query: { page, size, sortBy, direction },
    });
    return normalizePagedResponse(response);
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
