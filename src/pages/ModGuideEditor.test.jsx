import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ModGuideEditor from './ModGuideEditor';
import { getMod } from '../api/mods';
import { searchInternalReferences } from '../api/internalReferences';

vi.mock('../api/mods', () => ({
    getMod: vi.fn(),
}));

vi.mock('../api/modGuides', () => ({
    getModGuideById: vi.fn(),
    createModGuide: vi.fn(),
    updateModGuide: vi.fn(),
}));

vi.mock('../api/internalReferences', () => ({
    loadInternalReferencePreview: vi.fn(),
    searchInternalReferences: vi.fn(),
}));

describe('ModGuideEditor internal links', () => {
    beforeEach(() => {
        getMod.mockResolvedValue({ external_id: 42, title: 'Host mod' });
        searchInternalReferences.mockResolvedValue({
            items: [
                { external_id: 99, title: 'Neurotrauma', main_image: 'https://cdn.test/neuro.jpg' },
            ],
            total_pages: 1,
            has_next: false,
            has_previous: false,
        });
        window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
    });

    it('turns the selected phrase into a canonical BaroLab link', async () => {
        render(
            <MemoryRouter initialEntries={['/mod/42/guides/new']}>
                <Routes>
                    <Route path="/mod/:id/guides/new" element={<ModGuideEditor />} />
                </Routes>
            </MemoryRouter>,
        );

        await screen.findByText(/Creating Guide for:/);
        const textarea = screen.getByPlaceholderText('Write your guide here using Markdown...');
        fireEvent.change(textarea, { target: { value: 'Use Neurotrauma for injuries' } });
        textarea.focus();
        textarea.setSelectionRange(4, 15);

        fireEvent.click(screen.getByRole('button', { name: /Add internal link/i }));
        await waitFor(() => expect(searchInternalReferences).toHaveBeenCalledWith('mod', '', {
            page: 0,
            size: 12,
            sortBy: 'popularity',
            direction: 'desc',
        }));
        fireEvent.click(await screen.findByRole('button', { name: /Neurotrauma Mod #99/i }));

        expect(textarea).toHaveValue('Use [Neurotrauma](/mod/99) for injuries');
    });
});
