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

    it('recursively prunes noise inside a visible JSON blob (real status_effects example)', () => {
        const statusEffects = [{
            action_type: 'Always',
            afflictions: [],
            ai_triggers: [],
            condition_value: 0.01,
            conditionals: [{
                key: 'condition',
                negated: false,
                operator: 'gt',
                raw_attrs: { condition: 'gt 0.1' },
                raw_value: 'gt 0.1',
                value: '0.1',
            }],
            conditionals_summary: ['condition=gt 0.1'],
            delay: null,
            disable_delta_time: false,
            duration: null,
            explosion_emp: null,
            explosion_range: null,
            gives_skills: [],
            has_explosion: false,
            has_fire: false,
            has_remove_item: false,
            raw_attrs: {},
            reduce_afflictions: [],
            required_afflictions: [],
            required_items: [],
            set_value: true,
            spawns_characters: [],
            spawns_items: [],
            status_tags: [],
            target: 'This',
            triggers_talents: [],
        }];

        const { visible } = splitImportedProperties([
            prop('status_effects', JSON.stringify(statusEffects), 'JSON'),
        ]);

        expect(visible).toHaveLength(1);
        const cleaned = JSON.parse(visible[0].displayValue);
        expect(cleaned).toEqual([{
            action_type: 'Always',
            condition_value: 0.01,
            conditionals: [{
                key: 'condition',
                operator: 'gt',
                raw_attrs: { condition: 'gt 0.1' },
                raw_value: 'gt 0.1',
                value: '0.1',
            }],
            conditionals_summary: ['condition=gt 0.1'],
            set_value: true,
            target: 'This',
        }]);
    });

    it('hides a JSON property that becomes empty only after pruning noise', () => {
        const { visible, hidden } = splitImportedProperties([
            prop('container_settings', JSON.stringify({ auto_inject: false, capacity: null, tags: [] }), 'JSON'),
        ]);

        expect(visible).toEqual([]);
        expect(hidden.map((p) => p.propertyKey)).toEqual(['container_settings']);
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
