import { normalizePagedResponse, request } from './api';

export const SUBMARINE_CLASS_VALUES = [
    'TRANSPORT',
    'ATTACK',
    'SCOUT',
    'DEEP_DIVER',
    'SUPPORT',
    'OTHER',
];

export const FABRICATION_TYPE_VALUES = [
    'DEFAULT',
    'DECONSTRUCTOR_ONLY',
    'SPECIAL',
    'OTHER',
];

export const TURRET_WEAPON_VALUES = [
    'COILGUN',
    'CHAIN_GUN',
    'PULSE_LASER',
];

export const LARGE_TURRET_WEAPON_VALUES = [
    'RAILGUN',
    'DOUBLE_COILGUN',
    'FLAK_CANNON',
];

export const SUBMARINE_SEARCH_SORT_OPTIONS = [
    'createdAt',
    'created_at',
    'updatedAt',
    'updated_at',
    'title',
    'submarineClass',
    'submarine_class',
    'tier',
    'price',
    'recommendedCrewMin',
    'recommended_crew_min',
    'recommendedCrewMax',
    'recommended_crew_max',
    'cargoCapacity',
    'cargo_capacity',
    'maxHorizontalSpeedKph',
    'max_horizontal_speed_kph',
    'turretSlotCount',
    'turret_slot_count',
    'largeTurretSlotCount',
    'large_turret_slot_count',
    'lengthMeters',
    'length_meters',
    'heightMeters',
    'height_meters',
    'maxDescentSpeedKph',
    'max_descent_speed_kph',
    'maxReactorOutputKw',
    'max_reactor_output_kw',
    'fabricationType',
    'fabrication_type',
];

function firstDefined(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null) {
            return value;
        }
    }
    return undefined;
}

function normalizeTag(tag) {
    if (!tag || typeof tag !== 'object') return null;
    return {
        ...tag,
        id: firstDefined(tag.id),
        name: firstDefined(tag.name),
        slug: firstDefined(tag.slug),
        createdAt: firstDefined(tag.createdAt, tag.created_at),
        usageCount: firstDefined(tag.usageCount, tag.usage_count),
    };
}

export function normalizeSubmarine(submarine) {
    if (!submarine || typeof submarine !== 'object') return null;

    const status = firstDefined(submarine.status);
    const recommendedCrewMin = firstDefined(submarine.recommendedCrewMin, submarine.recommended_crew_min);
    const recommendedCrewMax = firstDefined(submarine.recommendedCrewMax, submarine.recommended_crew_max);

    return {
        ...submarine,
        id: firstDefined(submarine.id),
        externalId: firstDefined(submarine.externalId, submarine.external_id),
        title: firstDefined(submarine.title),
        description: firstDefined(submarine.description),
        userId: firstDefined(submarine.userId, submarine.user_id),
        authorUsername: firstDefined(
            submarine.authorUsername,
            submarine.author_username,
            submarine.author?.username,
        ),
        active: firstDefined(submarine.active, status ? status === 'ACTIVE' : undefined),
        blocked: firstDefined(submarine.blocked, status ? status === 'BLOCKED' : undefined),
        createdAt: firstDefined(submarine.createdAt, submarine.created_at),
        updatedAt: firstDefined(submarine.updatedAt, submarine.updated_at),
        submarineClass: firstDefined(submarine.submarineClass, submarine.submarine_class),
        tier: firstDefined(submarine.tier),
        price: firstDefined(submarine.price),
        recommendedCrewMin,
        recommendedCrewMax,
        recommendedCrewDisplay: firstDefined(
            submarine.recommendedCrewDisplay,
            submarine.recommended_crew_display,
            recommendedCrewMin !== undefined && recommendedCrewMax !== undefined
                ? `${recommendedCrewMin} - ${recommendedCrewMax}`
                : undefined,
        ),
        cargoCapacity: firstDefined(submarine.cargoCapacity, submarine.cargo_capacity),
        maxHorizontalSpeedKph: firstDefined(submarine.maxHorizontalSpeedKph, submarine.max_horizontal_speed_kph),
        turretSlotCount: firstDefined(submarine.turretSlotCount, submarine.turret_slot_count),
        largeTurretSlotCount: firstDefined(submarine.largeTurretSlotCount, submarine.large_turret_slot_count),
        lengthMeters: firstDefined(submarine.lengthMeters, submarine.length_meters),
        heightMeters: firstDefined(submarine.heightMeters, submarine.height_meters),
        maxDescentSpeedKph: firstDefined(submarine.maxDescentSpeedKph, submarine.max_descent_speed_kph),
        maxReactorOutputKw: firstDefined(submarine.maxReactorOutputKw, submarine.max_reactor_output_kw),
        fabricationType: firstDefined(submarine.fabricationType, submarine.fabrication_type),
        defaultTurretWeapons: Array.isArray(firstDefined(submarine.defaultTurretWeapons, submarine.default_turret_weapons))
            ? [...firstDefined(submarine.defaultTurretWeapons, submarine.default_turret_weapons)]
            : [],
        defaultLargeTurretWeapons: Array.isArray(
            firstDefined(submarine.defaultLargeTurretWeapons, submarine.default_large_turret_weapons),
        )
            ? [...firstDefined(submarine.defaultLargeTurretWeapons, submarine.default_large_turret_weapons)]
            : [],
        tags: Array.isArray(submarine.tags) ? submarine.tags.map(normalizeTag).filter(Boolean) : [],
    };
}

