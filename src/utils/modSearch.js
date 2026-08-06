export const DEFAULT_MOD_SORT_BY = 'popularity';
export const DEFAULT_MOD_SORT_DIRECTION = 'desc';

export const MOD_SORT_OPTIONS = [
    { value: 'popularity:desc', sortBy: 'popularity', direction: 'desc', label: 'Most subscribed' },
    { value: 'popularity:asc', sortBy: 'popularity', direction: 'asc', label: 'Least subscribed' },
    { value: 'createdAt:desc', sortBy: 'createdAt', direction: 'desc', label: 'Newest on Steam' },
    { value: 'createdAt:asc', sortBy: 'createdAt', direction: 'asc', label: 'Oldest on Steam' },
];

export function normalizeModSort(sortBy, direction) {
    return MOD_SORT_OPTIONS.find((option) => option.sortBy === sortBy && option.direction === direction)
        || MOD_SORT_OPTIONS[0];
}
