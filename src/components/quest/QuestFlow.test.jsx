import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { QuestProvider } from '../../context/QuestContext';
import Pagination from '../Pagination';
import Footer from '../Footer';
import NotFoundPage from '../../pages/NotFoundPage';
import QuestInventory from './QuestInventory';
import ItemInspectModal from './ItemInspectModal';
import QuestTerminal from './QuestTerminal';

function renderQuest(path = '/mods') {
    return render(<MemoryRouter initialEntries={[path]}><QuestProvider>
        <QuestInventory />
        <ItemInspectModal />
        <QuestTerminal />
        <Routes>
            <Route path="/mods" element={<>
                <Pagination totalPages={2} onPageChange={() => {}} />
                <Link to="/404">Follow sector 404</Link>
            </>} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/" element={<Footer />} />
        </Routes>
    </QuestProvider></MemoryRouter>);
}

describe('Quest discovery order', () => {
    beforeEach(() => {
        const values = new Map();
        vi.stubGlobal('localStorage', {
            getItem: key => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, String(value)),
            removeItem: key => values.delete(key),
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('traces the radio to the pass, uses archive access, then reveals the book codes', async () => {
        const user = userEvent.setup();
        renderQuest();
        await user.click(screen.getByRole('button', { name: 'Back (anomaly detected)' }));
        await user.click(screen.getByRole('button', { name: 'TRACE SIGNAL' }));
        expect(screen.getByRole('heading', { name: 'RADIO RECEIVER' })).toBeInTheDocument();
        expect(screen.getByText(/39486 60170 24326 01064/)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Item not found' })).toHaveLength(2);
        await user.click(screen.getByRole('button', { name: 'Flip item' }));
        expect(screen.getByText('SEKTOR 404', { selector: 'p' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Close', exact: true }));
        await user.click(screen.getByRole('link', { name: 'Follow sector 404' }));
        await user.click(screen.getByRole('button', { name: "Recover administrator's pass" }));
        expect(screen.getByRole('heading', { name: 'ADMINISTRATOR’S PASS' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Flip item' }));
        expect(screen.getByText('ARCHIV HOME / BUILD RECORD', { selector: 'p' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Close', exact: true }));
        await user.click(screen.getByRole('link', { name: /Return to Base/ }));
        const archive = screen.getByRole('button', { name: 'Open archive record' });
        archive.focus();
        await user.keyboard('{Enter}');
        expect(screen.getByRole('heading', { name: 'THE KING IN YELLOW' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Flip item' }));
        expect(screen.getByText('Protokoll: 512 Frequenz: 240.0', { selector: 'p' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Close', exact: true }));
        await user.click(screen.getByText('INV', { exact: true }));
        expect(screen.getByRole('dialog', { name: 'Final terminal' })).toBeInTheDocument();
        expect(localStorage.getItem('signalis_quest_stage')).toBe('3');
    });

    it('resumes an existing stage-one save with a radio and keeps archive access locked', async () => {
        localStorage.setItem('signalis_quest_stage', '1');
        const user = userEvent.setup();
        renderQuest('/');
        expect(screen.queryByRole('button', { name: 'Open archive record' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Item 2' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Item 1' }));
        expect(screen.getByRole('heading', { name: 'RADIO RECEIVER' })).toBeInTheDocument();
        expect(localStorage.getItem('signalis_quest_stage')).toBe('1');
    });
});
