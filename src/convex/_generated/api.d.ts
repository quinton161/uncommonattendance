/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminActions from "../adminActions.js";
import type * as appUpdates from "../appUpdates.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as checkoutReflections from "../checkoutReflections.js";
import type * as dailyAttendance from "../dailyAttendance.js";
import type * as dailyGoals from "../dailyGoals.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as hubs from "../hubs.js";
import type * as monthlyAwards from "../monthlyAwards.js";
import type * as notifications from "../notifications.js";
import type * as qrCodes from "../qrCodes.js";
import type * as resend from "../resend.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as weeklyGoals from "../weeklyGoals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminActions: typeof adminActions;
  appUpdates: typeof appUpdates;
  attendance: typeof attendance;
  auth: typeof auth;
  checkoutReflections: typeof checkoutReflections;
  dailyAttendance: typeof dailyAttendance;
  dailyGoals: typeof dailyGoals;
  events: typeof events;
  http: typeof http;
  hubs: typeof hubs;
  monthlyAwards: typeof monthlyAwards;
  notifications: typeof notifications;
  qrCodes: typeof qrCodes;
  resend: typeof resend;
  seed: typeof seed;
  users: typeof users;
  weeklyGoals: typeof weeklyGoals;
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
