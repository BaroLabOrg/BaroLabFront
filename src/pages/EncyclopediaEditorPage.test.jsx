import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EncyclopediaEditorPage from './EncyclopediaEditorPage';
import * as encyclopediaApi from '../api/encyclopedia';

vi.mock('../api/encyclopedia', () => ({
    ENCYCLOPEDIA_ENTITY_TYPES: ['ITEM', 'AFFLICTION', 'CREATURE'],
    ENCYCLOPEDIA_RELATION_TYPES: ['RELATED', 'CAUSES'],
    archiveEncyclopediaArticle: vi.fn(),
    createEncyclopediaArticle: vi.fn(),
    getAvailableEncyclopediaEntities: vi.fn(),
    getEncyclopediaEditor: vi.fn(),
    getEncyclopediaList: vi.fn(),
    previewEncyclopediaDraft: vi.fn(),
    publishEncyclopediaDraft: vi.fn(),
    saveEncyclopediaDraft: vi.fn(),
    updateEncyclopediaInfobox: vi.fn(),
    updateEncyclopediaMetadata: vi.fn(),
    updateEncyclopediaRelations: vi.fn(),
}));

function buildEditorResponse(overrides = {}) {
    return {
        entityId: 'entity-1',
        slug: 'husk-infection',
        title: 'Husk Infection',
        entityType: 'AFFLICTION',
        primaryCategory: 'Afflictions',
        secondaryCategory: 'Infections',
        article: {
            articleId: 'article-1',
            draftMarkdown: '# Draft',
            publishedMarkdown: '# Published',
            renderedHtml: '<h1>Published</h1>',
            summary: 'Summary',
            articleStatus: 'DRAFT',
            publishedAt: null,
            updatedAt: '2026-01-01T12:00:00.000Z',
        },
        infobox: [],
        manualRelations: [],
        importedProperties: [],
        ...overrides,
    };
}

describe('EncyclopediaEditorPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        encyclopediaApi.getAvailableEncyclopediaEntities.mockResolvedValue({
            items: [
                {
                    id: 'entity-99',
                    title: 'Husk Infection',
                    slug: 'husk-infection',
                    entityType: 'AFFLICTION',
                    shortDescription: 'Parasitic infection',
                },
            ],
            total: 1,
            page: 0,
            size: 10,
            total_pages: 1,
            has_next: false,
            has_previous: false,
        });
        encyclopediaApi.getEncyclopediaList.mockResolvedValue({ items: [] });
        encyclopediaApi.previewEncyclopediaDraft.mockResolvedValue({ renderedHtml: '', links: [] });
        encyclopediaApi.publishEncyclopediaDraft.mockResolvedValue(buildEditorResponse({
            article: { ...buildEditorResponse().article, articleStatus: 'PUBLISHED' },
        }));
        encyclopediaApi.updateEncyclopediaMetadata.mockResolvedValue(buildEditorResponse());
        encyclopediaApi.updateEncyclopediaInfobox.mockResolvedValue(buildEditorResponse());
        encyclopediaApi.updateEncyclopediaRelations.mockResolvedValue(buildEditorResponse());
        encyclopediaApi.archiveEncyclopediaArticle.mockResolvedValue(buildEditorResponse({
            article: { ...buildEditorResponse().article, articleStatus: 'ARCHIVED' },
        }));
        encyclopediaApi.saveEncyclopediaDraft.mockResolvedValue(buildEditorResponse({
            article: { ...buildEditorResponse().article, draftMarkdown: '## Updated draft' },
        }));
    });

    it('creates encyclopedia page in create mode', async () => {
        const user = userEvent.setup();
        encyclopediaApi.createEncyclopediaArticle.mockResolvedValue(buildEditorResponse({ entityId: 'entity-99' }));

        render(
            <MemoryRouter initialEntries={['/admin/encyclopedia/new']}>
                <Routes>
                    <Route path="/admin/encyclopedia/new" element={<EncyclopediaEditorPage />} />
                    <Route path="/admin/encyclopedia/:id/edit" element={<div data-testid="redirect-ok">redirected</div>} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Husk Infection husk-infection AFFLICTION' })).toBeInTheDocument();
        });
        expect(encyclopediaApi.getAvailableEncyclopediaEntities).toHaveBeenCalled();
        await user.click(screen.getByRole('button', { name: 'Husk Infection husk-infection AFFLICTION' }));

        await user.type(screen.getByLabelText('Summary'), ' test summary ');
        await user.type(screen.getByLabelText('Draft markdown'), '# Initial');
        await user.click(screen.getByRole('button', { name: 'Создать' }));

        await waitFor(() => {
            expect(encyclopediaApi.createEncyclopediaArticle).toHaveBeenCalledWith({
                entityId: 'entity-99',
                summary: 'Parasitic infection test summary',
                draftMarkdown: '# Initial',
            });
        });
        expect(await screen.findByTestId('redirect-ok')).toBeInTheDocument();
    });

    it('loads edit mode and saves draft', async () => {
        const user = userEvent.setup();
        encyclopediaApi.getEncyclopediaEditor.mockResolvedValue(buildEditorResponse());

        render(
            <MemoryRouter initialEntries={['/admin/encyclopedia/entity-1/edit']}>
                <Routes>
                    <Route path="/admin/encyclopedia/:id/edit" element={<EncyclopediaEditorPage />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Husk Infection' })).toBeInTheDocument();
        });

        await user.clear(screen.getByLabelText('Черновик markdown'));
        await user.type(screen.getByLabelText('Черновик markdown'), '## Updated draft');
        await user.click(screen.getByRole('button', { name: 'Save draft' }));

        await waitFor(() => {
            expect(encyclopediaApi.saveEncyclopediaDraft).toHaveBeenCalledWith('entity-1', '## Updated draft');
        });
    });
});
