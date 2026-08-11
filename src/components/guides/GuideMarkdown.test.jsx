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

    it('places a hoisted INFOBOX in a separate column from the guide body', () => {
        const { container } = render(
            <MemoryRouter>
                <div className="guide-markdown-body">
                    <GuideMarkdown hoistInfobox>
                        {'# Field notes\n\nIntro text.\n\n| INFOBOX: Scavenger | |\n| :--- | :--- |\n| Health | 100 HP |\n\n## Tactics'}
                    </GuideMarkdown>
                </div>
            </MemoryRouter>,
        );

        const infobox = container.querySelector('.guide-infobox');
        const heading = screen.getByRole('heading', { name: 'Field notes' });
        const layout = container.querySelector('.guide-markdown-layout');
        const article = container.querySelector('.guide-markdown-article');
        const aside = container.querySelector('.guide-markdown-aside');
        expect(infobox).toBeInTheDocument();
        expect(within(infobox).getByText('Scavenger')).toBeInTheDocument();
        expect(within(infobox).queryByText(/INFOBOX:/)).not.toBeInTheDocument();
        expect(layout).toBeInTheDocument();
        expect(article).toContainElement(heading);
        expect(aside).toContainElement(infobox);
        expect(article).not.toContainElement(infobox);
    });

    it('keeps INFOBOX examples in their authored position by default', () => {
        const { container } = render(
            <MemoryRouter>
                <div className="guide-markdown-body">
                    <GuideMarkdown>
                        {'# Infobox instructions\n\nCopy this example below.\n\n| INFOBOX: Example | |\n| :--- | :--- |\n| Health | 100 HP |\n\n```markdown\n| INFOBOX: Copy me | |\n```'}
                    </GuideMarkdown>
                </div>
            </MemoryRouter>,
        );

        const paragraph = screen.getByText('Copy this example below.');
        const infobox = container.querySelector('.guide-infobox');
        expect(paragraph.compareDocumentPosition(infobox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(container.querySelector('.guide-markdown-layout')).not.toBeInTheDocument();
        expect(screen.getByText('| INFOBOX: Copy me | |')).toBeInTheDocument();
    });
});
