/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as journal from "../journal.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_storage from "../lib/storage.js";
import type * as maintenance from "../maintenance.js";
import type * as profile from "../profile.js";
import type * as profileDefaults from "../profileDefaults.js";
import type * as sampleWorks from "../sampleWorks.js";
import type * as seed from "../seed.js";
import type * as works from "../works.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  journal: typeof journal;
  "lib/auth": typeof lib_auth;
  "lib/storage": typeof lib_storage;
  maintenance: typeof maintenance;
  profile: typeof profile;
  profileDefaults: typeof profileDefaults;
  sampleWorks: typeof sampleWorks;
  seed: typeof seed;
  works: typeof works;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
