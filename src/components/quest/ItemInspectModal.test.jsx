import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemInspectModal from './ItemInspectModal';

const quest = vi.hoisted(() => ({
    inspectingItem: 3,
    closeInspect: vi.fn(),
    resetQuest: vi.fn(),
}));

vi.mock('../../context/QuestContext', () => ({ useQuest: () => quest }));

describe('Item inspection', () => {
    it('reveals the code without hover and resets the side when another item opens', async () => {
        const user = userEvent.setup();
        quest.inspectingItem = 3;
        const { rerender } = render(<ItemInspectModal />);
        const flip = screen.getByRole('button', { name: 'Перевернуть предмет' });

        await user.click(flip);
        expect(flip).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('Protokoll: 512 Frequenz: 240.0. [ REMEMBER OUR PROMISE ]'))
            .toBeInTheDocument();

        await user.keyboard(' ');
        expect(flip).toHaveAttribute('aria-pressed', 'false');

        await user.keyboard('{Enter}');
        expect(flip).toHaveAttribute('aria-pressed', 'true');

        quest.inspectingItem = 1;
        rerender(<ItemInspectModal />);
        expect(flip).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByText('Protokoll: 512 Frequenz: 240.0. [ REMEMBER OUR PROMISE ]'))
            .not.toBeInTheDocument();
    });
});
