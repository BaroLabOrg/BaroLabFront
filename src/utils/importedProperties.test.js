import { describe, expect, it } from 'vitest';
import { groupProperties, splitImportedProperties } from './importedProperties';

function prop(propertyKey, propertyValue, valueType, origin = 'IMPORTED') {
    return { propertyKey, propertyValue, valueType, origin };
}

describe('splitImportedProperties', () => {
    it('always hides internal meta keys', () => {
        const { visible, hidden } = splitImportedProperties([
            prop('_explicitly_set', '["name"]', 'JSON'),
            prop('raw_attrs', '{}', 'JSON'),
            prop('type_specific_children', '[]', 'JSON'),
            prop('name', 'Wrench', 'TEXT'),
        ]);

        expect(visible.map((p) => p.propertyKey)).toEqual(['name']);
        expect(hidden.map((p) => p.propertyKey)).toEqual(
            expect.arrayContaining(['_explicitly_set', 'raw_attrs', 'type_specific_children']),
        );
    });

    it('hides schema-default scalars that were never explicitly authored', () => {
        const { visible, hidden } = splitImportedProperties([
            prop('_explicitly_set', '["fireproof"]', 'JSON'),
            prop('fireproof', 'false', 'BOOLEAN'),
            prop('is_container', 'false', 'BOOLEAN'),
            prop('waterproof', 'false', 'BOOLEAN'),
            prop('base_price', '85.0', 'NUMBER'),
        ]);

        expect(visible.map((p) => p.propertyKey)).toEqual(
            expect.arrayContaining(['fireproof', 'base_price']),
        );
        expect(hidden.map((p) => p.propertyKey)).toEqual(
            expect.arrayContaining(['is_container', 'waterproof']),
        );
    });

    it('hides JSON properties that are empty of real content', () => {
        const { visible, hidden } = splitImportedProperties([
            prop('effect_on_failure', '{"causes_afflictions": [], "conditionals": []}', 'JSON'),
            prop('status_effects', '[{"action_type": "OnWearing"}]', 'JSON'),
        ]);

        expect(visible.map((p) => p.propertyKey)).toEqual(['status_effects']);
        expect(hidden.map((p) => p.propertyKey)).toEqual(['effect_on_failure']);
    });

    it('does not filter scalars for entity types without an explicit-set marker', () => {
        const { visible, hidden } = splitImportedProperties([
            prop('can_speak', 'false', 'BOOLEAN'),
            prop('humanoid', 'false', 'BOOLEAN'),
            prop('vitality', '500', 'NUMBER'),
        ]);

        expect(hidden).toEqual([]);
        expect(visible).toHaveLength(3);
    });

    it('handles a missing/undefined property list', () => {
        expect(splitImportedProperties(undefined)).toEqual({ visible: [], hidden: [] });
    });
});

describe('groupProperties', () => {
    it('groups properties sharing a prefix before the first underscore', () => {
        const groups = groupProperties([
            prop('icon_texture', 'a.png', 'TEXT'),
            prop('icon_sourcerect', '0,0,1,1', 'TEXT'),
            prop('fabricate_time', '30.0', 'NUMBER'),
            prop('fabricate_traitor_only', 'false', 'BOOLEAN'),
        ]);

        const names = groups.map((g) => g.name);
        expect(names).toEqual(expect.arrayContaining(['icon', 'fabricate']));
        expect(groups.find((g) => g.name === 'icon').items).toHaveLength(2);
    });

    it('folds single-member groups into "other"', () => {
        const groups = groupProperties([
            prop('category', 'Equipment', 'TEXT'),
            prop('tags', '["smallitem"]', 'JSON'),
        ]);

        expect(groups).toEqual([{ name: 'other', items: expect.any(Array) }]);
        expect(groups[0].items).toHaveLength(2);
    });
});
