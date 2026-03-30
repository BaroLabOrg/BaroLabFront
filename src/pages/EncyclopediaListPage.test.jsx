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
        'OTHER',
    ],
    getEncyclopediaNavigation: vi.fn(),
    getEncyclopediaList: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ isAdmin: false }),
}));

const NAVIGATION_DATA = {
    types: [
        {
            entityType: 'CREATURE',
            total: 5,
            primaryCategories: [
                {
                    primaryCategory: 'Creatures',
                    total: 5,
                    secondaryCategories: [
                        { secondaryCategory: 'Monsters', total: 3 },
                        { secondaryCategory: 'Pets', total: 2 },
                    ],
                },
            ],
        },
        {
            entityType: 'JOB',
            total: 2,
            primaryCategories: [
                {
                    primaryCategory: 'Jobs',
                    total: 2,
                    secondaryCategories: [
                        { secondaryCategory: 'Medical', total: 2 },
                    ],
                },
            ],
        },
    ],
};

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

function listResponse(params = {}) {
    if (
        params.entityType === 'CREATURE'
        && params.primaryCategory === 'Creatures'
        && params.secondaryCategory === 'Monsters'
    ) {
        return paged(
            [
                {
                    id: 'entity-creature-1',
                    slug: 'tiger-thresher',
                    title: 'Tiger Thresher',
                    entityType: 'CREATURE',
                    primaryCategory: 'Creatures',
                    secondaryCategory: 'Monsters',
                    summary: 'Aggressive deep-sea creature.',
                    shortDescription: 'Aggressive deep-sea creature.',
                    primaryImageUrl: null,
                },
            ],
            {
                total: 1,
                total_pages: 1,
            },
        );
    }

    return paged([], { total: 0, total_pages: 0 });
}

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

describe('EncyclopediaListPage hub structure', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        encyclopediaApi.getEncyclopediaNavigation.mockResolvedValue(NAVIGATION_DATA);
        encyclopediaApi.getEncyclopediaList.mockImplementation(async (params) => listResponse(params));
    });

    it('renders root page as sections with nested subgroup cards', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Разделы энциклопедии' })).toBeInTheDocument();
        });

        expect(encyclopediaApi.getEncyclopediaNavigation).toHaveBeenCalledTimes(1);
        expect(encyclopediaApi.getEncyclopediaList).not.toHaveBeenCalled();
        expect(screen.getByRole('heading', { name: 'Существа' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Профессии' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Creatures 5 статей' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Поиск в выбранной подгруппе')).not.toBeInTheDocument();
    });

    it('opens type page with subgroup blocks', async () => {
        const user = userEvent.setup();
        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Открыть раздел Существа' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Открыть раздел Существа' }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Существа: подгруппы' })).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Creatures 5 статей' })).toBeInTheDocument();
        expect(getLocationParams().get('entityType')).toBe('CREATURE');
        expect(getLocationParams().get('primaryCategory')).toBeNull();
    });

    it('navigates from subgroup to secondary group blocks', async () => {
        const user = userEvent.setup();
        renderPage('/encyclopedia?entityType=CREATURE');

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Creatures 5 статей' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Creatures 5 статей' }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Creatures: подподгруппы' })).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Monsters 3 статей' })).toBeInTheDocument();

        const params = getLocationParams();
        expect(params.get('entityType')).toBe('CREATURE');
        expect(params.get('primaryCategory')).toBe('Creatures');
        expect(params.get('secondaryCategory')).toBeNull();
    });

    it('shows entry list after choosing secondary subgroup', async () => {
        const user = userEvent.setup();
        renderPage('/encyclopedia?entityType=CREATURE&primaryCategory=Creatures');

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Monsters 3 статей' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Monsters 3 статей' }));

        await waitFor(() => {
            expect(screen.getByText('Tiger Thresher')).toBeInTheDocument();
        });

        expect(screen.getByLabelText('Поиск в выбранной подгруппе')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Tiger Thresher' })).toHaveAttribute(
            'href',
            '/encyclopedia/tiger-thresher',
        );

        const params = getLocationParams();
        expect(params.get('entityType')).toBe('CREATURE');
        expect(params.get('primaryCategory')).toBe('Creatures');
        expect(params.get('secondaryCategory')).toBe('Monsters');
    });

    it('shows demo placeholders when backend encyclopedia is empty', async () => {
        encyclopediaApi.getEncyclopediaNavigation.mockResolvedValue({ types: [] });
        encyclopediaApi.getEncyclopediaList.mockResolvedValue(paged([], { total: 0, total_pages: 0 }));

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Показаны демо-заглушки структуры/i)).toBeInTheDocument();
        });

        const expectedSections = [
            'Предметы',
            'Аффликты',
            'Персонажи',
            'Фракции',
            'Локации',
            'Подлодки',
            'Существа',
            'Биомы',
            'Таланты',
            'Профессии',
            'Прочее',
        ];

        expectedSections.forEach((sectionName) => {
            expect(screen.getByRole('heading', { name: sectionName })).toBeInTheDocument();
        });
    });
});
