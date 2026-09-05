import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ItemInspectModal from './ItemInspectModal';

const quest = vi.hoisted(() => ({
    inspectingItem: 3,
    closeInspect: vi.fn(),
    resetQuest: vi.fn(),
    openInspect: vi.fn(),
    stage: 3,
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
        expect(screen.getByText('Protokoll: 512 Frequenz: 240.0', { selector: 'p' })).toBeInTheDocument();

        await user.keyboard(' ');
        expect(flip).toHaveAttribute('aria-pressed', 'false');

        await user.keyboard('{Enter}');
        expect(flip).toHaveAttribute('aria-pressed', 'true');

        quest.inspectingItem = 1;
        rerender(<ItemInspectModal />);
        expect(screen.getByRole('button', { name: 'Перевернуть предмет' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByText('Protokoll: 512 Frequenz: 240.0', { selector: 'p' }))
            .not.toBeInTheDocument();
    });

    it('never flips from mouse movement, hover, or clicking the artwork', async () => {
        const user = userEvent.setup();
        quest.inspectingItem = 3;
        render(<ItemInspectModal />);
        const viewer = screen.getByTestId('item-viewer');
        const flip = screen.getByRole('button', { name: 'Перевернуть предмет' });
        fireEvent.mouseMove(viewer, { clientX: 999, clientY: 100 });
        await user.click(viewer);
        expect(flip).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByText('Protokoll: 512 Frequenz: 240.0', { selector: 'p' })).not.toBeInTheDocument();
        await user.click(flip);
        fireEvent.mouseMove(viewer, { clientX: 0, clientY: 0 });
        fireEvent.mouseLeave(viewer);
        expect(flip).toHaveAttribute('aria-pressed', 'true');
    });

    it('keeps keyboard focus in the inspection and prevents opening missing items', async () => {
        const user = userEvent.setup();
        quest.inspectingItem = 1;
        quest.stage = 1;
        render(<ItemInspectModal />);
        const close = screen.getByRole('button', { name: 'Close' });
        expect(close).toHaveFocus();
        expect(screen.getAllByRole('button', { name: 'Предмет не найден' })).toHaveLength(2);
        screen.getAllByRole('button', { name: 'Предмет не найден' }).forEach(button => expect(button).toBeDisabled());
        await user.tab({ shift: true });
        expect(screen.getByRole('button', { name: 'Осмотреть: ПРОПУСК АДМИНИСТРАТОРА' })).toHaveFocus();
        await user.tab();
        expect(close).toHaveFocus();
        await user.keyboard('{Escape}');
        expect(quest.closeInspect).toHaveBeenCalled();
        quest.stage = 3;
    });
});
