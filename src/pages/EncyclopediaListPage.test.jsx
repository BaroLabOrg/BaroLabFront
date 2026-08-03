import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import EncyclopediaListPage from './EncyclopediaListPage';
import * as encyclopediaApi from '../api/encyclopedia';

vi.mock('../api/encyclopedia', () => ({
    ENCYCLOPEDIA_ENTITY_TYPES: [
        'ITEM',
        'AFFLICTION',
        'CHARACTER',
        'FACTION',
        'LOCATION',
        'SUBMARINE',
        'CREATURE',
        'BIOME',
        'TALENT',
        'JOB',
        'MISSION',
        'TALENT_TREE',
        'UPGRADE_MODULE',
        'CORPSE',
        'DISEMBARK_PERK',
        'RANDOM_EVENT',
        'OTHER',
    ],
    ENCYCLOPEDIA_ENTITY_SOURCES: ['VANILLA', 'MOD'],
    searchEncyclopedia: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ isAdmin: false }),
}));

vi.mock('../context/QuestContext', () => ({
    useOptionalQuest: () => null,
}));

function paged(items, overrides = {}) {
    return {
        items,
        total: items.length,
        page: 0,
        size: 12,
        total_pages: items.length > 0 ? 1 : 0,
        has_next: false,
        has_previous: false,
        ...overrides,
    };
}

const TIGER_THRESHER = {
    id: 'entity-creature-1',
    slug: 'tiger-thresher',
    title: 'Tiger Thresher',
    entityType: 'CREATURE',
    entitySource: 'VANILLA',
    summary: 'Aggressive deep-sea creature.',
    shortDescription: 'Aggressive deep-sea creature.',
    primaryImageUrl: null,
};

const CUSTOM_HARPOON = {
    id: 'entity-mod-1',
    slug: 'custom-harpoon',
    title: 'Custom Harpoon',
    entityType: 'ITEM',
    entitySource: 'MOD',
    summary: 'A community-made weapon.',
    shortDescription: 'A community-made weapon.',
    primaryImageUrl: null,
};

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="encyclopedia-location-search">{location.search}</div>;
}

function renderPage(initialPath = '/encyclopedia') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route
                    path="/encyclopedia"
                    element={(
                        <>
                            <EncyclopediaListPage />
                            <LocationProbe />
                        </>
                    )}
                />
            </Routes>
        </MemoryRouter>,
    );
}

function getLocationParams() {
    const search = screen.getByTestId('encyclopedia-location-search').textContent || '';
    return new URLSearchParams(search);
}

describe('EncyclopediaListPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        encyclopediaApi.searchEncyclopedia.mockResolvedValue(paged([TIGER_THRESHER, CUSTOM_HARPOON], { total: 2 }));
    });

    it('loads results on mount with default (no) filters', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Tiger Thresher')).toBeInTheDocument();
        });

        expect(encyclopediaApi.searchEncyclopedia).toHaveBeenCalledWith(
            expect.objectContaining({
                q: '',
                entityType: undefined,
                entitySource: undefined,
                page: 0,
                sortBy: 'publishedAt',
                direction: 'desc',
            }),
        );
        expect(screen.getByText('Custom Harpoon')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Tiger Thresher' })).toHaveAttribute(
            'href',
            '/encyclopedia/tiger-thresher',
        );
    });

    it('submits a text search and resets to page 0', async () => {
        const user = userEvent.setup();
        renderPage('/encyclopedia?page=2');

        await waitFor(() => {
            expect(screen.getByLabelText('Search')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Search'), 'harpoon');
        await user.click(screen.getByRole('button', { name: 'Search' }));

        await waitFor(() => {
            expect(getLocationParams().get('q')).toBe('harpoon');
        });
        expect(getLocationParams().get('page')).toBeNull();
        expect(encyclopediaApi.searchEncyclopedia).toHaveBeenLastCalledWith(
            expect.objectContaining({ q: 'harpoon', page: 0 }),
        );
    });

    it('filters by entity source', async () => {
        const user = userEvent.setup();
        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Mod' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Mod' }));

        await waitFor(() => {
            expect(getLocationParams().get('entitySource')).toBe('MOD');
        });
        expect(encyclopediaApi.searchEncyclopedia).toHaveBeenLastCalledWith(
            expect.objectContaining({ entitySource: 'MOD' }),
        );
    });

    it('filters by entity type', async () => {
        const user = userEvent.setup();
        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Creature' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Creature' }));

        await waitFor(() => {
            expect(getLocationParams().get('entityType')).toBe('CREATURE');
        });
        expect(encyclopediaApi.searchEncyclopedia).toHaveBeenLastCalledWith(
            expect.objectContaining({ entityType: 'CREATURE' }),
        );
    });

    it('changes sort preset', async () => {
        const user = userEvent.setup();
        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Title A→Z' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Title A→Z' }));

        await waitFor(() => {
            expect(getLocationParams().get('sort')).toBe('title');
        });
        expect(encyclopediaApi.searchEncyclopedia).toHaveBeenLastCalledWith(
            expect.objectContaining({ sortBy: 'title', direction: 'asc' }),
        );
    });

    it('shows an empty state when there are no results', async () => {
        encyclopediaApi.searchEncyclopedia.mockResolvedValue(paged([], { total: 0, total_pages: 0 }));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('No published articles match these filters yet.')).toBeInTheDocument();
        });
    });

    it('surfaces an error message when the request fails', async () => {
        encyclopediaApi.searchEncyclopedia.mockRejectedValue(new Error('boom'));
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('boom')).toBeInTheDocument();
        });
    });
});
