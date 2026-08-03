import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PropertyFieldList } from './PropertyValue';

describe('PropertyFieldList', () => {
    it('renders top-level and nested fields through the same grid pattern', () => {
        render(
            <PropertyFieldList
                entries={[
                    ['deconstruct_time', '1.0'],
                    ['status_effects', [{ action_type: 'Always', target: 'This' }]],
                ]}
            />,
        );

        const grids = document.querySelectorAll('.property-field-grid');
        // one grid for the top-level entries, one for the nested status effect
        expect(grids).toHaveLength(2);
        expect(screen.getByText('Deconstruct Time')).toBeInTheDocument();
        expect(screen.getByText('1.0')).toBeInTheDocument();
        expect(screen.getByText('Action Type')).toBeInTheDocument();
        expect(screen.getByText('Always')).toBeInTheDocument();
    });

    it('marks nested object/array values with a visible nesting block', () => {
        render(
            <PropertyFieldList
                entries={[['status_effects', [{ action_type: 'OnUse' }, { action_type: 'OnContained' }]]]}
            />,
        );

        expect(document.querySelectorAll('.property-nested-block')).toHaveLength(2);
    });

    it('collapses a primitive array to a comma-separated value', () => {
        render(<PropertyFieldList entries={[['tags', ['smallitem', 'tool', 'signal']]]} />);
        expect(screen.getByText('smallitem, tool, signal')).toBeInTheDocument();
    });

    it('renders path/file-like values monospace with a title attribute', () => {
        render(
            <PropertyFieldList
                entries={[['icon_texture', '%ModDir%/Items/Containers/ekutility_labels_fixed.png']]}
            />,
        );

        const value = screen.getByText('%ModDir%/Items/Containers/ekutility_labels_fixed.png');
        expect(value).toHaveClass('property-value-path');
        expect(value).toHaveAttribute('title', '%ModDir%/Items/Containers/ekutility_labels_fixed.png');
    });

    it('does not treat plain text values as paths', () => {
        render(<PropertyFieldList entries={[['category', 'Equipment']]} />);
        const value = screen.getByText('Equipment');
        expect(value).toHaveClass('property-value-text');
    });
});
