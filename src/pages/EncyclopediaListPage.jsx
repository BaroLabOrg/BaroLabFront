import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import { ENCYCLOPEDIA_ENTITY_TYPES, getEncyclopediaList, getEncyclopediaNavigation } from '../api/encyclopedia';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import './EncyclopediaListPage.css';

const PAGE_SIZE = 12;
const DEFAULT_SORT_BY = 'publishedAt';
const DEFAULT_DIRECTION = 'desc';
const MAX_PRIMARY_BLOCKS_PER_SECTION = 8;
const MAX_QUICK_LINKS_PER_SECTION = 10;
const SORT_OPTIONS = ['publishedAt', 'updatedAt', 'title'];
const DIRECTION_OPTIONS = ['desc', 'asc'];

const ENTITY_LABELS = {
    ITEM: 'Items',
    AFFLICTION: 'Afflictions',
    CHARACTER: 'Characters',
    FACTION: 'Factions',
    LOCATION: 'Locations',
    SUBMARINE: 'Submarines',
    CREATURE: 'Creatures',
    BIOME: 'Biomes',
    TALENT: 'Talents',
    JOB: 'Jobs',
    OTHER: 'Other',
};

const DEMO_TYPE_SECTIONS = [
    {
        key: 'ITEM',
        label: ENTITY_LABELS.ITEM,
        count: 42,
        primaryBlocks: [
            {
                key: 'Weaponry',
                label: 'Weaponry',
                count: 12,
                secondaryBlocks: [
                    { key: 'Firearms', label: 'Firearms', count: 4 },
                    { key: 'Melee', label: 'Melee', count: 2 },
                    { key: 'Ammunition', label: 'Ammunition', count: 3 },
                    { key: 'Explosives', label: 'Explosives', count: 1 },
                    { key: 'Turrets', label: 'Turrets', count: 1 },
                    { key: 'Turret Ammo', label: 'Turret Ammo', count: 1 },
                ],
            },
            {
                key: 'Medical',
                label: 'Medical',
                count: 7,
                secondaryBlocks: [
                    { key: 'Medicines', label: 'Medicines', count: 4 },
                    { key: 'Poisons', label: 'Poisons', count: 1 },
                    { key: 'Medical Tools', label: 'Medical Tools', count: 2 },
                ],
            },
            {
                key: 'Tools',
                label: 'Tools',
                count: 6,
                secondaryBlocks: [
                    { key: 'Standard Tools', label: 'Standard Tools', count: 3 },
                    { key: 'Scientific', label: 'Scientific', count: 2 },
                    { key: 'Consumables', label: 'Consumables', count: 1 },
                ],
            },
            {
                key: 'Equipment',
                label: 'Equipment',
                count: 7,
                secondaryBlocks: [
                    { key: 'Diving', label: 'Diving', count: 2 },
                    { key: 'Clothing', label: 'Clothing', count: 2 },
                    { key: 'Armor', label: 'Armor', count: 1 },
                    { key: 'Storage', label: 'Storage', count: 2 },
                ],
            },
            {
                key: 'Electrical & Logic',
                label: 'Electrical & Logic',
                count: 4,
                secondaryBlocks: [
                    { key: 'Wires', label: 'Wires', count: 1 },
                    { key: 'Logic', label: 'Logic', count: 2 },
                    { key: 'Power', label: 'Power', count: 1 },
                ],
            },
            {
                key: 'Materials',
                label: 'Materials',
                count: 4,
                secondaryBlocks: [
                    { key: 'Ores', label: 'Ores', count: 2 },
                    { key: 'Materials', label: 'Materials', count: 1 },
                    { key: 'Fuel', label: 'Fuel', count: 1 },
                ],
            },
            {
                key: 'Machines',
                label: 'Machines',
                count: 2,
                secondaryBlocks: [
                    { key: 'Fabricator', label: 'Fabricator', count: 1 },
                    { key: 'Deconstructor', label: 'Deconstructor', count: 1 },
                ],
            },
        ],
    },
    {
        key: 'AFFLICTION',
        label: ENTITY_LABELS.AFFLICTION,
        count: 19,
        primaryBlocks: [
            {
                key: 'Injuries',
                label: 'Травмы',
                count: 8,
                secondaryBlocks: [],
            },
            {
                key: 'Infections',
                label: 'Инфекции',
                count: 7,
                secondaryBlocks: [
                    { key: 'Husk', label: 'Husk', count: 3 },
                    { key: 'Parasitic', label: 'Паразитические', count: 4 },
                ],
            },
            {
                key: 'Psychological',
                label: 'Психологические',
                count: 4,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'CHARACTER',
        label: ENTITY_LABELS.CHARACTER,
        count: 14,
        primaryBlocks: [
            {
                key: 'Crew Characters',
                label: 'Экипаж',
                count: 5,
                secondaryBlocks: [],
            },
            {
                key: 'Neutral NPCs',
                label: 'Нейтральные NPC',
                count: 5,
                secondaryBlocks: [],
            },
            {
                key: 'Story Characters',
                label: 'Сюжетные',
                count: 4,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'FACTION',
        label: ENTITY_LABELS.FACTION,
        count: 9,
        primaryBlocks: [
            {
                key: 'Major Factions',
                label: 'Крупные фракции',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Local Groups',
                label: 'Локальные группы',
                count: 3,
                secondaryBlocks: [],
            },
            {
                key: 'Hostile Forces',
                label: 'Враждебные силы',
                count: 2,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'LOCATION',
        label: ENTITY_LABELS.LOCATION,
        count: 21,
        primaryBlocks: [
            {
                key: 'Outposts',
                label: 'Аванпосты',
                count: 8,
                secondaryBlocks: [
                    { key: 'City', label: 'Гражданские', count: 4 },
                    { key: 'Military', label: 'Военные', count: 4 },
                ],
            },
            {
                key: 'Ruins',
                label: 'Руины',
                count: 7,
                secondaryBlocks: [
                    { key: 'Alien', label: 'Инопланетные', count: 4 },
                    { key: 'Wreck', label: 'Обломки', count: 3 },
                ],
            },
            {
                key: 'Transit Points',
                label: 'Транзитные точки',
                count: 6,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'SUBMARINE',
        label: ENTITY_LABELS.SUBMARINE,
        count: 13,
        primaryBlocks: [
            {
                key: 'Transport',
                label: 'Транспортные',
                count: 5,
                secondaryBlocks: [],
            },
            {
                key: 'Attack',
                label: 'Атакующие',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Scout',
                label: 'Разведчики',
                count: 4,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'CREATURE',
        label: ENTITY_LABELS.CREATURE,
        count: 18,
        primaryBlocks: [
            {
                key: 'Monsters',
                label: 'Монстры',
                count: 11,
                secondaryBlocks: [
                    { key: 'Abyss', label: 'Бездна', count: 5 },
                    { key: 'Cave', label: 'Пещеры', count: 3 },
                    { key: 'Shallows', label: 'Мелководье', count: 3 },
                ],
            },
            {
                key: 'Humanoids',
                label: 'Гуманоиды',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Pets',
                label: 'Питомцы',
                count: 3,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'BIOME',
        label: ENTITY_LABELS.BIOME,
        count: 9,
        primaryBlocks: [
            {
                key: 'Shallow Regions',
                label: 'Верхние регионы',
                count: 3,
                secondaryBlocks: [],
            },
            {
                key: 'Middle Regions',
                label: 'Средние регионы',
                count: 3,
                secondaryBlocks: [],
            },
            {
                key: 'Abyss Regions',
                label: 'Глубинные регионы',
                count: 3,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'TALENT',
        label: ENTITY_LABELS.TALENT,
        count: 24,
        primaryBlocks: [
            {
                key: 'Captain Tree',
                label: 'Капитан',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Engineer Tree',
                label: 'Инженер',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Mechanic Tree',
                label: 'Механик',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Security Tree',
                label: 'Офицер безопасности',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Medical Tree',
                label: 'Врач',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Assistant Tree',
                label: 'Ассистент',
                count: 4,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'JOB',
        label: ENTITY_LABELS.JOB,
        count: 12,
        primaryBlocks: [
            {
                key: 'Crew Roles',
                label: 'Роли экипажа',
                count: 6,
                secondaryBlocks: [],
            },
            {
                key: 'Specializations',
                label: 'Специализации',
                count: 6,
                secondaryBlocks: [
                    { key: 'Medical', label: 'Медицинские', count: 2 },
                    { key: 'Engineering', label: 'Инженерные', count: 2 },
                    { key: 'Combat', label: 'Боевые', count: 2 },
                ],
            },
        ],
    },
    {
        key: 'OTHER',
        label: ENTITY_LABELS.OTHER,
        count: 11,
        primaryBlocks: [
            {
                key: 'Mechanics',
                label: 'Механики',
                count: 5,
                secondaryBlocks: [],
            },
            {
                key: 'UI & Symbols',
                label: 'UI и символы',
                count: 3,
                secondaryBlocks: [],
            },
            {
                key: 'Meta Systems',
                label: 'Системные темы',
                count: 3,
                secondaryBlocks: [],
            },
        ],
    },
];

const DEMO_ITEM_POOL = {
    'ITEM|Medical|Medicines': [
        {
            id: 'demo-item-med-1',
            slug: 'bandage',
            title: 'Bandage',
            entityType: 'ITEM',
            primaryCategory: 'Medical',
            secondaryCategory: 'Medicines',
            summary: 'Базовое средство для остановки кровотечения.',
            shortDescription: 'Базовое средство для остановки кровотечения.',
            primaryImageUrl: null,
        },
        {
            id: 'demo-item-med-2',
            slug: 'blood-pack',
            title: 'Blood Pack',
            entityType: 'ITEM',
            primaryCategory: 'Medical',
            secondaryCategory: 'Medicines',
            summary: 'Используется для переливания крови.',
            shortDescription: 'Используется для переливания крови.',
            primaryImageUrl: null,
        },
    ],
    'AFFLICTION|Infections|Husk': [
        {
            id: 'demo-affliction-husk-1',
            slug: 'husk-infection',
            title: 'Husk Infection',
            entityType: 'AFFLICTION',
            primaryCategory: 'Infections',
            secondaryCategory: 'Husk',
            summary: 'Постепенное заражение, требующее срочного лечения.',
            shortDescription: 'Постепенное заражение, требующее срочного лечения.',
            primaryImageUrl: null,
        },
    ],
    'LOCATION|Ruins|Alien': [
        {
            id: 'demo-location-ruins-1',
            slug: 'alien-ruins',
            title: 'Alien Ruins',
            entityType: 'LOCATION',
            primaryCategory: 'Ruins',
            secondaryCategory: 'Alien',
            summary: 'Опасные структуры с ценной добычей.',
            shortDescription: 'Опасные структуры с ценной добычей.',
            primaryImageUrl: null,
        },
    ],
    'SUBMARINE|Transport|': [
        {
            id: 'demo-submarine-transport-1',
            slug: 'orca',
            title: 'Orca',
            entityType: 'SUBMARINE',
            primaryCategory: 'Transport',
            secondaryCategory: '',
            summary: 'Универсальная подлодка для грузовых маршрутов.',
            shortDescription: 'Универсальная подлодка для грузовых маршрутов.',
            primaryImageUrl: null,
        },
    ],
    'CREATURE|Monsters|Abyss': [
        {
            id: 'demo-creature-abyss-1',
            slug: 'charybdis',
            title: 'Charybdis',
            entityType: 'CREATURE',
            primaryCategory: 'Monsters',
            secondaryCategory: 'Abyss',
            summary: 'Крупный хищник глубин.',
            shortDescription: 'Крупный хищник глубин.',
            primaryImageUrl: null,
        },
        {
            id: 'demo-creature-abyss-2',
            slug: 'endworm',
            title: 'Endworm',
            entityType: 'CREATURE',
            primaryCategory: 'Monsters',
            secondaryCategory: 'Abyss',
            summary: 'Опасный абиссальный червь.',
            shortDescription: 'Опасный абиссальный червь.',
            primaryImageUrl: null,
        },
    ],
    'TALENT|Captain Tree|': [
        {
            id: 'demo-talent-captain-1',
            slug: 'inspiring-presence',
            title: 'Inspiring Presence',
            entityType: 'TALENT',
            primaryCategory: 'Captain Tree',
            secondaryCategory: '',
            summary: 'Усиливает эффективность команды рядом с капитаном.',
            shortDescription: 'Усиливает эффективность команды рядом с капитаном.',
            primaryImageUrl: null,
        },
    ],
    'JOB|Crew Roles|': [
        {
            id: 'demo-job-role-1',
            slug: 'captain',
            title: 'Captain',
            entityType: 'JOB',
            primaryCategory: 'Crew Roles',
            secondaryCategory: '',
            summary: 'Координация экипажа и управление миссией.',
            shortDescription: 'Координация экипажа и управление миссией.',
            primaryImageUrl: null,
        },
        {
            id: 'demo-job-role-2',
            slug: 'medical-doctor',
            title: 'Medical Doctor',
            entityType: 'JOB',
            primaryCategory: 'Crew Roles',
            secondaryCategory: '',
            summary: 'Лечение экипажа и контроль аффликтов.',
            shortDescription: 'Лечение экипажа и контроль аффликтов.',
            primaryImageUrl: null,
        },
    ],
    'OTHER|Mechanics|': [
        {
            id: 'demo-other-mechanics-1',
            slug: 'reactor-management',
            title: 'Reactor Management',
            entityType: 'OTHER',
            primaryCategory: 'Mechanics',
            secondaryCategory: '',
            summary: 'Базовые принципы работы реактора и распределения нагрузки.',
            shortDescription: 'Базовые принципы работы реактора и распределения нагрузки.',
            primaryImageUrl: null,
        },
    ],
};

const ITEM_CANONICAL_PRIMARY_GROUPS = [
    {
        key: 'Weaponry',
        label: 'Weaponry',
        identities: new Set([
            'weaponry',
            'weapon',
            'weapons',
            'firearm',
            'firearms',
            'melee',
            'ammunition',
            'ammo',
            'explosive',
            'explosives',
            'turret',
            'turrets',
            'turret ammo',
            'turretammo',
        ]),
    },
    {
        key: 'Medical',
        label: 'Medical',
        identities: new Set([
            'medical',
            'medicine',
            'medicines',
            'poison',
            'poisons',
            'medical tool',
            'medical tools',
            'medicaltool',
            'medicaltools',
        ]),
    },
    {
        key: 'Tools',
        label: 'Tools',
        identities: new Set([
            'tool',
            'tools',
            'standard tool',
            'standard tools',
            'standardtool',
            'standardtools',
            'scientific',
            'consumable',
            'consumables',
        ]),
    },
    {
        key: 'Equipment',
        label: 'Equipment',
        identities: new Set([
            'equipment',
            'diving',
            'clothing',
            'armor',
            'storage',
        ]),
    },
    {
        key: 'Electrical & Logic',
        label: 'Electrical & Logic',
        identities: new Set([
            'electrical & logic',
            'electrical and logic',
            'electricallogic',
            'electrical',
            'logic',
            'wire',
            'wires',
            'power',
        ]),
    },
    {
        key: 'Materials',
        label: 'Materials',
        identities: new Set([
            'material',
            'materials',
            'ore',
            'ores',
            'fuel',
        ]),
    },
    {
        key: 'Machines',
        label: 'Machines',
        identities: new Set([
            'machine',
            'machines',
            'fabricator',
            'deconstructor',
            'medical fabricator',
            'medicalfabricator',
            'research station',
            'researchstation',
        ]),
    },
    {
        key: 'Other',
        label: 'Other',
        identities: new Set(['misc', 'decorative', 'wrecked', 'alien', 'legacy', 'hidden', 'thalamus']),
    },
];

const TECHNICAL_CATEGORY_IDENTITIES = new Set([
    'hidden',
    'legacy',
]);

const TECHNICAL_CATEGORY_PATTERNS = [
    /^tier[\s_-]*\d+$/i,
];

const NON_ITEM_PRIMARY_ALIAS_CONFIG = {
    AFFLICTION: {
        injury: 'Injuries',
        injuries: 'Injuries',
        infection: 'Infections',
        infections: 'Infections',
        psychological: 'Psychological',
    },
    CHARACTER: {
        crew: 'Crew Characters',
        'crew characters': 'Crew Characters',
        npc: 'Neutral NPCs',
        npcs: 'Neutral NPCs',
        neutral: 'Neutral NPCs',
        story: 'Story Characters',
        'story characters': 'Story Characters',
    },
    FACTION: {
        major: 'Major Factions',
        'major factions': 'Major Factions',
        local: 'Local Groups',
        'local groups': 'Local Groups',
        hostile: 'Hostile Forces',
        'hostile forces': 'Hostile Forces',
    },
    LOCATION: {
        outpost: 'Outposts',
        outposts: 'Outposts',
        ruin: 'Ruins',
        ruins: 'Ruins',
        transit: 'Transit Points',
        'transit points': 'Transit Points',
    },
    SUBMARINE: {
        transport: 'Transport',
        attack: 'Attack',
        scout: 'Scout',
    },
    CREATURE: {
        monster: 'Monsters',
        monsters: 'Monsters',
        humanoid: 'Humanoids',
        humanoids: 'Humanoids',
        pet: 'Pets',
        pets: 'Pets',
    },
    BIOME: {
        shallow: 'Shallow Regions',
        'shallow regions': 'Shallow Regions',
        middle: 'Middle Regions',
        'middle regions': 'Middle Regions',
        abyss: 'Abyss Regions',
        'abyss regions': 'Abyss Regions',
    },
    TALENT: {
        captain: 'Captain Tree',
        'captain tree': 'Captain Tree',
        captaintree: 'Captain Tree',
        engineer: 'Engineer Tree',
        'engineer tree': 'Engineer Tree',
        engineertree: 'Engineer Tree',
        mechanic: 'Mechanic Tree',
        'mechanic tree': 'Mechanic Tree',
        mechanictree: 'Mechanic Tree',
        security: 'Security Tree',
        'security tree': 'Security Tree',
        securitytree: 'Security Tree',
        'security officer': 'Security Tree',
        securityofficer: 'Security Tree',
        'security_officer': 'Security Tree',
        'security-officer': 'Security Tree',
        medical: 'Medical Tree',
        'medical tree': 'Medical Tree',
        medicaltree: 'Medical Tree',
        doctor: 'Medical Tree',
        'medical doctor': 'Medical Tree',
        medicaldoctor: 'Medical Tree',
        'medical_doctor': 'Medical Tree',
        'medical-doctor': 'Medical Tree',
        assistant: 'Assistant Tree',
        'assistant tree': 'Assistant Tree',
        assistanttree: 'Assistant Tree',
    },
    JOB: {
        role: 'Crew Roles',
        roles: 'Crew Roles',
        crew: 'Crew Roles',
        specialization: 'Specializations',
        specializations: 'Specializations',
    },
    OTHER: {
        mechanic: 'Mechanics',
        mechanics: 'Mechanics',
        ui: 'UI & Symbols',
        symbol: 'UI & Symbols',
        symbols: 'UI & Symbols',
        meta: 'Meta Systems',
        system: 'Meta Systems',
    },
};

const PRIMARY_DISPLAY_LABEL_OVERRIDES_BY_TYPE = {
    ITEM: {
        weaponry: 'Weaponry',
        medical: 'Medical',
        tools: 'Tools',
        equipment: 'Equipment',
        'electrical & logic': 'Electrical & Logic',
        electricallogic: 'Electrical & Logic',
        materials: 'Materials',
        machines: 'Machines',
    },
    AFFLICTION: {
        affliction: 'Affliction',
        alieninfection: 'Alien Infection',
        bloodloss: 'Blood Loss',
        disguiseasanother: 'Disguise As Another',
        disguiseashusk: 'Disguise As Husk',
        doomofjove: 'Doom Of Jove',
        durationincrease: 'Duration Increase',
        geneticmaterialbuff: 'Genetic Material Buff',
        geneticmaterialdebuff: 'Genetic Material Debuff',
        invertcontrols: 'Invert Controls',
        oxygenlow: 'Low Oxygen',
        psychoclown: 'Psycho Clown',
        recoilstabilized: 'Recoil Stabilized',
        respawnpenalty: 'Respawn Penalty',
        spaceherpes: 'Space Herpes',
        strengthbuff: 'Strength Buff',
        talentbuff: 'Talent Buff',
        visionbuff: 'Vision Buff',
    },
    CREATURE: {
        ancientalien: 'Ancient Alien',
    },
    JOB: {
        npc: 'NPC',
    },
};

const SECONDARY_DISPLAY_LABEL_OVERRIDES_BY_TYPE = {
    ITEM: {
        turretammo: 'Turret Ammo',
        medicaltools: 'Medical Tools',
        standardtools: 'Standard Tools',
        medicalfabricator: 'Medical Fabricator',
        researchstation: 'Research Station',
    },
    TALENT: {
        assistant_primary: 'Assistant Primary',
        captain_primary: 'Captain Primary',
        engineer_primary: 'Engineer Primary',
        mechanic_primary: 'Mechanic Primary',
        medical_primary: 'Medical Primary',
        security_primary: 'Security Primary',
        weaponsengineer: 'Weapons Engineer',
    },
};

function normalizeCategoryValue(value) {
    return String(value || '').trim();
}

function categoryIdentity(value) {
    return normalizeCategoryValue(value).toLocaleLowerCase('en-US');
}

function humanizeCategoryLabel(value) {
    const normalized = normalizeCategoryValue(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized) return '';

    return normalized
        .split(' ')
        .map((word) => {
            if (!word) return '';
            if (word.length <= 2 && /^[A-Z0-9]+$/.test(word)) {
                return word;
            }
            if (/[A-Z]/.test(word) && /[a-z]/.test(word)) {
                return word;
            }
            if (/^[a-z]/.test(word)) {
                return `${word[0].toUpperCase()}${word.slice(1)}`;
            }
            return word;
        })
        .join(' ');
}

function isTechnicalCategory(value) {
    const identity = categoryIdentity(value);
    if (!identity) return true;
    if (TECHNICAL_CATEGORY_IDENTITIES.has(identity)) return true;
    return TECHNICAL_CATEGORY_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

function buildDemoPrimaryKeySetByType() {
    const byType = {};
    DEMO_TYPE_SECTIONS.forEach((section) => {
        byType[section.key] = new Set((section.primaryBlocks || []).map((block) => block.key));
    });
    return byType;
}

function buildBlueprintPrimaryIdentityMapByType() {
    const byType = {};

    DEMO_TYPE_SECTIONS.forEach((section) => {
        const keyByIdentity = {};
        (section.primaryBlocks || []).forEach((primaryBlock) => {
            const keyIdentity = categoryIdentity(primaryBlock.key);
            const labelIdentity = categoryIdentity(primaryBlock.label);
            if (keyIdentity) keyByIdentity[keyIdentity] = primaryBlock.key;
            if (labelIdentity) keyByIdentity[labelIdentity] = primaryBlock.key;
        });

        const aliases = NON_ITEM_PRIMARY_ALIAS_CONFIG[section.key] || {};
        Object.entries(aliases).forEach(([alias, canonicalKey]) => {
            const aliasIdentity = categoryIdentity(alias);
            if (!aliasIdentity || !canonicalKey) return;
            keyByIdentity[aliasIdentity] = canonicalKey;
        });

        byType[section.key] = keyByIdentity;
    });

    return byType;
}

function buildDemoPrimaryLabelMap() {
    const byType = {};
    DEMO_TYPE_SECTIONS.forEach((section) => {
        byType[section.key] = {};
        (section.primaryBlocks || []).forEach((primaryBlock) => {
            const key = categoryIdentity(primaryBlock.key);
            if (!key) return;
            byType[section.key][key] = primaryBlock.label || primaryBlock.key;
        });
    });
    return byType;
}

function buildDemoSecondaryLabelMap() {
    const byTypePrimary = {};
    DEMO_TYPE_SECTIONS.forEach((section) => {
        (section.primaryBlocks || []).forEach((primaryBlock) => {
            const primaryKey = categoryIdentity(primaryBlock.key);
            if (!primaryKey) return;
            const storageKey = `${section.key}|${primaryKey}`;
            byTypePrimary[storageKey] = {};
            (primaryBlock.secondaryBlocks || []).forEach((secondaryBlock) => {
                const secondaryKey = categoryIdentity(secondaryBlock.key);
                if (!secondaryKey) return;
                byTypePrimary[storageKey][secondaryKey] = secondaryBlock.label || secondaryBlock.key;
            });
        });
    });
    return byTypePrimary;
}

const DEMO_PRIMARY_LABELS_BY_TYPE = buildDemoPrimaryLabelMap();
const DEMO_SECONDARY_LABELS_BY_TYPE_PRIMARY = buildDemoSecondaryLabelMap();
const DEMO_PRIMARY_KEY_SET_BY_TYPE = buildDemoPrimaryKeySetByType();
const BLUEPRINT_PRIMARY_KEY_BY_TYPE_IDENTITY = buildBlueprintPrimaryIdentityMapByType();

function resolvePrimaryBlockLabel(entityType, primaryKey) {
    const identity = categoryIdentity(primaryKey);
    const labelOverride = PRIMARY_DISPLAY_LABEL_OVERRIDES_BY_TYPE[entityType]?.[identity];
    if (labelOverride) return labelOverride;
    return humanizeCategoryLabel(primaryKey) || primaryKey;
}

function resolveSecondaryBlockLabel(entityType, primaryKey, secondaryKey) {
    const secondaryIdentity = categoryIdentity(secondaryKey);
    const labelOverride = SECONDARY_DISPLAY_LABEL_OVERRIDES_BY_TYPE[entityType]?.[secondaryIdentity];
    if (labelOverride) return labelOverride;
    return humanizeCategoryLabel(secondaryKey) || secondaryKey;
}

function resolveItemCanonicalPrimaryGroup(rawPrimaryKey) {
    const identity = categoryIdentity(rawPrimaryKey);
    if (!identity) {
        return ITEM_CANONICAL_PRIMARY_GROUPS[ITEM_CANONICAL_PRIMARY_GROUPS.length - 1];
    }
    for (const group of ITEM_CANONICAL_PRIMARY_GROUPS) {
        if (group.identities.has(identity)) {
            return group;
        }
    }
    return ITEM_CANONICAL_PRIMARY_GROUPS[ITEM_CANONICAL_PRIMARY_GROUPS.length - 1];
}

function buildItemPrimaryBlocks(rawPrimaryBlocks) {
    const groups = ITEM_CANONICAL_PRIMARY_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        count: 0,
        secondaryBlocks: [],
        queryPrimaryCategory: '',
        fallbackPrimaryQuery: '',
    }));
    const byKey = new Map(groups.map((group) => [group.key, group]));

    (Array.isArray(rawPrimaryBlocks) ? rawPrimaryBlocks : []).forEach((rawPrimaryBlock) => {
        if (!rawPrimaryBlock?.key || Number(rawPrimaryBlock?.count || 0) <= 0) {
            return;
        }
        const group = resolveItemCanonicalPrimaryGroup(rawPrimaryBlock.key);
        const target = byKey.get(group.key);
        if (!target) return;

        target.count += Number(rawPrimaryBlock.count || 0);
        target.fallbackPrimaryQuery = target.fallbackPrimaryQuery
            || rawPrimaryBlock.queryPrimaryCategory
            || rawPrimaryBlock.key;

        const rawSecondaryBlocks = Array.isArray(rawPrimaryBlock.secondaryBlocks)
            ? rawPrimaryBlock.secondaryBlocks
            : [];
        if (rawSecondaryBlocks.length > 0) {
            rawSecondaryBlocks.forEach((rawSecondaryBlock) => {
                const secondaryKey = normalizeCategoryValue(
                    rawSecondaryBlock?.querySecondaryCategory || rawSecondaryBlock?.key,
                );
                const secondaryCount = Number(rawSecondaryBlock?.count || 0);
                if (!secondaryKey || secondaryCount <= 0) return;
                if (isTechnicalCategory(secondaryKey)) return;

                const queryPrimaryCategory = rawPrimaryBlock.queryPrimaryCategory || rawPrimaryBlock.key;
                target.secondaryBlocks.push({
                    key: `${queryPrimaryCategory}::${secondaryKey}`,
                    label: rawSecondaryBlock.label || resolveSecondaryBlockLabel('ITEM', rawPrimaryBlock.key, secondaryKey),
                    count: secondaryCount,
                    queryPrimaryCategory,
                    querySecondaryCategory: secondaryKey,
                });
            });
            return;
        }

        const canonicalIdentity = categoryIdentity(group.key);
        const rawPrimaryIdentity = categoryIdentity(rawPrimaryBlock.key);
        if (rawPrimaryIdentity === canonicalIdentity) {
            if (!target.queryPrimaryCategory) {
                target.queryPrimaryCategory = rawPrimaryBlock.queryPrimaryCategory || rawPrimaryBlock.key;
            }
            return;
        }

        if (!isTechnicalCategory(rawPrimaryBlock.key)) {
            const queryPrimaryCategory = rawPrimaryBlock.queryPrimaryCategory || rawPrimaryBlock.key;
            target.secondaryBlocks.push({
                key: queryPrimaryCategory,
                label: rawPrimaryBlock.label || resolvePrimaryBlockLabel('ITEM', rawPrimaryBlock.key),
                count: Number(rawPrimaryBlock.count || 0),
                queryPrimaryCategory,
                querySecondaryCategory: '',
            });
        }
    });

    return groups
        .map((group) => {
            const secondaryBlocks = dedupeSecondaryBlocks(group.secondaryBlocks).filter((secondaryBlock) => {
                const secondaryIdentity = categoryIdentity(
                    secondaryBlock?.querySecondaryCategory || secondaryBlock?.key,
                );
                if (!secondaryIdentity) return false;
                return secondaryIdentity !== categoryIdentity(group.key);
            });

            if (secondaryBlocks.length === 1 && !secondaryBlocks[0].querySecondaryCategory) {
                const onlySecondary = secondaryBlocks[0];
                return {
                    ...group,
                    secondaryBlocks: [],
                    queryPrimaryCategory: onlySecondary.queryPrimaryCategory,
                };
            }
            if (secondaryBlocks.length === 0) {
                return {
                    ...group,
                    queryPrimaryCategory: group.queryPrimaryCategory || group.fallbackPrimaryQuery || group.key,
                };
            }
            return {
                ...group,
                secondaryBlocks,
            };
        })
        .filter((group) => group.count > 0);
}

function resolveCanonicalPrimaryKey(entityType, rawPrimaryKey) {
    if (entityType === 'ITEM') {
        return resolveItemCanonicalPrimaryGroup(rawPrimaryKey).key;
    }

    const identity = categoryIdentity(rawPrimaryKey);
    if (!identity) return rawPrimaryKey;

    const byIdentity = BLUEPRINT_PRIMARY_KEY_BY_TYPE_IDENTITY[entityType];
    if (!byIdentity) return rawPrimaryKey;
    return byIdentity[identity] || rawPrimaryKey;
}

function dedupeSecondaryBlocks(secondaryBlocks) {
    const byIdentity = new Map();

    (Array.isArray(secondaryBlocks) ? secondaryBlocks : []).forEach((secondaryBlock) => {
        const queryPrimaryIdentity = categoryIdentity(
            secondaryBlock?.queryPrimaryCategory || secondaryBlock?.key,
        );
        const querySecondaryIdentity = categoryIdentity(secondaryBlock?.querySecondaryCategory || '');
        const labelIdentity = categoryIdentity(secondaryBlock?.label || secondaryBlock?.key);
        if (!queryPrimaryIdentity || !labelIdentity) return;

        const storageIdentity = `${queryPrimaryIdentity}|${querySecondaryIdentity}|${labelIdentity}`;
        const existing = byIdentity.get(storageIdentity);
        if (!existing || Number(secondaryBlock?.count || 0) > Number(existing.count || 0)) {
            byIdentity.set(storageIdentity, secondaryBlock);
        }
    });

    return Array.from(byIdentity.values()).sort(sortByCountDescThenLabelAsc);
}

function buildNonItemPrimaryBlocks(entityType, rawPrimaryBlocks) {
    const blueprintPrimaryKeys = DEMO_PRIMARY_KEY_SET_BY_TYPE[entityType];
    if (!blueprintPrimaryKeys) {
        return Array.isArray(rawPrimaryBlocks) ? rawPrimaryBlocks.slice().sort(sortByCountDescThenLabelAsc) : [];
    }

    const groupsByKey = new Map();
    const extras = [];

    (Array.isArray(rawPrimaryBlocks) ? rawPrimaryBlocks : []).forEach((rawPrimaryBlock) => {
        if (!rawPrimaryBlock?.key || Number(rawPrimaryBlock?.count || 0) <= 0) return;

        const canonicalPrimaryKey = resolveCanonicalPrimaryKey(entityType, rawPrimaryBlock.key);
        if (!blueprintPrimaryKeys.has(canonicalPrimaryKey)) {
            extras.push(rawPrimaryBlock);
            return;
        }

        const target = groupsByKey.get(canonicalPrimaryKey) || {
            key: canonicalPrimaryKey,
            label: resolvePrimaryBlockLabel(entityType, canonicalPrimaryKey),
            count: 0,
            secondaryBlocks: [],
            queryPrimaryCategory: '',
            fallbackPrimaryQuery: '',
        };

        target.count += Number(rawPrimaryBlock.count || 0);
        target.fallbackPrimaryQuery = target.fallbackPrimaryQuery || rawPrimaryBlock.queryPrimaryCategory || rawPrimaryBlock.key;

        const canonicalIdentity = categoryIdentity(canonicalPrimaryKey);
        const rawPrimaryIdentity = categoryIdentity(rawPrimaryBlock.key);
        const rawSecondaryBlocks = Array.isArray(rawPrimaryBlock.secondaryBlocks)
            ? rawPrimaryBlock.secondaryBlocks
            : [];

        if (rawSecondaryBlocks.length > 0) {
            rawSecondaryBlocks.forEach((rawSecondaryBlock) => {
                const secondaryKey = normalizeCategoryValue(rawSecondaryBlock?.key);
                const secondaryCount = Number(rawSecondaryBlock?.count || 0);
                if (!secondaryKey || secondaryCount <= 0) return;
                if (isTechnicalCategory(secondaryKey)) return;

                const queryPrimaryCategory = rawPrimaryBlock.queryPrimaryCategory || rawPrimaryBlock.key;
                target.secondaryBlocks.push({
                    key: `${queryPrimaryCategory}::${secondaryKey}`,
                    label: rawSecondaryBlock.label || resolveSecondaryBlockLabel(entityType, rawPrimaryBlock.key, secondaryKey),
                    count: secondaryCount,
                    queryPrimaryCategory,
                    querySecondaryCategory: secondaryKey,
                });
            });
        } else if (rawPrimaryIdentity === canonicalIdentity) {
            if (!target.queryPrimaryCategory) {
                target.queryPrimaryCategory = rawPrimaryBlock.queryPrimaryCategory || rawPrimaryBlock.key;
            }
        } else {
            const queryPrimaryCategory = rawPrimaryBlock.queryPrimaryCategory || rawPrimaryBlock.key;
            target.secondaryBlocks.push({
                key: queryPrimaryCategory,
                label: rawPrimaryBlock.label || resolvePrimaryBlockLabel(entityType, rawPrimaryBlock.key),
                count: Number(rawPrimaryBlock.count || 0),
                queryPrimaryCategory,
                querySecondaryCategory: '',
            });
        }

        groupsByKey.set(canonicalPrimaryKey, target);
    });

    const groupedBlocks = Array.from(groupsByKey.values())
        .map((group) => {
            const secondaryBlocks = dedupeSecondaryBlocks(group.secondaryBlocks).filter((secondaryBlock) => {
                const secondaryIdentity = categoryIdentity(
                    secondaryBlock?.querySecondaryCategory || secondaryBlock?.key,
                );
                if (!secondaryIdentity) return false;
                return secondaryIdentity !== categoryIdentity(group.key);
            });

            if (secondaryBlocks.length === 1 && !secondaryBlocks[0].querySecondaryCategory) {
                return {
                    key: group.key,
                    label: group.label,
                    count: group.count,
                    secondaryBlocks: [],
                    queryPrimaryCategory: secondaryBlocks[0].queryPrimaryCategory,
                };
            }

            return {
                key: group.key,
                label: group.label,
                count: group.count,
                secondaryBlocks,
                queryPrimaryCategory: group.queryPrimaryCategory || group.fallbackPrimaryQuery || group.key,
            };
        })
        .filter((group) => group.count > 0)
        .sort(sortByCountDescThenLabelAsc);

    const normalizedExtras = extras
        .map((extraBlock) => ({
            ...extraBlock,
            secondaryBlocks: dedupeSecondaryBlocks(extraBlock.secondaryBlocks),
        }))
        .filter((extraBlock) => Number(extraBlock.count || 0) > 0)
        .sort(sortByCountDescThenLabelAsc);

    return [...groupedBlocks, ...normalizedExtras];
}

function buildCanonicalPrimaryBlocks(entityType, rawPrimaryBlocks) {
    if (entityType === 'ITEM') {
        return buildItemPrimaryBlocks(rawPrimaryBlocks);
    }
    return buildNonItemPrimaryBlocks(entityType, rawPrimaryBlocks);
}

function buildDemoPrimaryPlaceholderBlock(entityType, demoPrimaryBlock) {
    const key = normalizeCategoryValue(demoPrimaryBlock?.key);
    if (!key) return null;

    return {
        key,
        label: resolvePrimaryBlockLabel(entityType, key),
        count: 0,
        secondaryBlocks: [],
        queryPrimaryCategory: key,
    };
}

function mergePrimaryBlocksWithBlueprint(entityType, livePrimaryBlocks, demoPrimaryBlocks) {
    const liveBlocks = Array.isArray(livePrimaryBlocks) ? livePrimaryBlocks : [];
    const liveByIdentity = new Map();
    liveBlocks.forEach((livePrimaryBlock) => {
        const identity = categoryIdentity(livePrimaryBlock?.key);
        if (!identity || liveByIdentity.has(identity)) return;
        liveByIdentity.set(identity, livePrimaryBlock);
    });

    const merged = [];
    const consumed = new Set();

    (Array.isArray(demoPrimaryBlocks) ? demoPrimaryBlocks : []).forEach((demoPrimaryBlock) => {
        const demoIdentity = categoryIdentity(demoPrimaryBlock?.key);
        if (!demoIdentity) return;

        const liveMatch = liveByIdentity.get(demoIdentity);
        if (liveMatch) {
            merged.push(liveMatch);
            consumed.add(demoIdentity);
            return;
        }

        const placeholder = buildDemoPrimaryPlaceholderBlock(entityType, demoPrimaryBlock);
        if (!placeholder) return;
        merged.push(placeholder);
        consumed.add(demoIdentity);
    });

    const extraLiveBlocks = liveBlocks
        .filter((livePrimaryBlock) => {
            const identity = categoryIdentity(livePrimaryBlock?.key);
            return identity && !consumed.has(identity);
        })
        .sort(sortByCountDescThenLabelAsc);

    return [...merged, ...extraLiveBlocks];
}

export function mergeSectionsWithBlueprint(liveSections) {
    const liveByKey = new Map((Array.isArray(liveSections) ? liveSections : [])
        .map((section) => [section.key, section]));

    const merged = [];

    DEMO_TYPE_SECTIONS.forEach((demoSection) => {
        const liveSection = liveByKey.get(demoSection.key);
        if (!liveSection) {
            merged.push({
                key: demoSection.key,
                label: ENTITY_LABELS[demoSection.key] || demoSection.label || demoSection.key,
                count: 0,
                primaryBlocks: mergePrimaryBlocksWithBlueprint(
                    demoSection.key,
                    [],
                    demoSection.primaryBlocks,
                ),
            });
            return;
        }

        merged.push({
            ...liveSection,
            label: ENTITY_LABELS[demoSection.key] || liveSection.label || demoSection.label || demoSection.key,
            primaryBlocks: mergePrimaryBlocksWithBlueprint(
                demoSection.key,
                liveSection.primaryBlocks,
                demoSection.primaryBlocks,
            ),
        });
        liveByKey.delete(demoSection.key);
    });

    const extraSections = Array.from(liveByKey.values()).sort(sortByCountDescThenLabelAsc);
    return [...merged, ...extraSections];
}

function normalizeNavigationSecondaryBlocks(entityType, primaryKey, secondaryCategories) {
    const primaryIdentity = categoryIdentity(primaryKey);
    const byIdentity = new Map();

    (Array.isArray(secondaryCategories) ? secondaryCategories : []).forEach((secondaryNode) => {
        const key = normalizeCategoryValue(secondaryNode?.secondaryCategory);
        const count = Number(secondaryNode?.total || 0);
        if (!key || count <= 0) return;
        if (entityType !== 'ITEM' && isTechnicalCategory(key)) return;

        const identity = categoryIdentity(key);
        if (!identity || identity === primaryIdentity) return;

        const existing = byIdentity.get(identity);
        if (!existing) {
            byIdentity.set(identity, {
                key,
                label: resolveSecondaryBlockLabel(entityType, primaryKey, key),
                count,
                queryPrimaryCategory: primaryKey,
                querySecondaryCategory: key,
            });
            return;
        }

        existing.count += count;
    });

    return Array.from(byIdentity.values()).sort(sortByCountDesc);
}

function normalizeNavigationPrimaryBlocks(entityType, primaryCategories) {
    const byIdentity = new Map();

    (Array.isArray(primaryCategories) ? primaryCategories : []).forEach((primaryNode) => {
        const key = normalizeCategoryValue(primaryNode?.primaryCategory);
        const count = Number(primaryNode?.total || 0);
        if (!key || count <= 0) return;
        if (entityType !== 'ITEM' && isTechnicalCategory(key)) return;

        const identity = categoryIdentity(key);
        if (!identity) return;

        const secondaryCategories = Array.isArray(primaryNode?.secondaryCategories)
            ? primaryNode.secondaryCategories
            : [];
        const existing = byIdentity.get(identity);
        if (!existing) {
            byIdentity.set(identity, {
                key,
                label: resolvePrimaryBlockLabel(entityType, key),
                count,
                queryPrimaryCategory: key,
                rawSecondaryCategories: secondaryCategories.slice(),
            });
            return;
        }

        existing.count += count;
        existing.rawSecondaryCategories.push(...secondaryCategories);
    });

    return Array.from(byIdentity.values())
        .map((block) => ({
            key: block.key,
            label: block.label,
            count: block.count,
            queryPrimaryCategory: block.queryPrimaryCategory,
            secondaryBlocks: normalizeNavigationSecondaryBlocks(
                entityType,
                block.key,
                block.rawSecondaryCategories,
            ),
        }))
        .sort(sortByCountDesc);
}

export function mapNavigationTypesToSections(types) {
    return (Array.isArray(types) ? types : [])
        .map((typeNode) => {
            const key = typeNode?.entityType;
            const count = Number(typeNode?.total || 0);
            if (!key || count <= 0) return null;

            const rawPrimaryBlocks = normalizeNavigationPrimaryBlocks(key, typeNode?.primaryCategories);
            const primaryBlocks = buildCanonicalPrimaryBlocks(key, rawPrimaryBlocks);
            const primaryIdentities = new Set(primaryBlocks.map((primaryBlock) => categoryIdentity(primaryBlock?.key)));
            const normalizedPrimaryBlocks = primaryBlocks.map((primaryBlock) => {
                const secondaryBlocks = (Array.isArray(primaryBlock.secondaryBlocks) ? primaryBlock.secondaryBlocks : [])
                    .filter((secondaryBlock) => {
                        const identity = categoryIdentity(secondaryBlock?.key || secondaryBlock?.label);
                        if (!identity) return false;
                        return !primaryIdentities.has(identity);
                    });

                return {
                    ...primaryBlock,
                    secondaryBlocks,
                };
            });

            return {
                key,
                label: ENTITY_LABELS[key] || key,
                count,
                primaryBlocks: normalizedPrimaryBlocks,
            };
        })
        .filter((entry) => entry && entry.key && entry.count > 0)
        .sort(sortByCountDesc);
}

function normalizeQuery(value) {
    return String(value || '').trim();
}

function normalizePage(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) return 0;
    return parsed;
}

function normalizeSortBy(value) {
    return SORT_OPTIONS.includes(value) ? value : DEFAULT_SORT_BY;
}

function normalizeDirection(value) {
    return DIRECTION_OPTIONS.includes(value) ? value : DEFAULT_DIRECTION;
}

function normalizeEntityType(value) {
    return ENCYCLOPEDIA_ENTITY_TYPES.includes(value) ? value : '';
}

function normalizeFilter(value) {
    return String(value || '').trim();
}

function setParam(params, key, value) {
    if (value === undefined || value === null || value === '') {
        params.delete(key);
        return;
    }
    params.set(key, String(value));
}

function sortByCountDesc(a, b) {
    return b.count - a.count;
}

function sortByCountDescThenLabelAsc(a, b) {
    const countDelta = Number(b.count || 0) - Number(a.count || 0);
    if (countDelta !== 0) return countDelta;
    return String(a.label || '').localeCompare(String(b.label || ''), 'ru-RU');
}

function buildSectionQuickLinks(section, maxLinks = MAX_QUICK_LINKS_PER_SECTION) {
    if (!section || !Array.isArray(section.primaryBlocks)) return [];

    const visiblePrimaryBlocks = section.primaryBlocks.slice(0, MAX_PRIMARY_BLOCKS_PER_SECTION);
    const hiddenPrimaryBlocks = section.primaryBlocks.slice(MAX_PRIMARY_BLOCKS_PER_SECTION);
    const visiblePrimaryIdentities = new Set(visiblePrimaryBlocks.map((block) => categoryIdentity(block?.key)));
    const linksByIdentity = new Map();

    hiddenPrimaryBlocks.forEach((primaryBlock) => {
        if (!primaryBlock?.key) return;
        const primaryCount = Number(primaryBlock.count || 0);
        if (primaryCount <= 0) return;
        const identity = categoryIdentity(primaryBlock.key);
        if (!identity) return;
        const nextCandidate = {
            key: primaryBlock.key,
            label: primaryBlock.label,
            primaryKey: primaryBlock.key,
            secondaryKey: '',
            count: primaryCount,
        };
        const existing = linksByIdentity.get(identity);
        if (!existing || nextCandidate.count > existing.count) {
            linksByIdentity.set(identity, nextCandidate);
        }
    });

    section.primaryBlocks.forEach((primaryBlock) => {
        if (!primaryBlock?.key) return;
        const secondaryBlocks = Array.isArray(primaryBlock.secondaryBlocks)
            ? primaryBlock.secondaryBlocks
            : [];

        if (secondaryBlocks.length > 0) {
            secondaryBlocks.forEach((secondaryBlock) => {
                if (!secondaryBlock?.key) return;
                const secondaryCount = Number(secondaryBlock.count || 0);
                if (secondaryCount <= 0) return;
                const labelIdentity = categoryIdentity(secondaryBlock.label || secondaryBlock.key);
                const keyIdentity = categoryIdentity(secondaryBlock.key);
                if (!labelIdentity || !keyIdentity) return;
                if (visiblePrimaryIdentities.has(labelIdentity) || visiblePrimaryIdentities.has(keyIdentity)) {
                    return;
                }

                const nextCandidate = {
                    key: `${primaryBlock.key}-${secondaryBlock.key}`,
                    label: secondaryBlock.label,
                    primaryKey: primaryBlock.key,
                    secondaryKey: secondaryBlock.key,
                    count: secondaryCount,
                };
                const existing = linksByIdentity.get(labelIdentity);
                if (!existing || nextCandidate.count > existing.count) {
                    linksByIdentity.set(labelIdentity, nextCandidate);
                }
            });
            return;
        }
    });

    return Array.from(linksByIdentity.values())
        .sort(sortByCountDescThenLabelAsc)
        .slice(0, maxLinks);
}

function buildBlockMonogram(label) {
    const words = String(label || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) return '??';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function buildDemoItems({ entityType, primaryCategory, secondaryCategory }) {
    const keyWithSecondary = `${entityType}|${primaryCategory}|${secondaryCategory || ''}`;
    const exactItems = DEMO_ITEM_POOL[keyWithSecondary];
    if (exactItems) return exactItems;

    const keyWithoutSecondary = `${entityType}|${primaryCategory}|`;
    const baseItems = DEMO_ITEM_POOL[keyWithoutSecondary];
    if (baseItems) return baseItems;

    const categorySuffix = secondaryCategory || primaryCategory || 'category';
    const slugSuffix = String(categorySuffix).toLowerCase().replace(/\s+/g, '-');
    return [
        {
            id: `demo-${entityType}-${primaryCategory}-1`,
            slug: `demo-${String(entityType || '').toLowerCase()}-${slugSuffix}`,
            title: `${primaryCategory || entityType} — демо`,
            entityType,
            primaryCategory,
            secondaryCategory: secondaryCategory || '',
            summary: 'Заглушка предпросмотра структуры энциклопедии.',
            shortDescription: 'Заглушка предпросмотра структуры энциклопедии.',
            primaryImageUrl: null,
        },
    ];
}

export default function EncyclopediaListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAdmin } = useAuth();

    const q = normalizeQuery(searchParams.get('q'));
    const entityType = normalizeEntityType(searchParams.get('entityType'));
    const primaryCategory = normalizeFilter(searchParams.get('primaryCategory'));
    const secondaryCategory = normalizeFilter(searchParams.get('secondaryCategory'));
    const page = normalizePage(searchParams.get('page'));
    const sortBy = normalizeSortBy(searchParams.get('sortBy'));
    const direction = normalizeDirection(searchParams.get('direction'));

    const rootLevel = !entityType;
    const primaryLevel = Boolean(entityType && !primaryCategory);
    const secondaryLevel = Boolean(entityType && primaryCategory && !secondaryCategory);

    const [typeSections, setTypeSections] = useState([]);
    const [hasLiveSections, setHasLiveSections] = useState(false);

    const [loadingHub, setLoadingHub] = useState(true);
    const [hubError, setHubError] = useState('');

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [itemsError, setItemsError] = useState('');
    const [searchInput, setSearchInput] = useState(q);

    const updateSearch = (patch = {}) => {
        const nextState = {
            q,
            entityType,
            primaryCategory,
            secondaryCategory,
            page,
            sortBy,
            direction,
            ...patch,
        };
        const next = new URLSearchParams(searchParams);
        setParam(next, 'q', normalizeQuery(nextState.q));
        setParam(next, 'entityType', normalizeEntityType(nextState.entityType));
        setParam(next, 'primaryCategory', normalizeFilter(nextState.primaryCategory));
        setParam(next, 'secondaryCategory', normalizeFilter(nextState.secondaryCategory));
        setParam(next, 'sortBy', normalizeSortBy(nextState.sortBy) === DEFAULT_SORT_BY ? '' : nextState.sortBy);
        setParam(next, 'direction', normalizeDirection(nextState.direction) === DEFAULT_DIRECTION ? '' : nextState.direction);
        setParam(next, 'page', Number(nextState.page) > 0 ? nextState.page : '');
        setSearchParams(next);
    };

    useEffect(() => {
        setSearchInput(q);
    }, [q]);

    useEffect(() => {
        let cancelled = false;

        const loadHub = async () => {
            setLoadingHub(true);
            setHubError('');
            try {
                const navigationData = await getEncyclopediaNavigation();
                const types = Array.isArray(navigationData?.types) ? navigationData.types : [];
                const liveSections = mapNavigationTypesToSections(types);
                const sections = mergeSectionsWithBlueprint(liveSections);

                if (!cancelled) {
                    setTypeSections(sections);
                    setHasLiveSections(liveSections.length > 0);
                }
            } catch (error) {
                if (!cancelled) {
                    setTypeSections([]);
                    setHasLiveSections(false);
                    setHubError(mapPaginationError(error, 'Не удалось загрузить структуру энциклопедии'));
                }
            } finally {
                if (!cancelled) setLoadingHub(false);
            }
        };

        loadHub();
        return () => { cancelled = true; };
    }, []);

    const selectedTypeSection = useMemo(
        () => {
            const demoMode = !loadingHub && !hubError && !hasLiveSections;
            const source = demoMode ? DEMO_TYPE_SECTIONS : typeSections;
            return source.find((section) => section.key === entityType) || null;
        },
        [typeSections, entityType, loadingHub, hubError, hasLiveSections],
    );

    const demoMode = !loadingHub && !hubError && !hasLiveSections;
    const visibleTypeSections = demoMode ? DEMO_TYPE_SECTIONS : typeSections;
    const primaryBlocks = selectedTypeSection?.primaryBlocks || [];
    const selectedPrimaryBlock = primaryBlocks.find((block) => block.key === primaryCategory) || null;
    const effectiveSecondaryBlocks = selectedPrimaryBlock?.secondaryBlocks || [];
    const selectedSecondaryBlock = effectiveSecondaryBlocks.find((block) => block.key === secondaryCategory) || null;
    const effectiveLoadingSecondary = false;
    const effectivePrimaryCategoryForQuery = selectedSecondaryBlock?.queryPrimaryCategory
        || selectedPrimaryBlock?.queryPrimaryCategory
        || primaryCategory;
    const effectiveSecondaryCategoryForQuery = selectedSecondaryBlock?.querySecondaryCategory !== undefined
        ? selectedSecondaryBlock.querySecondaryCategory
        : selectedPrimaryBlock?.querySecondaryCategory !== undefined
            ? selectedPrimaryBlock.querySecondaryCategory
        : secondaryCategory;
    const showEntries = Boolean(
        entityType
        && primaryCategory
        && (secondaryCategory || (!effectiveLoadingSecondary && effectiveSecondaryBlocks.length === 0)),
    );

    useEffect(() => {
        if (!showEntries) return undefined;

        if (demoMode) {
            setLoadingItems(false);
            setItemsError('');
            const rawItems = buildDemoItems({ entityType, primaryCategory, secondaryCategory });
            const normalizedQuery = q.toLowerCase();
            const filteredItems = normalizedQuery
                ? rawItems.filter((item) => (
                    String(item.title || '').toLowerCase().includes(normalizedQuery)
                    || String(item.summary || '').toLowerCase().includes(normalizedQuery)
                ))
                : rawItems;
            const pageStart = page * PAGE_SIZE;
            const pageItems = filteredItems.slice(pageStart, pageStart + PAGE_SIZE);
            const pages = filteredItems.length > 0 ? Math.ceil(filteredItems.length / PAGE_SIZE) : 0;

            setItems(pageItems);
            setTotal(filteredItems.length);
            setTotalPages(pages);
            setHasPrevious(page > 0);
            setHasNext(page + 1 < pages);
            return undefined;
        }

        let cancelled = false;
        const loadEntries = async () => {
            setLoadingItems(true);
            setItemsError('');
            try {
                const data = await getEncyclopediaList({
                    q,
                    entityType,
                    primaryCategory: effectivePrimaryCategoryForQuery,
                    secondaryCategory: effectiveSecondaryCategoryForQuery || undefined,
                    page,
                    size: PAGE_SIZE,
                    sortBy,
                    direction,
                });
                if (!cancelled) {
                    setItems(Array.isArray(data.items) ? data.items : []);
                    setTotal(data.total || 0);
                    setTotalPages(data.total_pages || 0);
                    setHasNext(Boolean(data.has_next));
                    setHasPrevious(Boolean(data.has_previous));
                }
            } catch (error) {
                if (!cancelled) {
                    setItems([]);
                    setTotal(0);
                    setTotalPages(0);
                    setHasNext(false);
                    setHasPrevious(false);
                    setItemsError(mapPaginationError(error, 'Не удалось загрузить статьи'));
                }
            } finally {
                if (!cancelled) setLoadingItems(false);
            }
        };

        loadEntries();
        return () => { cancelled = true; };
    }, [
        showEntries,
        demoMode,
        q,
        entityType,
        primaryCategory,
        secondaryCategory,
        effectivePrimaryCategoryForQuery,
        effectiveSecondaryCategoryForQuery,
        page,
        sortBy,
        direction,
    ]);

    return (
        <div className="page">
            <div className="container encyclopedia-list-page">
                <header className="encyclopedia-header-box glass-card">
                    <h1 className="encyclopedia-title">📖 Энциклопедия Barotrauma</h1>
                    <p className="encyclopedia-subtitle">
                        Структура: разделы → подгруппы → статьи.
                    </p>
                    <div className="encyclopedia-level-actions">
                        {entityType && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => updateSearch({
                                    entityType: '',
                                    primaryCategory: '',
                                    secondaryCategory: '',
                                    q: '',
                                    page: 0,
                                })}
                            >
                                К разделам
                            </button>
                        )}
                        {entityType && primaryCategory && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => updateSearch({
                                    primaryCategory: '',
                                    secondaryCategory: '',
                                    q: '',
                                    page: 0,
                                })}
                            >
                                К подгруппам
                            </button>
                        )}
                        {secondaryCategory && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => updateSearch({
                                    secondaryCategory: '',
                                    q: '',
                                    page: 0,
                                })}
                            >
                                К подподгруппам
                            </button>
                        )}
                        {isAdmin && <Link to="/admin/encyclopedia/new" className="btn btn-primary">➕ Создать страницу</Link>}
                    </div>
                </header>

                {rootLevel && (
                    <section className="encyclopedia-sections">
                        <h2 className="encyclopedia-hub-title">Разделы энциклопедии</h2>
                        {demoMode && (
                            <div className="encyclopedia-demo-hint">
                                Показаны демо-заглушки структуры. Реальные данные появятся после импорта/публикации.
                            </div>
                        )}
                        {hubError && <div className="auth-error">{hubError}</div>}
                        {loadingHub ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p>Загрузка разделов...</p>
                            </div>
                        ) : (
                            <div className="encyclopedia-type-stack">
                                {visibleTypeSections.map((section) => (
                                    <article key={section.key} className="encyclopedia-type-section glass-card">
                                        <div className="encyclopedia-type-section-header">
                                            <div className="encyclopedia-type-section-titleline">
                                                <span className="encyclopedia-type-section-titleline-bar" />
                                                <h3>{section.label}</h3>
                                                <span className="encyclopedia-type-section-titleline-bar" />
                                            </div>
                                            <span className="encyclopedia-type-section-count">{section.count} статей</span>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                aria-label={`Открыть раздел ${section.label}`}
                                                onClick={() => updateSearch({
                                                    entityType: section.key,
                                                    primaryCategory: '',
                                                    secondaryCategory: '',
                                                    q: '',
                                                    page: 0,
                                                })}
                                            >
                                                Открыть раздел
                                            </button>
                                        </div>
                                        {section.primaryBlocks.length === 0 ? (
                                            <p className="encyclopedia-empty-text">Подгруппы пока не определены.</p>
                                        ) : (
                                            <>
                                                <div className="encyclopedia-hub-grid">
                                                    {section.primaryBlocks.slice(0, MAX_PRIMARY_BLOCKS_PER_SECTION).map((block) => (
                                                        <button
                                                            key={`${section.key}-${block.key}`}
                                                            className="encyclopedia-hub-item"
                                                            onClick={() => updateSearch({
                                                                entityType: section.key,
                                                                primaryCategory: block.key,
                                                                secondaryCategory: '',
                                                                q: '',
                                                                page: 0,
                                                            })}
                                                        >
                                                            <span aria-hidden="true" className="encyclopedia-hub-item-icon">
                                                                {buildBlockMonogram(block.label)}
                                                            </span>
                                                            <strong>{block.label}</strong>
                                                            <span>{block.count} статей</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="encyclopedia-hub-links">
                                                    {buildSectionQuickLinks(section, MAX_QUICK_LINKS_PER_SECTION).map((quickLink) => (
                                                        <button
                                                            key={`${section.key}-${quickLink.key}`}
                                                            className="encyclopedia-hub-link-btn"
                                                            onClick={() => updateSearch({
                                                                entityType: section.key,
                                                                primaryCategory: quickLink.primaryKey,
                                                                secondaryCategory: quickLink.secondaryKey,
                                                                q: '',
                                                                page: 0,
                                                            })}
                                                        >
                                                            {quickLink.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {primaryLevel && (
                    <section className="encyclopedia-groups-panel glass-card">
                        <div className="encyclopedia-panel-titleline">
                            <span className="encyclopedia-panel-titleline-bar" />
                            <h2>{selectedTypeSection?.label || entityType}: подгруппы</h2>
                            <span className="encyclopedia-panel-titleline-bar" />
                        </div>
                        {loadingHub ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p>Загрузка подгрупп...</p>
                            </div>
                        ) : primaryBlocks.length === 0 ? (
                            <p className="encyclopedia-empty-text">Для раздела пока нет подгрупп.</p>
                        ) : (
                            <div className="encyclopedia-hub-grid encyclopedia-hub-grid-level">
                                {primaryBlocks.map((block) => (
                                    <button
                                        key={block.key}
                                        className="encyclopedia-hub-item encyclopedia-hub-item-level"
                                        onClick={() => updateSearch({
                                            primaryCategory: block.key,
                                            secondaryCategory: '',
                                            q: '',
                                            page: 0,
                                        })}
                                    >
                                        <span aria-hidden="true" className="encyclopedia-hub-item-icon">
                                            {buildBlockMonogram(block.label)}
                                        </span>
                                        <strong>{block.label}</strong>
                                        <span>{block.count} статей</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {secondaryLevel && !showEntries && (
                    <section className="encyclopedia-groups-panel glass-card">
                        <div className="encyclopedia-panel-titleline">
                            <span className="encyclopedia-panel-titleline-bar" />
                            <h2>{selectedPrimaryBlock?.label || primaryCategory}: подподгруппы</h2>
                            <span className="encyclopedia-panel-titleline-bar" />
                        </div>
                        {effectiveLoadingSecondary ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p>Загрузка подподгрупп...</p>
                            </div>
                        ) : effectiveSecondaryBlocks.length === 0 ? (
                            <p className="encyclopedia-empty-text">У этой подгруппы нет дополнительных уровней.</p>
                        ) : (
                            <div className="encyclopedia-hub-grid encyclopedia-hub-grid-level">
                                {effectiveSecondaryBlocks.map((block) => (
                                    <button
                                        key={block.key}
                                        className="encyclopedia-hub-item encyclopedia-hub-item-level"
                                        onClick={() => updateSearch({
                                            secondaryCategory: block.key,
                                            q: '',
                                            page: 0,
                                        })}
                                    >
                                        <span aria-hidden="true" className="encyclopedia-hub-item-icon">
                                            {buildBlockMonogram(block.label)}
                                        </span>
                                        <strong>{block.label}</strong>
                                        <span>{block.count} статей</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {showEntries && (
                    <>
                        <section className="encyclopedia-search-panel glass-card">
                            <div className="encyclopedia-panel-titleline encyclopedia-panel-titleline-compact">
                                <span className="encyclopedia-panel-titleline-bar" />
                                <h2>Статьи раздела</h2>
                                <span className="encyclopedia-panel-titleline-bar" />
                            </div>
                            <form
                                className="encyclopedia-search-form"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    updateSearch({ q: searchInput, page: 0 });
                                }}
                            >
                                <label htmlFor="encyclopedia-search-input">Поиск в выбранной подгруппе</label>
                                <div className="encyclopedia-search-row">
                                    <input
                                        id="encyclopedia-search-input"
                                        value={searchInput}
                                        onChange={(event) => setSearchInput(event.target.value)}
                                        placeholder="Введите название статьи"
                                    />
                                    <button className="btn btn-primary" type="submit" disabled={loadingItems}>Найти</button>
                                    <button
                                        className="btn btn-ghost"
                                        type="button"
                                        onClick={() => updateSearch({ q: '', page: 0 })}
                                        disabled={loadingItems && !q}
                                    >
                                        Сбросить
                                    </button>
                                </div>
                            </form>
                        </section>
                        {itemsError && <div className="auth-error">{itemsError}</div>}
                        {loadingItems ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p>Загрузка статей...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <section className="encyclopedia-empty-state glass-card">
                                <p>Статьи в этой подгруппе не найдены.</p>
                            </section>
                        ) : (
                            <section className="encyclopedia-grid">
                                {items.map((item) => (
                                    <article key={item.id || item.slug} className="encyclopedia-card glass-card">
                                        <Link to={`/encyclopedia/${item.slug}`} className="encyclopedia-card-image-link">
                                            {item.primaryImageUrl ? (
                                                <img src={item.primaryImageUrl} alt={item.title} className="encyclopedia-card-image" />
                                            ) : (
                                                <div className="encyclopedia-card-image-placeholder">📄</div>
                                            )}
                                        </Link>
                                        <div className="encyclopedia-card-body">
                                            <p className="encyclopedia-card-meta">
                                                <span>{item.entityType || 'OTHER'}</span>
                                                <span>
                                                    {item.primaryCategory
                                                        ? resolvePrimaryBlockLabel(item.entityType || 'OTHER', item.primaryCategory)
                                                        : 'Без категории'}
                                                </span>
                                            </p>
                                            <h2 className="encyclopedia-card-title">
                                                <Link to={`/encyclopedia/${item.slug}`}>{item.title}</Link>
                                            </h2>
                                            <p className="encyclopedia-card-description">
                                                {item.summary || item.shortDescription || 'Описание пока отсутствует.'}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        )}
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            hasNext={hasNext}
                            hasPrevious={hasPrevious}
                            disabled={loadingItems}
                            onPageChange={(nextPage) => updateSearch({ page: nextPage })}
                        />
                        {!loadingItems && <p className="encyclopedia-total-hint">Найдено статей: {total}</p>}
                    </>
                )}
            </div>
        </div>
    );
}
