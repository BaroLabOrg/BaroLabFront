import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ModsListPage from './ModsListPage';
import * as modsApi from '../api/mods';
import * as tagsApi from '../api/tags';

vi.mock('../api/mods', () => ({
    searchMods: vi.fn(),
    createMod: vi.fn(),
}));

vi.mock('../api/tags', () => ({
    getTags: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: false,
    }),
}));

function buildMod(externalId, title) {
    return {
        id: Number(externalId),
        external_id: String(externalId),
        title,
        description: `${title} description`,
        created_at: '2025-01-01T10:00:00.000Z',
        author_username: 'Tester',
        popularity: 0,
    };
}

function paged(items, overrides = {}) {
    return {
        items,
        total: items.length,
        page: 0,
        size: 12,
        total_pages: 1,
        has_next: false,
        has_previous: false,
        ...overrides,
    };
}

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="mods-location-search">{location.search}</div>;
}

function renderModsPage(initialPath = '/mods') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route
                    path="/mods"
                    element={(
                        <>
                            <ModsListPage />
                            <LocationProbe />
                        </>
                    )}
                />
            </Routes>
        </MemoryRouter>,
    );
}

function getLocationParams() {
    const search = screen.getByTestId('mods-location-search').textContent || '';
    return new URLSearchParams(search);
}

const TAGS = [
    { id: 1, name: 'Realism', slug: 'realism' },
    { id: 2, name: 'Hardcore', slug: 'hardcore' },
    { id: 3, name: 'Medical', slug: 'medical' },
];

