import { API_BASE, normalizePagedResponse, request } from './api';

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

function normalizeStringArray(values) {
    if (!Array.isArray(values)) return [];
    return values
        .map((value) => String(value || '').trim())
        .filter(Boolean);
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
    const externalId = firstDefined(submarine.external_id, submarine.externalId);
    const userId = firstDefined(submarine.user_id, submarine.userId);
    const authorUsername = firstDefined(
        submarine.author_username,
        submarine.authorUsername,
        submarine.author?.username,
    );
    const createdAt = firstDefined(submarine.created_at, submarine.createdAt);
    const updatedAt = firstDefined(submarine.updated_at, submarine.updatedAt);
    const submarineClass = firstDefined(submarine.submarine_class, submarine.submarineClass);
    const mainImage = firstDefined(submarine.main_image, submarine.mainImage);
    const additionalImages = normalizeStringArray(
        firstDefined(submarine.additional_images, submarine.additionalImages),
    );
    const recommendedCrewMin = firstDefined(submarine.recommendedCrewMin, submarine.recommended_crew_min);
    const recommendedCrewMax = firstDefined(submarine.recommendedCrewMax, submarine.recommended_crew_max);
    const recommendedCrewDisplay = firstDefined(
        submarine.recommendedCrewDisplay,
        submarine.recommended_crew_display,
        recommendedCrewMin !== undefined && recommendedCrewMax !== undefined
            ? `${recommendedCrewMin} - ${recommendedCrewMax}`
            : undefined,
    );
    const cargoCapacity = firstDefined(submarine.cargoCapacity, submarine.cargo_capacity);
    const maxHorizontalSpeedKph = firstDefined(submarine.maxHorizontalSpeedKph, submarine.max_horizontal_speed_kph);
    const turretSlotCount = firstDefined(submarine.turretSlotCount, submarine.turret_slot_count);
    const largeTurretSlotCount = firstDefined(submarine.largeTurretSlotCount, submarine.large_turret_slot_count);
    const lengthMeters = firstDefined(submarine.lengthMeters, submarine.length_meters);
    const heightMeters = firstDefined(submarine.heightMeters, submarine.height_meters);
    const maxDescentSpeedKph = firstDefined(submarine.maxDescentSpeedKph, submarine.max_descent_speed_kph);
    const maxReactorOutputKw = firstDefined(submarine.maxReactorOutputKw, submarine.max_reactor_output_kw);
    const fabricationType = firstDefined(submarine.fabricationType, submarine.fabrication_type);
    const defaultTurretWeapons = normalizeStringArray(
        firstDefined(submarine.defaultTurretWeapons, submarine.default_turret_weapons),
    );
    const defaultLargeTurretWeapons = normalizeStringArray(
        firstDefined(submarine.defaultLargeTurretWeapons, submarine.default_large_turret_weapons),
    );

    return {
        ...submarine,
        id: firstDefined(submarine.id),
        external_id: externalId,
        externalId,
        title: firstDefined(submarine.title),
        description: firstDefined(submarine.description),
        main_image: mainImage,
        mainImage,
        additional_images: additionalImages,
        additionalImages,
        user_id: userId,
        userId,
        author_username: authorUsername,
        authorUsername,
        active: firstDefined(submarine.active, status ? status === 'ACTIVE' : undefined),
        blocked: firstDefined(submarine.blocked, status ? status === 'BLOCKED' : undefined),
        created_at: createdAt,
        createdAt,
        updated_at: updatedAt,
        updatedAt,
        submarine_class: submarineClass,
        submarineClass,
        tier: firstDefined(submarine.tier),
        price: firstDefined(submarine.price),
        recommended_crew_min: recommendedCrewMin,
        recommendedCrewMin,
        recommended_crew_max: recommendedCrewMax,
        recommendedCrewMax,
        recommended_crew_display: recommendedCrewDisplay,
        recommendedCrewDisplay,
        cargo_capacity: cargoCapacity,
        cargoCapacity,
        max_horizontal_speed_kph: maxHorizontalSpeedKph,
        maxHorizontalSpeedKph,
        turret_slot_count: turretSlotCount,
        turretSlotCount,
        large_turret_slot_count: largeTurretSlotCount,
        largeTurretSlotCount,
        length_meters: lengthMeters,
        lengthMeters,
        height_meters: heightMeters,
        heightMeters,
        max_descent_speed_kph: maxDescentSpeedKph,
        maxDescentSpeedKph,
        max_reactor_output_kw: maxReactorOutputKw,
        maxReactorOutputKw,
        fabrication_type: fabricationType,
        fabricationType,
        default_turret_weapons: defaultTurretWeapons,
        defaultTurretWeapons,
        default_large_turret_weapons: defaultLargeTurretWeapons,
        defaultLargeTurretWeapons,
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
    submarine_class,
    tier,
    priceMin,
    priceMax,
    price_min,
    price_max,
    recommendedCrewMin,
    recommendedCrewMax,
    recommended_crew_min,
    recommended_crew_max,
    cargoCapacityMin,
    cargoCapacityMax,
    cargo_capacity_min,
    cargo_capacity_max,
    maxHorizontalSpeedKphMin,
    maxHorizontalSpeedKphMax,
    max_horizontal_speed_kph_min,
    max_horizontal_speed_kph_max,
    turretSlotCount,
    largeTurretSlotCount,
    turret_slot_count,
    large_turret_slot_count,
    lengthMetersMin,
    lengthMetersMax,
    length_meters_min,
    length_meters_max,
    heightMetersMin,
    heightMetersMax,
    height_meters_min,
    height_meters_max,
    maxDescentSpeedKphMin,
    maxDescentSpeedKphMax,
    max_descent_speed_kph_min,
    max_descent_speed_kph_max,
    maxReactorOutputKwMin,
    maxReactorOutputKwMax,
    max_reactor_output_kw_min,
    max_reactor_output_kw_max,
    fabricationType,
    fabrication_type,
    tags = [],
    page = 0,
    size = 20,
    sortBy = 'createdAt',
    sort_by,
    direction = 'desc',
} = {}) {
    const response = await request('/search/submarines', {
        query: cleanUndefined({
            q: String(q || '').trim(),
            submarineClass: firstDefined(submarineClass, submarine_class),
            tier,
            priceMin: firstDefined(priceMin, price_min),
            priceMax: firstDefined(priceMax, price_max),
            recommendedCrewMin: firstDefined(recommendedCrewMin, recommended_crew_min),
            recommendedCrewMax: firstDefined(recommendedCrewMax, recommended_crew_max),
            cargoCapacityMin: firstDefined(cargoCapacityMin, cargo_capacity_min),
            cargoCapacityMax: firstDefined(cargoCapacityMax, cargo_capacity_max),
            maxHorizontalSpeedKphMin: firstDefined(maxHorizontalSpeedKphMin, max_horizontal_speed_kph_min),
            maxHorizontalSpeedKphMax: firstDefined(maxHorizontalSpeedKphMax, max_horizontal_speed_kph_max),
            turretSlotCount: firstDefined(turretSlotCount, turret_slot_count),
            largeTurretSlotCount: firstDefined(largeTurretSlotCount, large_turret_slot_count),
            lengthMetersMin: firstDefined(lengthMetersMin, length_meters_min),
            lengthMetersMax: firstDefined(lengthMetersMax, length_meters_max),
            heightMetersMin: firstDefined(heightMetersMin, height_meters_min),
            heightMetersMax: firstDefined(heightMetersMax, height_meters_max),
            maxDescentSpeedKphMin: firstDefined(maxDescentSpeedKphMin, max_descent_speed_kph_min),
            maxDescentSpeedKphMax: firstDefined(maxDescentSpeedKphMax, max_descent_speed_kph_max),
            maxReactorOutputKwMin: firstDefined(maxReactorOutputKwMin, max_reactor_output_kw_min),
            maxReactorOutputKwMax: firstDefined(maxReactorOutputKwMax, max_reactor_output_kw_max),
            fabricationType: firstDefined(fabricationType, fabrication_type),
            tags: normalizeTagQuery(tags),
            page,
            size,
            sortBy: firstDefined(sortBy, sort_by),
            direction,
        }),
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
            main_image: firstDefined(payload.main_image, payload.mainImage),
            additional_images: normalizeStringArray(
                firstDefined(payload.additional_images, payload.additionalImages),
            ),
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

export async function activateSubmarine(externalId) {
    const response = await request(`/api/submarines/${externalId}/activate`, {
        method: 'PATCH',
    });
    return normalizeSubmarine(response);
}

export async function blockSubmarine(externalId) {
    const response = await request(`/api/submarines/${externalId}/block`, {
        method: 'PATCH',
    });
    return normalizeSubmarine(response);
}

export async function addSubmarineTag(externalId, tagId) {
    return request(`/api/submarines/${externalId}/tags/${tagId}`, {
        method: 'POST',
    });
}

export async function removeSubmarineTag(externalId, tagId) {
    return request(`/api/submarines/${externalId}/tags/${tagId}`, {
        method: 'DELETE',
    });
}

export async function subscribeSubmarine(externalId) {
    const token = localStorage.getItem('barolab_token');
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}/api/submarines/${externalId}/transition`, {
        method: 'POST',
        headers,
        credentials: 'include',
        redirect: 'manual',
    });

    if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 0) {
        const location = res.headers.get('Location');
        if (location) {
            window.location.assign(location);
        } else {
            window.location.assign(`https://steamcommunity.com/sharedfiles/filedetails/?id=${externalId}`);
        }
        return;
    }

    if (res.status === 429) {
        throw new Error('You can do this once per hour. Please try again later.');
    }

    if (!res.ok) {
        let errorMsg = `Error ${res.status}`;
        try {
            const body = await res.json();
            errorMsg = body.message || errorMsg;
        } catch {
            // No-op: keep default status message.
        }
        throw new Error(errorMsg);
    }
}
