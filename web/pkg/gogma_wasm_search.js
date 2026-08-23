/* @ts-self-types="./gogma_wasm_search.d.ts" */

/**
 * Stateful, single-threaded search cursor intended to run inside a Web Worker.
 */
export class GogmaCounterSearchSession {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GogmaCounterSearchSessionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gogmacountersearchsession_free(ptr, 0);
    }
    /**
     * @returns {bigint}
     */
    checked_seeds() {
        const ret = wasm.gogmacountersearchsession_checked_seeds(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @returns {boolean}
     */
    done() {
        const ret = wasm.gogmacountersearchsession_done(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Creates a bounded seed/counter search.
     *
     * `flat_observations` contains five game bonus IDs per consecutive
     * amendment, with no separators.
     *
     * # Errors
     *
     * Returns a JavaScript error when a range is descending, observation data
     * is malformed, a bonus ID is unsupported, or the counter gate makes the
     * counter unidentifiable.
     * @param {number} weapon_type
     * @param {number} attribute_force
     * @param {number} counter_gate
     * @param {number} counter_start
     * @param {number} counter_end
     * @param {Uint8Array} flat_observations
     * @param {number} seed_start
     * @param {number} seed_end
     */
    constructor(weapon_type, attribute_force, counter_gate, counter_start, counter_end, flat_observations, seed_start, seed_end) {
        const ptr0 = passArray8ToWasm0(flat_observations, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.gogmacountersearchsession_new(weapon_type, attribute_force, counter_gate, counter_start, counter_end, ptr0, len0, seed_start, seed_end);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        GogmaCounterSearchSessionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Searches at most `max_seeds` candidates and returns flattened
     * `[seed, counter, seed, counter, ...]` pairs as a `Uint32Array`.
     *
     * # Errors
     *
     * Returns a JavaScript error when `max_seeds` is zero or the next chunk
     * cannot be represented as a valid Rust seed range.
     * @param {number} max_seeds
     * @returns {Uint32Array}
     */
    search_next(max_seeds) {
        const ret = wasm.gogmacountersearchsession_search_next(this.__wbg_ptr, max_seeds);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {bigint}
     */
    total_seeds() {
        const ret = wasm.gogmacountersearchsession_total_seeds(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
}
if (Symbol.dispose) GogmaCounterSearchSession.prototype[Symbol.dispose] = GogmaCounterSearchSession.prototype.free;

/**
 * Finds saved skill counters that reproduce consecutive observed table
 * indices for a known base seed.
 *
 * # Errors
 *
 * Returns a JavaScript error for an invalid range, empty observations, an
 * invalid table index, or a gate value that ignores the skill counter.
 * @param {number} base_seed
 * @param {number} weapon_type
 * @param {number} attribute_force
 * @param {number} counter_gate
 * @param {number} counter_start
 * @param {number} counter_end
 * @param {Uint16Array} observations
 * @returns {Uint32Array}
 */
export function find_skill_counters(base_seed, weapon_type, attribute_force, counter_gate, counter_start, counter_end, observations) {
    const ptr0 = passArray16ToWasm0(observations, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.find_skill_counters(base_seed, weapon_type, attribute_force, counter_gate, counter_start, counter_end, ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * Generates flattened five-slot Keep Bonuses predictions beginning at the
 * supplied saved counter.
 *
 * `slot_categories` contains five category IDs in in-game slot order:
 * Attack=0, Affinity=1, Element=2, Sharpness/Ammo=3.
 *
 * # Errors
 *
 * Returns a JavaScript error when the category layout is malformed,
 * impossible for the weapon type, or the count is outside the Web UI limit.
 * @param {number} base_seed
 * @param {number} weapon_type
 * @param {number} attribute_force
 * @param {number} gogma_counter
 * @param {number} counter_gate
 * @param {number} count
 * @param {Uint8Array} slot_categories
 * @returns {Uint8Array}
 */
export function predict_gogma_keep_rolls(base_seed, weapon_type, attribute_force, gogma_counter, counter_gate, count, slot_categories) {
    const ptr0 = passArray8ToWasm0(slot_categories, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.predict_gogma_keep_rolls(base_seed, weapon_type, attribute_force, gogma_counter, counter_gate, count, ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * Generates flattened five-slot Reset Bonuses predictions beginning at the
 * supplied saved counter.
 *
 * # Errors
 *
 * Returns a JavaScript error when `count` is zero or exceeds the bounded Web
 * UI limit.
 * @param {number} base_seed
 * @param {number} weapon_type
 * @param {number} attribute_force
 * @param {number} gogma_counter
 * @param {number} counter_gate
 * @param {number} count
 * @returns {Uint8Array}
 */
export function predict_gogma_rolls(base_seed, weapon_type, attribute_force, gogma_counter, counter_gate, count) {
    const ret = wasm.predict_gogma_rolls(base_seed, weapon_type, attribute_force, gogma_counter, counter_gate, count);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v1;
}

/**
 * Generates consecutive series/group skill table indices beginning at the
 * supplied saved skill counter.
 *
 * # Errors
 *
 * Returns a JavaScript error when `count` is zero or exceeds the bounded Web
 * UI limit.
 * @param {number} base_seed
 * @param {number} weapon_type
 * @param {number} attribute_force
 * @param {number} skill_counter
 * @param {number} counter_gate
 * @param {number} count
 * @returns {Uint16Array}
 */
export function predict_skill_rolls(base_seed, weapon_type, attribute_force, skill_counter, counter_gate, count) {
    const ret = wasm.predict_skill_rolls(base_seed, weapon_type, attribute_force, skill_counter, counter_gate, count);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v1 = getArrayU16FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 2, 2);
    return v1;
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_344f42d3211c4765: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./gogma_wasm_search_bg.js": import0,
    };
}

const GogmaCounterSearchSessionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gogmacountersearchsession_free(ptr, 1));

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint16ArrayMemory0 = null;
function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.byteLength === 0) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray16ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 2, 2) >>> 0;
    getUint16ArrayMemory0().set(arg, ptr / 2);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint16ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('gogma_wasm_search_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