describe('ModsListPage search flow', () => {
    beforeEach(() => {
        tagsApi.getTags.mockResolvedValue(paged(TAGS, { total: TAGS.length, size: 100 }));
        modsApi.searchMods.mockResolvedValue(paged([buildMod(100, 'Base Mod')]));
    });

    it('renders mods list without filters', async () => {
        modsApi.searchMods.mockResolvedValue(paged([
            buildMod(101, 'Submarine Core'),
            buildMod(102, 'Medical Pack'),
        ], { total: 2 }));

        renderModsPage();

        await waitFor(() => {
            expect(screen.getByText('Submarine Core')).toBeInTheDocument();
            expect(screen.getByText('Medical Pack')).toBeInTheDocument();
        });

        expect(modsApi.searchMods).toHaveBeenCalledWith({
            q: '',
            tags: [],
            page: 0,
            size: 12,
            sortBy: 'createdAt',
            direction: 'desc',
        });
    });

    it('searches by mod title', async () => {
        const user = userEvent.setup();
        modsApi.searchMods
            .mockResolvedValueOnce(paged([buildMod(100, 'Base Mod')]))
            .mockResolvedValueOnce(paged([buildMod(201, 'Submarine Plus')], { total: 1 }));

        renderModsPage();

        await waitFor(() => {
            expect(screen.getByText('Base Mod')).toBeInTheDocument();
        });

        await user.clear(screen.getByLabelText('Поиск по названию мода'));
        await user.type(screen.getByLabelText('Поиск по названию мода'), 'submarine');
        await user.click(screen.getByRole('button', { name: 'Найти' }));

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenLastCalledWith({
                q: 'submarine',
                tags: [],
                page: 0,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });
        expect(getLocationParams().get('q')).toBe('submarine');
    });

    it('filters by one tag', async () => {
        const user = userEvent.setup();
        modsApi.searchMods
            .mockResolvedValueOnce(paged([buildMod(100, 'Base Mod')]))
            .mockResolvedValueOnce(paged([buildMod(101, 'Realism Pack')], { total: 1 }));

        renderModsPage();

        await waitFor(() => {
            expect(screen.getByText('Base Mod')).toBeInTheDocument();
        });

        await user.selectOptions(screen.getByLabelText('Фильтр по тегам'), 'realism');
        await user.click(screen.getByRole('button', { name: 'Добавить тег' }));

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenLastCalledWith({
                q: '',
                tags: ['realism'],
                page: 0,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });
        expect(getLocationParams().get('tags')).toBe('realism');
    });

    it('filters by multiple tags', async () => {
        const user = userEvent.setup();
        modsApi.searchMods
            .mockResolvedValueOnce(paged([buildMod(100, 'Base Mod')]))
            .mockResolvedValueOnce(paged([buildMod(101, 'Realism Pack')], { total: 1 }))
            .mockResolvedValueOnce(paged([buildMod(102, 'Hardcore Realism Pack')], { total: 1 }));

        renderModsPage();

        await waitFor(() => {
            expect(screen.getByText('Base Mod')).toBeInTheDocument();
        });

        await user.selectOptions(screen.getByLabelText('Фильтр по тегам'), 'realism');
        await user.click(screen.getByRole('button', { name: 'Добавить тег' }));

        await user.selectOptions(screen.getByLabelText('Фильтр по тегам'), 'hardcore');
        await user.click(screen.getByRole('button', { name: 'Добавить тег' }));

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenLastCalledWith({
                q: '',
                tags: ['realism', 'hardcore'],
                page: 0,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });
        expect(getLocationParams().get('tags')).toBe('realism,hardcore');
    });

    it('combines text query and tags', async () => {
        const user = userEvent.setup();
        modsApi.searchMods
            .mockResolvedValueOnce(paged([buildMod(100, 'Base Mod')]))
            .mockResolvedValueOnce(paged([buildMod(201, 'Submarine Plus')], { total: 1 }))
            .mockResolvedValueOnce(paged([buildMod(202, 'Submarine Realism Plus')], { total: 1 }));

        renderModsPage();

        await waitFor(() => {
            expect(screen.getByText('Base Mod')).toBeInTheDocument();
        });

        await user.clear(screen.getByLabelText('Поиск по названию мода'));
        await user.type(screen.getByLabelText('Поиск по названию мода'), 'submarine');
        await user.click(screen.getByRole('button', { name: 'Найти' }));

        await user.selectOptions(screen.getByLabelText('Фильтр по тегам'), 'realism');
        await user.click(screen.getByRole('button', { name: 'Добавить тег' }));

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenLastCalledWith({
                q: 'submarine',
                tags: ['realism'],
                page: 0,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });

        const params = getLocationParams();
        expect(params.get('q')).toBe('submarine');
        expect(params.get('tags')).toBe('realism');
    });

    it('resets filters and clears URL params', async () => {
        const user = userEvent.setup();
        modsApi.searchMods
            .mockResolvedValueOnce(paged([buildMod(301, 'Submarine Hardcore')], { page: 1 }))
            .mockResolvedValueOnce(paged([buildMod(100, 'Base Mod')], { page: 0 }));

        renderModsPage('/mods?q=submarine&tags=realism,hardcore&page=1');

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenCalledWith({
                q: 'submarine',
                tags: ['realism', 'hardcore'],
                page: 1,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });

        await user.click(screen.getByRole('button', { name: 'Сбросить' }));

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenLastCalledWith({
                q: '',
                tags: [],
                page: 0,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });

        const params = getLocationParams();
        expect(params.get('q')).toBeNull();
        expect(params.get('tags')).toBeNull();
        expect(params.get('page')).toBeNull();
    });

    it('restores filters from URL query params', async () => {
        modsApi.searchMods.mockResolvedValue(paged([buildMod(401, 'URL Synced Mod')], { page: 1 }));

        renderModsPage('/mods?q=submarine&tags=realism,hardcore&page=1');

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenCalledWith({
                q: 'submarine',
                tags: ['realism', 'hardcore'],
                page: 1,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });

        expect(screen.getByDisplayValue('submarine')).toBeInTheDocument();
        expect(screen.getAllByText('Realism').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Hardcore').length).toBeGreaterThan(0);
    });

    it('keeps filters when changing pagination page', async () => {
        const user = userEvent.setup();
        modsApi.searchMods
            .mockResolvedValueOnce(paged([buildMod(501, 'Filtered Page 1')], {
                total: 14,
                page: 0,
                total_pages: 2,
                has_next: true,
                has_previous: false,
            }))
            .mockResolvedValueOnce(paged([buildMod(502, 'Filtered Page 2')], {
                total: 14,
                page: 1,
                total_pages: 2,
                has_next: false,
                has_previous: true,
            }));

        renderModsPage('/mods?q=submarine&tags=realism');

        await waitFor(() => {
            expect(screen.getByText('Filtered Page 1')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Вперед' }));

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenLastCalledWith({
                q: 'submarine',
                tags: ['realism'],
                page: 1,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });

        const params = getLocationParams();
        expect(params.get('q')).toBe('submarine');
        expect(params.get('tags')).toBe('realism');
        expect(params.get('page')).toBe('1');
    });

    it('calls backend search API with q, tags, page and size', async () => {
        modsApi.searchMods.mockResolvedValue(paged([buildMod(601, 'Param Check Mod')], { page: 2 }));

        renderModsPage('/mods?q=sonar&tags=medical,hardcore&page=2');

        await waitFor(() => {
            expect(modsApi.searchMods).toHaveBeenCalledWith({
                q: 'sonar',
                tags: ['medical', 'hardcore'],
                page: 2,
                size: 12,
                sortBy: 'createdAt',
                direction: 'desc',
            });
        });
    });
});
