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
        entitySource: 'VANILLA',
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
        expect(screen.getByText('Max Strength')).toBeInTheDocument();
        expect(screen.getByText('Parasitic')).toBeInTheDocument();
        expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === 'Source: Vanilla')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Edit article' })).not.toBeInTheDocument();
    });

    it('shows edit button for admins', async () => {
        authState = { isAdmin: true };
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail());

        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Husk Infection' })).toBeInTheDocument();
        });

        expect(screen.getByRole('link', { name: 'Edit article' })).toHaveAttribute(
            'href',
            '/admin/encyclopedia/entity-1/edit',
        );
    });

    it('renders markdown links and wiki-links as internal encyclopedia links', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            publishedMarkdown: [
                '## Links',
                'See also: [Bandage](/encyclopedia/bandage)',
                'Related: [[Husk Infection]]',
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

    it('shows error state when API fails', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockRejectedValue(new Error('Not found'));

        renderPage('/encyclopedia/unknown-entry');

        expect(await screen.findByText('Not found')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '← Back to encyclopedia' })).toBeInTheDocument();
    });

    it('renders the crafting section only when a recipe is present, regardless of entity type', async () => {
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

        expect(screen.getByRole('heading', { name: 'Crafting' })).toBeInTheDocument();
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

    it('omits the crafting section entirely when there is no recipe', async () => {
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

        expect(screen.queryByRole('heading', { name: 'Crafting' })).not.toBeInTheDocument();
    });

    it('renders a random event as an action tree and drops its always-empty sections', async () => {
        const actions = [{
            tag: 'checkdataaction',
            attrs: { identifier: 'youngcultists_completed' },
            children: [{ tag: 'success', attrs: {}, children: [] }],
        }];

        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            entityType: 'RANDOM_EVENT',
            slug: 'event-youngcultists',
            title: 'youngcultists',
            infobox: [],
            primaryImage: null,
            importedProperties: [
                { propertyKey: 'event_type', propertyValue: 'ScriptedEvent', valueType: 'TEXT', origin: 'IMPORTED' },
                {
                    propertyKey: 'actions',
                    propertyValue: JSON.stringify(actions),
                    valueType: 'JSON',
                    origin: 'IMPORTED',
                },
            ],
        }));

        renderPage('/encyclopedia/event-youngcultists');

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'youngcultists' })).toBeInTheDocument();
        });

        expect(screen.getByRole('heading', { name: 'Event script' })).toBeInTheDocument();
        expect(screen.getByText('Checkdataaction')).toBeInTheDocument();
        // the tree replaces the generic property row for `actions`
        expect(screen.queryByText('Actions')).not.toBeInTheDocument();
        // ... but the raw table is still reachable
        expect(screen.getByRole('button', { name: /Show raw imported data/ })).toBeInTheDocument();

        expect(screen.queryByText('Image not available')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Infobox' })).not.toBeInTheDocument();
    });

    it('groups relations by type and direction with readable labels', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            entityType: 'ITEM',
            slug: 'physicorium',
            title: 'Physicorium Bar',
            relatedEntities: [
                { id: 'e1', slug: 'assault-rifle', title: 'Assault Rifle', relationType: 'CRAFTED_FROM', direction: 'INCOMING', origin: 'SYSTEM' },
                { id: 'e2', slug: 'alien-spear', title: 'Alien Spear', relationType: 'CRAFTED_FROM', direction: 'INCOMING', origin: 'SYSTEM' },
                { id: 'e3', slug: 'raw-ore', title: 'Raw Ore', relationType: 'DECONSTRUCTS_INTO', direction: 'OUTGOING', origin: 'SYSTEM' },
            ],
        }));

        renderPage('/encyclopedia/physicorium');

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Physicorium Bar' })).toBeInTheDocument();
        });

        expect(screen.getByRole('heading', { name: /Used to craft/ })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Deconstructs into/ })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Assault Rifle' })).toHaveAttribute(
            'href',
            '/encyclopedia/assault-rifle',
        );
        // the raw enum name never reaches the page
        expect(screen.queryByText('CRAFTED_FROM')).not.toBeInTheDocument();
    });

    it('omits the relations section when there is nothing to link', async () => {
        vi.spyOn(encyclopediaApi, 'getEncyclopediaDetail').mockResolvedValue(buildDetail({
            relatedEntities: [],
        }));

        renderPage();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Husk Infection' })).toBeInTheDocument();
        });

        expect(screen.queryByRole('heading', { name: 'Related entities' })).not.toBeInTheDocument();
    });

    it('renders the armament section when armament data is present', async () => {
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

        expect(screen.getByRole('heading', { name: 'Armament' })).toBeInTheDocument();
        expect(screen.getByText(/Small turret slots:/)).toBeInTheDocument();
        expect(screen.getByText(/Large turret slots:/)).toBeInTheDocument();
        expect(screen.getByText('Coilgun')).toBeInTheDocument();
        expect(screen.getByText('Railgun')).toBeInTheDocument();
    });
});
