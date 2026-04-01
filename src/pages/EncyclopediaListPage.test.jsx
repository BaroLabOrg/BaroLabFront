import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import EncyclopediaListPage, {
    mapNavigationTypesToSections,
    mergeSectionsWithBlueprint,
} from './EncyclopediaListPage';
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
        params.entityType === 'ITEM'
        && params.primaryCategory === 'Misc'
        && !params.secondaryCategory
    ) {
        return paged(
            [
                {
                    id: 'entity-item-1',
                    slug: 'loose-cargo',
                    title: 'Loose Cargo',
                    entityType: 'ITEM',
                    primaryCategory: 'Misc',
                    secondaryCategory: '',
                    summary: 'Unspecialized utility item.',
                    shortDescription: 'Unspecialized utility item.',
                    primaryImageUrl: null,
                },
            ],
            {
                total: 1,
                total_pages: 1,
            },
        );
    }

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
        expect(screen.getByRole('heading', { name: 'Подлодки' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Creatures 5 статей' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Транспортные 0 статей' })).toBeInTheDocument();
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

    it('opens entries directly when only self-secondary categories are returned', async () => {
        const user = userEvent.setup();
        encyclopediaApi.getEncyclopediaNavigation.mockResolvedValue({
            types: [
                {
                    entityType: 'ITEM',
                    total: 79,
                    primaryCategories: [
                        {
                            primaryCategory: 'Misc',
                            total: 79,
                            secondaryCategories: [
                                { secondaryCategory: 'Misc', total: 79 },
                            ],
                        },
                    ],
                },
            ],
        });

        renderPage('/encyclopedia?entityType=ITEM');

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Прочее 79 статей' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Прочее 79 статей' }));

        await waitFor(() => {
            expect(screen.getByLabelText('Поиск в выбранной подгруппе')).toBeInTheDocument();
        });

        expect(screen.getByText('Loose Cargo')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Misc: подподгруппы' })).toBeNull();
        const params = getLocationParams();
        expect(params.get('primaryCategory')).toBe('Other');
    });
});

