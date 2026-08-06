import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GuideMarkdown from './GuideMarkdown';
import { loadInternalReferencePreview } from '../../api/internalReferences';

vi.mock('../../api/internalReferences', () => ({
    loadInternalReferencePreview: vi.fn(),
}));

describe('GuideMarkdown', () => {
    beforeEach(() => {
        loadInternalReferencePreview.mockResolvedValue({
            kind: 'Mod',
            title: 'Neurotrauma',
            imageUrl: 'https://cdn.test/mod.jpg',
        });
    });

    it('renders supported BaroLab destinations as links and external destinations as text', () => {
        render(
            <MemoryRouter>
                <GuideMarkdown>
                    {'[Internal](/mod/42) and [External](https://example.com)'}
                </GuideMarkdown>
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: 'Internal' })).toHaveAttribute('href', '/mod/42');
        expect(screen.queryByRole('link', { name: 'External' })).not.toBeInTheDocument();
        expect(screen.getByText('External')).toHaveAttribute(
            'title',
            'Only BaroLab internal links are allowed',
        );
    });

    it('loads and displays a preview on keyboard focus', async () => {
        render(
            <MemoryRouter>
                <GuideMarkdown>{'[Neurotrauma](/mod/42)'}</GuideMarkdown>
            </MemoryRouter>,
        );

        fireEvent.focus(screen.getByRole('link', { name: 'Neurotrauma' }));

        await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
        expect(within(screen.getByRole('tooltip')).getByText('Neurotrauma')).toBeInTheDocument();
        expect(loadInternalReferencePreview).toHaveBeenCalledWith(expect.objectContaining({
            type: 'mod',
            externalId: '42',
        }));
    });
});
