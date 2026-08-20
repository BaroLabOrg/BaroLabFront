import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MissingMods from './MissingMods';

function entry(overrides = {}) {
    return {
        externalId: 2937059625,
        name: 'Neurotrauma',
        hard: false,
        neededBy: 'Mercy Hospital Updated',
        alternatives: [],
        ...overrides,
    };
}

describe('MissingMods', () => {
    it('does not tell somebody a recommendation is needed', () => {
        // лодка не требует мод, она его использует: отсутствующий предмет
        // просто не появится, движок от этого не падает
        render(<MissingMods missing={[entry()]} />);

        expect(screen.getByText('Recommended')).toBeInTheDocument();
        expect(screen.getByText(/Used by Mercy Hospital Updated/)).toBeInTheDocument();
        expect(screen.queryByText(/Needed by/)).not.toBeInTheDocument();
    });

    it('still says needed for the ones that really are', () => {
        render(<MissingMods missing={[entry({ hard: true })]} />);

        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByText(/Needed by Mercy Hospital Updated/)).toBeInTheDocument();
    });

    it('offers any one of the alternatives rather than all of them', () => {
        render(<MissingMods missing={[entry({
            alternatives: ['Neurotrauma Russian Fix'],
        })]} />);

        expect(screen.getByText(/Any one of these does the job instead/)).toBeInTheDocument();
    });

    it('says nothing is missing when nothing is', () => {
        render(<MissingMods missing={[]} />);

        expect(screen.getByText('Nothing is missing.')).toBeInTheDocument();
    });

    it('cannot offer a mod the Workshop does not have', () => {
        render(<MissingMods missing={[entry({ externalId: null })]} onAdd={vi.fn()} />);

        expect(screen.getByText(/Not published on the Workshop/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add to collection' })).not.toBeInTheDocument();
    });

    it('hands the whole entry back when somebody adds it', async () => {
        const onAdd = vi.fn();
        const user = userEvent.setup();
        render(<MissingMods missing={[entry()]} onAdd={onAdd} />);

        await user.click(screen.getByRole('button', { name: 'Add to collection' }));

        expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Neurotrauma' }));
    });
});
