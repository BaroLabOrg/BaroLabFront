import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PropertyFieldList } from './PropertyValue';
import { loadInternalReferencePreview } from '../api/internalReferences';

vi.mock('../api/internalReferences', () => ({
    loadInternalReferencePreview: vi.fn(),
}));

function renderFields(props) {
    return render(
        <MemoryRouter>
            <PropertyFieldList {...props} />
        </MemoryRouter>,
    );
}

describe('PropertyFieldList', () => {
    beforeEach(() => {
        loadInternalReferencePreview.mockReset();
        loadInternalReferencePreview.mockRejectedValue(new Error('Not found'));
    });

    it('renders top-level and nested fields through the same grid pattern', () => {
        renderFields({
            entries: [
                ['deconstruct_time', '1.0'],
                ['status_effects', [{ action_type: 'Always', target: 'This' }]],
            ],
        });

        const grids = document.querySelectorAll('.property-field-grid');
        // one grid for the top-level entries, one for the nested status effect
        expect(grids).toHaveLength(2);
        expect(screen.getByText('Deconstruct Time')).toBeInTheDocument();
        expect(screen.getByText('1.0')).toBeInTheDocument();
        expect(screen.getByText('Action Type')).toBeInTheDocument();
        expect(screen.getByText('Always')).toBeInTheDocument();
    });

    it('marks nested object/array values with a visible nesting block', () => {
        renderFields({
            entries: [['status_effects', [{ action_type: 'OnUse' }, { action_type: 'OnContained' }]]],
        });

        expect(document.querySelectorAll('.property-nested-block')).toHaveLength(2);
    });

    it('collapses a primitive array to a comma-separated value', () => {
        renderFields({ entries: [['tags', ['smallitem', 'tool', 'signal']]] });
        expect(screen.getByText('smallitem, tool, signal')).toBeInTheDocument();
    });

    it('renders path/file-like values monospace with a title attribute', () => {
        renderFields({
            entries: [['icon_texture', '%ModDir%/Items/Containers/ekutility_labels_fixed.png']],
        });

        const value = screen.getByText('%ModDir%/Items/Containers/ekutility_labels_fixed.png');
        expect(value).toHaveClass('property-value-path');
        expect(value).toHaveAttribute('title', '%ModDir%/Items/Containers/ekutility_labels_fixed.png');
    });

    it('does not treat plain text values as paths', () => {
        renderFields({ entries: [['category', 'Equipment']] });
        const value = screen.getByText('Equipment');
        expect(value).toHaveClass('property-value-text');
    });

    it('renders known affliction identifiers as titled links with their amounts', () => {
        renderFields({
            entries: [['causes_afflictions', [
                { amount: 3, type_or_identifier: 'burn' },
                { amount: 1, type_or_identifier: 'explosiondamage' },
            ]]],
            relations: [
                { slug: 'burn', title: 'Burn', relationType: 'CAUSES', direction: 'OUTGOING' },
                {
                    slug: 'explosiondamage',
                    title: 'Deep tissue injury',
                    relationType: 'CAUSES',
                    direction: 'OUTGOING',
                },
            ],
        });

        expect(screen.getByRole('link', { name: 'Burn' })).toHaveAttribute('href', '/encyclopedia/burn');
        expect(screen.getByRole('link', { name: 'Deep tissue injury' })).toHaveAttribute(
            'href',
            '/encyclopedia/explosiondamage',
        );
        expect(screen.getByLabelText('Amount 3')).toHaveTextContent('×3');
        expect(screen.getByLabelText('Amount 1')).toHaveTextContent('×1');
        expect(screen.queryByText('Type Or Identifier')).not.toBeInTheDocument();
    });

    it('resolves an exact affliction slug when a conditional effect is absent from Causes', async () => {
        loadInternalReferencePreview.mockResolvedValue({
            title: 'Burn',
            imageUrl: 'https://cdn.test/burn.png',
            detail: 'AFFLICTION',
            summary: 'The area is blistered and red.',
        });

        renderFields({
            entries: [['afflictions', [{ amount: 20, type_or_identifier: 'burn' }]]],
            relations: [],
        });

        expect(await screen.findByRole('link', { name: 'Burn' })).toHaveAttribute(
            'href',
            '/encyclopedia/burn',
        );
        expect(loadInternalReferencePreview).toHaveBeenCalledWith({
            type: 'encyclopedia',
            slug: 'burn',
        });
        expect(screen.queryByText('Unresolved reference')).not.toBeInTheDocument();
    });

    it('marks identifiers without one unique affliction match and does not invent a link', async () => {
        renderFields({
            entries: [['afflictions', [{ amount: 2, type_or_identifier: 'poison' }]]],
            relations: [
                { slug: 'poison', title: 'Poison A', relationType: 'TREATS', direction: 'OUTGOING' },
            ],
        });

        expect(screen.getByText('poison')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('Unresolved reference')).toBeInTheDocument();
        });
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Amount 2')).toHaveTextContent('×2');
    });
});
