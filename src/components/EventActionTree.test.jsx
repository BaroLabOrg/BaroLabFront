import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventActionTree from './EventActionTree';

const NODES = [
    {
        tag: 'checkdataaction',
        attrs: { identifier: 'youngcultists_completed', condition: 'eq true' },
        children: [
            { tag: 'success', attrs: {}, children: [] },
            {
                tag: 'failure',
                attrs: {},
                children: [
                    {
                        tag: 'spawnaction',
                        attrs: { npcidentifier: 'huskcultist' },
                        children: [
                            { tag: 'conversationaction', attrs: { text: 'greeting' }, children: [] },
                        ],
                    },
                ],
            },
        ],
    },
];

describe('EventActionTree', () => {
    it('renders tag names as node labels and attributes as chips', () => {
        render(<EventActionTree nodes={NODES} />);

        expect(screen.getByText('Checkdataaction')).toBeInTheDocument();
        expect(screen.getByText('identifier')).toBeInTheDocument();
        expect(screen.getByText('youngcultists_completed')).toBeInTheDocument();
    });

    it('shows the child count and expands shallow branches by default', () => {
        render(<EventActionTree nodes={NODES} />);

        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Failure')).toBeInTheDocument();
    });

    it('collapses branches deeper than the auto-expand depth', () => {
        render(<EventActionTree nodes={NODES} />);

        // spawnaction (depth 2) renders, but starts collapsed, so its own
        // child stays hidden until asked for
        expect(screen.getByText('Spawnaction')).toBeInTheDocument();
        expect(screen.queryByText('Conversationaction')).not.toBeInTheDocument();
    });

    it('toggles a branch when its header is clicked', async () => {
        const user = userEvent.setup();
        render(<EventActionTree nodes={NODES} />);

        await user.click(screen.getByRole('button', { name: /Spawnaction/ }));
        expect(screen.getByText('Conversationaction')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Spawnaction/ }));
        expect(screen.queryByText('Conversationaction')).not.toBeInTheDocument();
    });

    it('renders nothing when there are no nodes', () => {
        const { container } = render(<EventActionTree nodes={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});