function normalizeSubmarinePage(response) {
    const normalized = normalizePagedResponse(response);
    return {
        ...normalized,
        items: normalized.items.map(normalizeSubmarine).filter(Boolean),
    };
}

function normalizeTagQuery(tags) {
    if (Array.isArray(tags)) {
        return tags
            .map((tag) => String(tag || '').trim())
            .filter(Boolean)
            .join(',');
    }
    return String(tags || '').trim();
}

function cleanUndefined(payload) {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
    );
}

export async function getSubmarines({
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    direction = 'desc',
} = {}) {
    const response = await request('/api/submarines', {
        query: { page, size, sortBy, direction },
    });
    return normalizeSubmarinePage(response);
}

export async function searchSubmarines({
    q = '',
    submarineClass,
    tier,
    priceMin,
    priceMax,
    recommendedCrewMin,
    recommendedCrewMax,
    cargoCapacityMin,
    cargoCapacityMax,
    maxHorizontalSpeedKphMin,
    maxHorizontalSpeedKphMax,
    turretSlotCount,
    largeTurretSlotCount,
    lengthMetersMin,
    lengthMetersMax,
    heightMetersMin,
    heightMetersMax,
    maxDescentSpeedKphMin,
    maxDescentSpeedKphMax,
    maxReactorOutputKwMin,
    maxReactorOutputKwMax,
    fabricationType,
    tags = [],
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    direction = 'desc',
} = {}) {
    const response = await request('/search/submarines', {
        query: {
            q: String(q || '').trim(),
            submarineClass,
            tier,
            priceMin,
            priceMax,
            recommendedCrewMin,
            recommendedCrewMax,
            cargoCapacityMin,
            cargoCapacityMax,
            maxHorizontalSpeedKphMin,
            maxHorizontalSpeedKphMax,
            turretSlotCount,
            largeTurretSlotCount,
            lengthMetersMin,
            lengthMetersMax,
            heightMetersMin,
            heightMetersMax,
            maxDescentSpeedKphMin,
            maxDescentSpeedKphMax,
            maxReactorOutputKwMin,
            maxReactorOutputKwMax,
            fabricationType,
            tags: normalizeTagQuery(tags),
            page,
            size,
            sortBy,
            direction,
        },
    });
    return normalizeSubmarinePage(response);
}

export async function getSubmarine(externalId) {
    const response = await request(`/api/submarines/${externalId}`);
    return normalizeSubmarine(response);
}

export async function createSubmarine(payload) {
    const response = await request('/api/submarines', {
        method: 'POST',
        body: cleanUndefined({
            title: payload.title,
            description: payload.description,
            submarine_class: payload.submarineClass,
            tier: payload.tier,
            price: payload.price,
            recommended_crew_min: payload.recommendedCrewMin,
            recommended_crew_max: payload.recommendedCrewMax,
            cargo_capacity: payload.cargoCapacity,
            max_horizontal_speed_kph: payload.maxHorizontalSpeedKph,
            turret_slot_count: payload.turretSlotCount,
            large_turret_slot_count: payload.largeTurretSlotCount,
            length_meters: payload.lengthMeters,
            height_meters: payload.heightMeters,
            max_descent_speed_kph: payload.maxDescentSpeedKph,
            max_reactor_output_kw: payload.maxReactorOutputKw,
            fabrication_type: payload.fabricationType,
            default_turret_weapons: payload.defaultTurretWeapons,
            default_large_turret_weapons: payload.defaultLargeTurretWeapons,
        }),
    });
    return normalizeSubmarine(response);
}
