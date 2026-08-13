import { describe, expect, it } from 'vitest';
import { groupRelations, relationLabel } from './relations';

function relation(overrides) {
    return {
        id: Math.random().toString(36).slice(2),
        slug: 'physicorium',
        title: 'Physicorium Bar',
        relationType: 'CRAFTED_FROM',
        direction: 'OUTGOING',
        origin: 'SYSTEM',
        ...overrides,
    };
}

describe('relationLabel', () => {
    it('reads the same type differently from each end', () => {
        expect(relationLabel('CRAFTED_FROM', 'OUTGOING')).toBe('Crafted from');
        expect(relationLabel('CRAFTED_FROM', 'INCOMING')).toBe('Used to craft');
    });

    it('labels every relation type the projection can produce', () => {
        const produced = [
            'CRAFTED_FROM', 'DECONSTRUCTS_INTO', 'UNLOCKS_RECIPE', 'VARIANT_OF', 'HOLDS',
            'SHIPPED_IN', 'CAUSES', 'TREATS', 'PROTECTS_FROM', 'REQUIRES_REPUTATION',
            'REWARDS_REPUTATION', 'AVAILABLE_AT', 'TRIGGERS_EVENT', 'FOUND_IN', 'SPAWNS',
            'CARRIES', 'ARMED_WITH', 'REPAIRED_WITH', 'GRANTS_TALENT',
        ];

        for (const relationType of produced) {
            for (const direction of ['OUTGOING', 'INCOMING']) {
                const label = relationLabel(relationType, direction);
                expect(label).not.toMatch(/_/);
                expect(label).not.toMatch(/\(incoming\)/);
            }
        }
    });

    it('falls back to a humanized type for unknown relations', () => {
        expect(relationLabel('SOME_NEW_TYPE', 'OUTGOING')).toBe('Some New Type');
        expect(relationLabel('SOME_NEW_TYPE', 'INCOMING')).toBe('Some New Type (incoming)');
    });
});

describe('groupRelations', () => {
    it('splits groups by type and direction', () => {
        const groups = groupRelations([
            relation({ slug: 'rubber', title: 'Rubber' }),
            relation({ slug: 'steel', title: 'Steel' }),
            relation({ slug: 'assault-rifle', title: 'Assault Rifle', direction: 'INCOMING' }),
        ]);

        expect(groups).toHaveLength(2);
        expect(groups[0].label).toBe('Crafted from');
        expect(groups[0].entries.map((entry) => entry.title)).toEqual(['Rubber', 'Steel']);
        expect(groups[1].label).toBe('Used to craft');
    });

    it('orders the biggest group first', () => {
        const groups = groupRelations([
            relation({ slug: 'husk', title: 'Husk', relationType: 'CAUSES' }),
            relation({ slug: 'rubber', title: 'Rubber' }),
            relation({ slug: 'steel', title: 'Steel' }),
        ]);

        expect(groups[0].label).toBe('Crafted from');
        expect(groups[0].entries).toHaveLength(2);
        expect(groups[1].label).toBe('Causes');
    });

    it('drops duplicates and entries that cannot be linked', () => {
        const groups = groupRelations([
            relation({ slug: 'rubber', title: 'Rubber' }),
            relation({ slug: 'rubber', title: 'Rubber' }),
            relation({ slug: null, title: 'Missing target' }),
        ]);

        expect(groups).toHaveLength(1);
        expect(groups[0].entries).toHaveLength(1);
    });

    it('hides outgoing crafting relations when the crafting section shows them', () => {
        const groups = groupRelations([
            relation({ slug: 'rubber', title: 'Rubber' }),
            relation({ slug: 'scrap', title: 'Scrap', relationType: 'DECONSTRUCTS_INTO' }),
            relation({ slug: 'assault-rifle', title: 'Assault Rifle', direction: 'INCOMING' }),
        ], { hasCraftingSection: true });

        expect(groups.map((group) => group.label)).toEqual(['Used to craft']);
    });

    it('keeps them when there is no crafting section to show them in', () => {
        const groups = groupRelations([relation({ slug: 'rubber', title: 'Rubber' })]);
        expect(groups.map((group) => group.label)).toEqual(['Crafted from']);
    });
});
