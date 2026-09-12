import { describe, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({
    API_BASE: 'http://localhost:8080/api/v1',
    normalizePagedResponse: vi.fn(),
    request: vi.fn(),
}));

import { normalizeCreatureRender } from './encyclopedia';

function asset(url) {
    return {
        public_url: url,
        file_hash: 'sha256',
        mime_type: 'image/png',
        width: 32,
        height: 24,
    };
}

describe('normalizeCreatureRender', () => {
    it('normalizes mixed-case anatomy payloads and sorts limbs by draw order', () => {
        const result = normalizeCreatureRender({
            render_hash: 'render-1',
            renderer_version: '1.0',
            pose_key: 'canonical_neutral',
            source_version: '1.13.4.0',
            canvas: { width: 120, height: 80 },
            fallback_composite: asset('https://cdn.test/composite.png'),
            hitMap: asset('https://cdn.test/hitmap.png'),
            warnings: ['runtime deformation omitted'],
            limbs: [
                {
                    limb_key: 'head',
                    ragdoll_limb_id: 1,
                    name: 'Head',
                    z_index: 5,
                    hit_color: '#00aa22',
                    bounds: { x: 10, y: 4, width: 20, height: 18 },
                    image: asset('https://cdn.test/head.png'),
                    health_index: 2,
                    mapping_status: 'HEALTH_INDEX',
                    damage_modifiers: [{ affliction_type: 'damage', multiplier: 0.75 }],
                },
                {
                    limbKey: 'torso',
                    ragdollLimbId: 0,
                    name: 'Torso',
                    zIndex: 1,
                    hitColor: '#112233',
                    bounds: { x: 0, y: 0, width: 40, height: 32 },
                    image: asset('https://cdn.test/torso.png'),
                    mappingStatus: 'EXACT_NAME',
                    damageModifiers: [],
                },
            ],
        });

        expect(result.renderHash).toBe('render-1');
        expect(result.fallbackComposite.publicUrl).toBe('https://cdn.test/composite.png');
        expect(result.hitMap.publicUrl).toBe('https://cdn.test/hitmap.png');
        expect(result.limbs.map((limb) => limb.limbKey)).toEqual(['torso', 'head']);
        expect(result.limbs[1]).toMatchObject({
            healthIndex: 2,
            hitColor: '#00AA22',
            mappingStatus: 'HEALTH_INDEX',
        });
        expect(result.limbs[1].damageModifiers[0]).toMatchObject({
            afflictionType: 'damage',
            multiplier: 0.75,
        });
    });

    it('rejects incomplete payloads instead of mounting a broken viewer', () => {
        expect(normalizeCreatureRender({ canvas: { width: 100, height: 100 }, limbs: [] })).toBeNull();
        expect(normalizeCreatureRender({
            canvas: { width: 0, height: 100 },
            fallbackComposite: asset('/composite.png'),
            hitMap: asset('/hitmap.png'),
            limbs: [{}],
        })).toBeNull();
    });
});
