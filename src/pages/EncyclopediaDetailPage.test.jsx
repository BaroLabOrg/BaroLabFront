import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EncyclopediaDetailPage from './EncyclopediaDetailPage';
import * as encyclopediaApi from '../api/encyclopedia';

let authState = { isAdmin: false };

vi.mock('../api/encyclopedia', () => ({
    getEncyclopediaDetail: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => authState,
}));

function buildDetail(overrides = {}) {
    return {
        id: 'entity-1',
        slug: 'husk-infection',
        title: 'Husk Infection',
        entityType: 'AFFLICTION',
        primaryCategory: 'Afflictions',
        secondaryCategory: 'Infections',
        summary: 'Parasitic infection.',
        renderedHtml: '<h2>Overview</h2><p>Caused by husk eggs.</p>',
        infobox: [
            { fieldKey: 'type', fieldLabel: 'Type', fieldValue: 'Parasitic', sortOrder: 0 },
        ],
        relatedEntities: [
            { id: 'entity-2', slug: 'husk-egg', title: 'Husk Egg', relationType: 'CAUSES', origin: 'IMPORTED' },
        ],
        backlinks: [
            { articleId: 'article-1', sourceEntityId: 'entity-3', sourceSlug: 'calyxanide', sourceTitle: 'Calyxanide', publishedAt: '2026-01-12T10:00:00.000Z' },
        ],
        relatedMods: [
            { modExternalId: 123456, relationType: 'RELATED', confidence: 0.95 },
        ],
        importedProperties: [
            { propertyKey: 'max_strength', propertyValue: '85', valueType: 'INTEGER', origin: 'IMPORTED' },
        ],
        crafting: null,
        armament: null,
        ...overrides,
    };
}

function renderPage(path = '/encyclopedia/husk-infection') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/encyclopedia/:slug" element={<EncyclopediaDetailPage />} />
                <Route path="/admin/encyclopedia/:id/edit" element={<div>editor</div>} />
                <Route path="/encyclopedia/:slug/*" element={<div>slug page</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('EncyclopediaDetailPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        authState = { isAdmin: false };
    });

    it('renders article sections and metadata', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail());

        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Husk Infection' })).toBeInTheDocument();
        });

        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Caused by husk eggs.')).toBeInTheDocument();
        expect(screen.getByText('Husk Egg')).toBeInTheDocument();
        expect(screen.getByText('Calyxanide')).toBeInTheDocument();
        expect(screen.getByText('Mod #123456')).toBeInTheDocument();
        expect(screen.getByText('max_strength')).toBeInTheDocument();
        expect(screen.getByText('Parasitic')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: '✏️ Редактировать' })).not.toBeInTheDocument();
    });

    it('shows edit button for admins', async () => {
        authState = { isAdmin: true };
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail());

        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Husk Infection' })).toBeInTheDocument();
        });

        expect(screen.getByRole('link', { name: '✏️ Редактировать' })).toHaveAttribute(
            'href',
            '/admin/encyclopedia/entity-1/edit',
        );
    });

    it('renders markdown links and wiki-links as internal encyclopedia links', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            publishedMarkdown: [
                '## Links',
                'Подробнее: [Bandage](/encyclopedia/bandage)',
                'См. также: [[Husk Infection]]',
            ].join('\n'),
            renderedHtml: '',
        }));

        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Husk Infection' })).toBeInTheDocument();
        });

        expect(screen.getByRole('link', { name: 'Bandage' })).toHaveAttribute(
            'href',
            '/encyclopedia/bandage',
        );
        expect(screen.getAllByRole('link', { name: 'Husk Infection' })[0]).toHaveAttribute(
            'href',
            '/encyclopedia/husk-infection',
        );
    });

    it('uses demo fallback content when demo article is not available on backend', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockRejectedValue(new Error('Not found'));

        renderPage('/encyclopedia/charybdis');

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Charybdis' })).toBeInTheDocument();
        });

        expect(screen.getByText(/Демо-версия статьи/i)).toBeInTheDocument();
        expect(screen.getByText('Очень высокая')).toBeInTheDocument();
        expect(screen.getByText('Глубоководный хищник очень высокого уровня угрозы.')).toBeInTheDocument();
        expect(screen.queryByText('Not found')).not.toBeInTheDocument();
    });

    it('shows error state when API fails', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockRejectedValue(new Error('Not found'));

        renderPage('/encyclopedia/unknown-entry');

        expect(await screen.findByText('Not found')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '← Назад к энциклопедии' })).toBeInTheDocument();
    });

    it('renders crafting section for items and uses encyclopedia links for ingredients', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            entityType: 'ITEM',
            slug: 'bandage',
            title: 'Bandage',
            crafting: {
                hasRecipe: true,
                recipes: [
                    {
                        recipeType: 'FABRICATE',
                        fabricationTime: '10',
                        outputCount: '2',
                        requiredStations: ['fabricator'],
                        ingredients: [
                            {
                                itemIdentifier: 'organicfiber',
                                amount: '1',
                                title: 'Organic Fiber',
                                slug: 'organic-fiber',
                                isLinkable: true,
                            },
                        ],
                    },
                ],
            },
        }));

        renderPage('/encyclopedia/bandage');

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Bandage' })).toBeInTheDocument();
        });

        expect(screen.getByRole('heading', { name: 'Крафт' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Organic Fiber' })).toHaveAttribute(
            'href',
            '/encyclopedia/organic-fiber',
        );
        expect(screen.getByText('x1')).toBeInTheDocument();
    });

    it('renders ingredient as plain text when slug is missing', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            entityType: 'ITEM',
            slug: 'bandage',
            title: 'Bandage',
            crafting: {
                hasRecipe: true,
                recipes: [
                    {
                        recipeType: 'FABRICATE',
                        ingredients: [
                            {
                                itemIdentifier: 'organicfiber',
                                amount: '1',
                                title: 'Organic Fiber',
                                slug: null,
                                isLinkable: false,
                            },
                        ],
                    },
                ],
            },
        }));

        renderPage('/encyclopedia/bandage');

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Bandage' })).toBeInTheDocument();
        });

        const ingredientText = screen.getByText('Organic Fiber');
        expect(ingredientText).toBeInTheDocument();
        expect(ingredientText.closest('a')).toBeNull();
    });

    it('renders empty crafting text for items without recipe', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            entityType: 'ITEM',
            slug: 'wrench',
            title: 'Wrench',
            crafting: {
                hasRecipe: false,
                recipes: [],
            },
        }));

        renderPage('/encyclopedia/wrench');

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Wrench' })).toBeInTheDocument();
        });

        expect(screen.getByText('Крафт отсутствует.')).toBeInTheDocument();
    });

    it('renders armament section for submarines', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            entityType: 'SUBMARINE',
            slug: 'orca',
            title: 'Orca',
            armament: {
                turretSlotCount: 2,
                largeTurretSlotCount: 1,
                defaultTurretWeapons: ['coilgun', 'doublecoilgun'],
                defaultLargeTurretWeapons: ['railgun'],
            },
        }));

        renderPage('/encyclopedia/orca');

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });

        expect(screen.getByRole('heading', { name: 'Вооружение' })).toBeInTheDocument();
        expect(screen.getByText(/Малые слоты турелей:/)).toBeInTheDocument();
        expect(screen.getByText(/Большие слоты турелей:/)).toBeInTheDocument();
        expect(screen.getByText('Coilgun')).toBeInTheDocument();
        expect(screen.getByText('Railgun')).toBeInTheDocument();
    });
});
