import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import JsonValue from './JsonValue';

describe('JsonValue', () => {
    it('renders a primitive array as a comma-separated list', () => {
        render(<JsonValue value={['smallitem', 'tool', 'signal']} />);
        expect(screen.getByText('smallitem, tool, signal')).toBeInTheDocument();
    });

    it('renders an object as humanized label/value rows', () => {
        render(<JsonValue value={{ action_type: 'OnUse', target: 'This' }} />);
        expect(screen.getByText('Action Type')).toBeInTheDocument();
        expect(screen.getByText('OnUse')).toBeInTheDocument();
        expect(screen.getByText('Target')).toBeInTheDocument();
        expect(screen.getByText('This')).toBeInTheDocument();
    });

    it('renders an array of objects as a nested indented list', () => {
        render(
            <JsonValue
                value={[
                    { action_type: 'OnUse' },
                    { action_type: 'OnContained' },
                ]}
            />,
        );

        const list = document.querySelector('.json-value-list');
        expect(list).toBeInTheDocument();
        expect(list.querySelectorAll('li')).toHaveLength(2);
        expect(screen.getByText('OnUse')).toBeInTheDocument();
        expect(screen.getByText('OnContained')).toBeInTheDocument();
    });

    it('renders a plain value as text', () => {
        render(<JsonValue value="This" />);
        expect(screen.getByText('This')).toBeInTheDocument();
    });
});
