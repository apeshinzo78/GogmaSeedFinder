/* tslint:disable */
/* eslint-disable */

/**
 * Stateful, single-threaded search cursor intended to run inside a Web Worker.
 */
export class GogmaCounterSearchSession {
    free(): void;
    [Symbol.dispose](): void;
    checked_seeds(): bigint;
    done(): boolean;
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
     */
    constructor(weapon_type: number, attribute_force: number, counter_gate: number, counter_start: number, counter_end: number, flat_observations: Uint8Array, seed_start: number, seed_end: number);
    /**
     * Searches at most `max_seeds` candidates and returns flattened
     * `[seed, counter, seed, counter, ...]` pairs as a `Uint32Array`.
     *
     * # Errors
     *
     * Returns a JavaScript error when `max_seeds` is zero or the next chunk
     * cannot be represented as a valid Rust seed range.
     */
    search_next(max_seeds: number): Uint32Array;
    total_seeds(): bigint;
}

/**
 * Finds saved skill counters that reproduce consecutive observed table
 * indices for a known base seed.
 *
 * # Errors
 *
 * Returns a JavaScript error for an invalid range, empty observations, an
 * invalid table index, or a gate value that ignores the skill counter.
 */
export function find_skill_counters(base_seed: number, weapon_type: number, attribute_force: number, counter_gate: number, counter_start: number, counter_end: number, observations: Uint16Array): Uint32Array;

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
 */
export function predict_gogma_keep_rolls(base_seed: number, weapon_type: number, attribute_force: number, gogma_counter: number, counter_gate: number, count: number, slot_categories: Uint8Array): Uint8Array;

/**
 * Generates flattened five-slot Reset Bonuses predictions beginning at the
 * supplied saved counter.
 *
 * # Errors
 *
 * Returns a JavaScript error when `count` is zero or exceeds the bounded Web
 * UI limit.
 */
export function predict_gogma_rolls(base_seed: number, weapon_type: number, attribute_force: number, gogma_counter: number, counter_gate: number, count: number): Uint8Array;

/**
 * Generates consecutive series/group skill table indices beginning at the
 * supplied saved skill counter.
 *
 * # Errors
 *
 * Returns a JavaScript error when `count` is zero or exceeds the bounded Web
 * UI limit.
 */
export function predict_skill_rolls(base_seed: number, weapon_type: number, attribute_force: number, skill_counter: number, counter_gate: number, count: number): Uint16Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_gogmacountersearchsession_free: (a: number, b: number) => void;
    readonly find_skill_counters: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number, number];
    readonly gogmacountersearchsession_checked_seeds: (a: number) => bigint;
    readonly gogmacountersearchsession_done: (a: number) => number;
    readonly gogmacountersearchsession_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number, number];
    readonly gogmacountersearchsession_search_next: (a: number, b: number) => [number, number, number, number];
    readonly gogmacountersearchsession_total_seeds: (a: number) => bigint;
    readonly predict_gogma_keep_rolls: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number, number];
    readonly predict_gogma_rolls: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly predict_skill_rolls: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
