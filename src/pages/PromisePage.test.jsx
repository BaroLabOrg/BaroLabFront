import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PromisePage from './PromisePage';

const quest = vi.hoisted(() => ({ resetQuest: vi.fn(), closeTerminal: vi.fn() }));
vi.mock('../context/QuestContext', () => ({ useQuest: () => quest }));

function renderEnding() {
    return render(<MemoryRouter initialEntries={['/promise']}><Routes>
        <Route path="/promise" element={<PromisePage />} />
        <Route path="/" element={<h1>Home</h1>} />
    </Routes></MemoryRouter>);
}

describe('Promise ending', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.stubGlobal('matchMedia', () => ({ matches: false }));
    });
    afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

    it('closes the terminal, plays the sequence, and resets only when waking', () => {
        renderEnding();
        expect(quest.closeTerminal).toHaveBeenCalledOnce();
        expect(screen.getByRole('region', { name: 'Загрузка терминала' })).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(3000));
        expect(screen.getByRole('status')).toHaveTextContent('ACHTUNG');
        act(() => vi.advanceTimersByTime(1300));
        expect(screen.getByRole('heading', { name: 'REMEMBER OUR PROMISE.' })).toHaveFocus();
        expect(quest.resetQuest).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Wake up and return to main page' }));
        act(() => vi.advanceTimersByTime(900));
        expect(quest.resetQuest).toHaveBeenCalledOnce();
        expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    });

    it('skips the interruption for reduced motion and cancels navigation when unmounted', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: true }));
        const { unmount } = renderEnding();
        expect(screen.getByRole('heading', { name: 'REMEMBER OUR PROMISE.' })).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Wake up and return to main page' }));
        unmount();
        act(() => vi.runAllTimers());
        expect(quest.resetQuest).not.toHaveBeenCalled();
    });

    it('does not start audio automatically and handles unsupported audio', () => {
        vi.stubGlobal('AudioContext', undefined);
        vi.stubGlobal('webkitAudioContext', undefined);
        renderEnding();
        const audio = screen.getByRole('button', { name: 'Фоновый звук' });
        expect(audio).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(audio);
        expect(audio).toBeDisabled();
        expect(audio).toHaveTextContent('ЗВУК НЕДОСТУПЕН');
    });
});
