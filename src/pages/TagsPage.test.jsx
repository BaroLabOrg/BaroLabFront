import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TagsPage from './TagsPage';
import * as tagsApi from '../api/tags';

vi.mock('../api/tags', () => ({
    getTags: vi.fn(),
    createTag: vi.fn(),
}));

function renderTagsPage(initialPath = '/tags') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/tags" element={<TagsPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('TagsPage', () => {
    it('renders tags list from catalog endpoint', async () => {
        tagsApi.getTags.mockResolvedValue([
            { id: 1, name: 'Medical', slug: 'medical', usageCount: 5 },
            { id: 2, name: 'Survival', slug: 'survival', usageCount: null },
        ]);

        renderTagsPage();

        await waitFor(() => {
            expect(screen.getByText('Medical')).toBeInTheDocument();
            expect(screen.getByText('Survival')).toBeInTheDocument();
        });
        expect(screen.getByText('slug: medical')).toBeInTheDocument();
    });

    it('creates tag successfully and refreshes list', async () => {
        const user = userEvent.setup();
        tagsApi.getTags
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 11, name: 'Medical', slug: 'medical', usageCount: null }]);
        tagsApi.createTag.mockResolvedValue({ id: 11, name: 'Medical', slug: 'medical' });

        renderTagsPage();

        await user.type(screen.getByLabelText('Создать новый тег'), '  Medical  ');
        await user.click(screen.getByRole('button', { name: 'Создать' }));

        await waitFor(() => {
            expect(tagsApi.createTag).toHaveBeenCalledWith('Medical');
        });
        await waitFor(() => {
            expect(screen.getByText('Medical')).toBeInTheDocument();
        });
    });

    it('shows duplicate message on 409', async () => {
        const user = userEvent.setup();
        tagsApi.getTags.mockResolvedValue([]);
        tagsApi.createTag.mockRejectedValue({ status: 409, code: 'TAG_ALREADY_EXISTS' });

        renderTagsPage();

        await user.type(screen.getByLabelText('Создать новый тег'), 'Medical');
        await user.click(screen.getByRole('button', { name: 'Создать' }));

        expect(await screen.findByText('Тег уже существует')).toBeInTheDocument();
    });

    it('blocks submit for empty value', async () => {
        const user = userEvent.setup();
        tagsApi.getTags.mockResolvedValue([]);
        tagsApi.createTag.mockResolvedValue({ id: 1, name: 'X', slug: 'x' });

        renderTagsPage();

        await user.type(screen.getByLabelText('Создать новый тег'), '   ');
        await user.click(screen.getByRole('button', { name: 'Создать' }));

        expect(tagsApi.createTag).not.toHaveBeenCalled();
        expect(screen.getByText('Введите название тега')).toBeInTheDocument();
    });

    it('loads list using sorting query params', async () => {
        const user = userEvent.setup();
        tagsApi.getTags.mockResolvedValue([]);

        renderTagsPage('/tags?sortBy=created_at&direction=desc');

        await waitFor(() => {
            expect(tagsApi.getTags).toHaveBeenCalledWith({
                sortBy: 'created_at',
                direction: 'desc',
            });
        });

        await user.selectOptions(screen.getByLabelText('Сортировка'), 'name');

        await waitFor(() => {
            expect(tagsApi.getTags).toHaveBeenCalledWith({
                sortBy: 'name',
                direction: 'desc',
            });
        });
    });
});