describe('mapNavigationTypesToSections', () => {
    it('groups item categories into canonical placeholder-like structure', () => {
        const sections = mapNavigationTypesToSections([
            {
                entityType: 'ITEM',
                total: 254,
                primaryCategories: [
                    {
                        primaryCategory: 'Weapon',
                        total: 116,
                        secondaryCategories: [
                            { secondaryCategory: 'Alien', total: 3 },
                        ],
                    },
                    {
                        primaryCategory: 'Machine',
                        total: 47,
                        secondaryCategories: [],
                    },
                    {
                        primaryCategory: 'Medical',
                        total: 55,
                        secondaryCategories: [
                            { secondaryCategory: 'Treatment', total: 4 },
                        ],
                    },
                    {
                        primaryCategory: 'Misc',
                        total: 36,
                        secondaryCategories: [
                            { secondaryCategory: 'Misc', total: 36 },
                        ],
                    },
                ],
            },
        ]);

        expect(sections).toHaveLength(1);
        expect(sections[0].primaryBlocks.map((block) => block.key)).toEqual([
            'Medical',
            'Weapons',
            'Other',
        ]);
        expect(sections[0].primaryBlocks[0]).toMatchObject({
            key: 'Medical',
            label: 'Медицина',
            count: 55,
            queryPrimaryCategory: 'Medical',
            secondaryBlocks: [],
        });
        expect(sections[0].primaryBlocks[1].count).toBe(163);
        expect(sections[0].primaryBlocks[1].secondaryBlocks).toEqual([
            {
                key: 'Weapon',
                label: 'Weapon',
                count: 116,
                queryPrimaryCategory: 'Weapon',
                querySecondaryCategory: '',
            },
            {
                key: 'Machine',
                label: 'Machine',
                count: 47,
                queryPrimaryCategory: 'Machine',
                querySecondaryCategory: '',
            },
        ]);
        expect(sections[0].primaryBlocks[2]).toMatchObject({
            key: 'Other',
            label: 'Прочее',
            count: 36,
            queryPrimaryCategory: 'Misc',
            secondaryBlocks: [],
        });
    });

    it('normalizes noisy live navigation data for all entity types', () => {
        const sections = mapNavigationTypesToSections([
            {
                entityType: 'ITEM',
                total: 21,
                primaryCategories: [
                    {
                        primaryCategory: 'Misc',
                        total: 10,
                        secondaryCategories: [
                            { secondaryCategory: 'Misc', total: 10 },
                        ],
                    },
                    {
                        primaryCategory: 'misc',
                        total: 5,
                        secondaryCategories: [],
                    },
                    {
                        primaryCategory: 'Alien',
                        total: 3,
                        secondaryCategories: [],
                    },
                    {
                        primaryCategory: 'alien',
                        total: 2,
                        secondaryCategories: [],
                    },
                    {
                        primaryCategory: 'hidden',
                        total: 1,
                        secondaryCategories: [],
                    },
                ],
            },
            {
                entityType: 'SUBMARINE',
                total: 2,
                primaryCategories: [
                    {
                        primaryCategory: 'Attack',
                        total: 2,
                        secondaryCategories: [
                            { secondaryCategory: 'tier-1', total: 2 },
                        ],
                    },
                ],
            },
            {
                entityType: 'CREATURE',
                total: 1,
                primaryCategories: [
                    {
                        primaryCategory: 'husk',
                        total: 1,
                        secondaryCategories: [
                            { secondaryCategory: 'husk', total: 1 },
                        ],
                    },
                ],
            },
        ]);

        const itemSection = sections.find((section) => section.key === 'ITEM');
        expect(itemSection).toBeTruthy();
        const itemOther = itemSection.primaryBlocks.find((block) => block.key === 'Other');
        expect(itemOther).toBeTruthy();
        expect(itemOther.count).toBe(21);
        expect(itemOther.secondaryBlocks).toEqual([
            expect.objectContaining({
                key: 'Misc',
                count: 15,
                queryPrimaryCategory: 'Misc',
            }),
            expect.objectContaining({
                key: 'Alien',
                count: 5,
                queryPrimaryCategory: 'Alien',
            }),
        ]);

        const submarineSection = sections.find((section) => section.key === 'SUBMARINE');
        expect(submarineSection.primaryBlocks[0]).toMatchObject({
            key: 'Attack',
            count: 2,
            secondaryBlocks: [],
        });

        const creatureSection = sections.find((section) => section.key === 'CREATURE');
        expect(creatureSection.primaryBlocks[0]).toMatchObject({
            key: 'husk',
            count: 1,
            secondaryBlocks: [],
        });
    });
});

describe('mergeSectionsWithBlueprint', () => {
    it('keeps blueprint section order and fills missing sections with placeholders', () => {
        const merged = mergeSectionsWithBlueprint([
            {
                key: 'CREATURE',
                label: 'Существа',
                count: 5,
                primaryBlocks: [
                    {
                        key: 'Creatures',
                        label: 'Creatures',
                        count: 5,
                        queryPrimaryCategory: 'Creatures',
                        secondaryBlocks: [],
                    },
                ],
            },
            {
                key: 'JOB',
                label: 'Профессии',
                count: 2,
                primaryBlocks: [
                    {
                        key: 'Jobs',
                        label: 'Jobs',
                        count: 2,
                        queryPrimaryCategory: 'Jobs',
                        secondaryBlocks: [],
                    },
                ],
            },
        ]);

        expect(merged.slice(0, 11).map((section) => section.key)).toEqual([
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
        ]);

        const submarineSection = merged.find((section) => section.key === 'SUBMARINE');
        expect(submarineSection).toMatchObject({
            key: 'SUBMARINE',
            label: 'Подлодки',
            count: 0,
        });
        expect(submarineSection.primaryBlocks.map((block) => block.key)).toEqual([
            'Transport',
            'Attack',
            'Scout',
        ]);

        const creatureSection = merged.find((section) => section.key === 'CREATURE');
        expect(creatureSection.primaryBlocks.map((block) => block.key).slice(0, 3)).toEqual([
            'Monsters',
            'Humanoids',
            'Pets',
        ]);
        expect(creatureSection.primaryBlocks.find((block) => block.key === 'Creatures')).toBeTruthy();
    });
});
