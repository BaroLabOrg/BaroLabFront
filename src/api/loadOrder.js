const API_BASE = 'http://localhost:8080';

/**
 * @typedef {'lua' | 'cs' | 'default' | string} LoadOrderModCategory
 */

/**
 * @typedef {Object} LoadOrderMod
 * @property {string} id
 * @property {string} name
 * @property {LoadOrderModCategory=} category
 * @property {string[]=} loadAfter
 * @property {string[]=} requires
 */

/**
 * @typedef {Object} LoadOrderConvertRequest
 * @property {string} name
 * @property {LoadOrderMod[]} mods
 */

/**
 * @typedef {'EMPTY_PACK_NAME' | 'EMPTY_MOD_ID' | 'EMPTY_MOD_NAME' | 'DUPLICATE_MOD_ID' | 'SELF_LOAD_AFTER' | 'SELF_REQUIRED' | 'UNKNOWN_REQUIRED_MOD' | 'UNKNOWN_LOAD_AFTER_MOD' | 'CYCLIC_DEPENDENCY' | string} LoadOrderErrorCode
 */

/**
 * @typedef {Object} LoadOrderErrorDetail
 * @property {LoadOrderErrorCode} code
 * @property {string=} modId
 * @property {string=} dependencyId
 * @property {string} message
 */

/**
 * @typedef {Object} LoadOrderErrorResponse
 * @property {LoadOrderErrorCode} code
 * @property {string} message
 * @property {LoadOrderErrorDetail[]=} details
 */

export class LoadOrderConvertError extends Error {
    /**
     * @param {number} status
     * @param {LoadOrderErrorResponse | string | null} body
     * @param {string} rawBody
     */
    constructor(status, body, rawBody) {
        super(`Load-order convert failed with status ${status}`);
        this.name = 'LoadOrderConvertError';
        this.status = status;
        this.body = body;
        this.rawBody = rawBody;
    }
}

/**
 * @param {LoadOrderConvertRequest} payload
 * @returns {Promise<string>}
 * @throws {LoadOrderConvertError}
 */
export async function convertLoadOrderToXml(payload) {
    const res = await fetch(`${API_BASE}/api/load-order/convert`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/xml, application/json',
        },
        body: JSON.stringify(payload),
    });

    if (res.ok) {
        return res.text();
    }

    const rawBody = await res.text();
    if (!rawBody) {
        throw new LoadOrderConvertError(res.status, null, '');
    }

    let parsedBody = rawBody;
    try {
        parsedBody = JSON.parse(rawBody);
    } catch {}

    throw new LoadOrderConvertError(res.status, parsedBody, rawBody);
}
