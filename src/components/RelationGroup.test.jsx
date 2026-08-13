import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RelationGroup from './RelationGroup';

function buildGroup(size) {
    return {
        key: 'CRAFTED_FROM:INCOMING',
        relationType: 'CRAFTED_FROM',
        direction: 'INCOMING',
        label: 'Used to craft',
        entries: Array.from({ length: size }, (_, index) => ({
            id: `e${index}`,
            slug: `item-${index}`,
            title: `Item ${index}`,
        })),
    };
}

function renderGroup(size) {
    return render(
        <MemoryRouter>
            <RelationGroup group={buildGroup(size)} />
        </MemoryRouter>,
    );
}

describe('RelationGroup', () => {
    it('lists every entry when the group is small', () => {
        renderGroup(3);

        expect(screen.getByRole('heading', { name: /Used to craft/ })).toBeInTheDocument();
        expect(screen.getAllByRole('link')).toHaveLength(3);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('caps a long group and reveals the rest on demand', async () => {
        const user = userEvent.setup();
        renderGroup(40);

        expect(screen.getAllByRole('link')).toHaveLength(24);
        const toggle = screen.getByRole('button', { name: 'Show all 40' });

        await user.click(toggle);
        expect(screen.getAllByRole('link')).toHaveLength(40);

        await user.click(screen.getByRole('button', { name: 'Show fewer' }));
        expect(screen.getAllByRole('link')).toHaveLength(24);
    });

    it('shows the total count next to the label even while capped', () => {
        renderGroup(40);
        expect(screen.getByRole('heading', { name: /Used to craft 40/ })).toBeInTheDocument();
    });
});
