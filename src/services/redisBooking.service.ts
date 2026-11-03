import Redis from "ioredis";
import getRedisClient from "../config/redis";
import {
  SeatUnavailableError,
  ServerOverloadError,
  DuplicateBookingError,
  DatabaseSyncError,
} from "../errors/customErrors";

export interface ReservationParams {
  trainId: string;
  journeyDate: string; // "YYYY-MM-DD"
  travelClass: string; // "3A", "SL", etc.
  quota: string;       // "TATKAL"
  requestedSeats: number;
  idempotencyKey: string;
  userId: string;
}

export interface ReservationResult {
  secured: boolean;
  remainingSeats: number;
  inventoryKey: string;
  idempotencyKey: string;
  lockToken: string;
}

// ---------------------------------------------------------------------------
// Lua Scripts for Atomic Operations
// ---------------------------------------------------------------------------

/**
 * Atomic Seat Check-and-Decrement Script
 *
 * KEYS[1]: seat_inventory:{trainId}:{journeyDate}:{travelClass}:{quota}
 * ARGV[1]: requestedSeats (e.g. 1)
 *
 * Returns:
 *   [1, remainingSeats]  => Success: Seats atomically secured
 *   [-1, currentSeats]   => Seat Unavailable: currentSeats < requestedSeats
 *   [-2, 0]              => Inventory Key does not exist / uninitialized
 */
const ATOMIC_DECREMENT_LUA = `
local inventoryKey = KEYS[1]
local requested = tonumber(ARGV[1])

local current = redis.call('GET', inventoryKey)
if not current then
  return { -2, 0 }
end

local available = tonumber(current)
if available < requested then
  return { -1, available }
end

local remaining = redis.call('DECRBY', inventoryKey, requested)
return { 1, remaining }
`;

/**
 * Compensation Rollback Script: Restores inventory if PostgreSQL transaction fails
 *
 * KEYS[1]: seat_inventory:{trainId}:{journeyDate}:{travelClass}:{quota}
 * ARGV[1]: seatsToRestore
 */
const ATOMIC_ROLLBACK_LUA = `
local inventoryKey = KEYS[1]
local restoreCount = tonumber(ARGV[1])
local remaining = redis.call('INCRBY', inventoryKey, restoreCount)
return remaining
`;

/**
 * Distributed Lock Release Script (Redlock-compatible single-instance primitive)
 * Ensures only the owner who acquired the lock can release it.
 *
 * KEYS[1]: lockKey
 * ARGV[1]: lockToken
 */
const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export class RedisBookingService {
  private redis: Redis;

  constructor(redis?: Redis) {
    this.redis = redis || getRedisClient();
  }

  /**
   * Generates standard cache key for seat inventory
   */
  public getInventoryKey(trainId: string, journeyDate: string, travelClass: string, quota: string): string {
    return `seat_inventory:${trainId}:${journeyDate}:${travelClass.toUpperCase()}:${quota.toUpperCase()}`;
  }

  /**
   * Generates standard key for idempotency lock
   */
  private getIdempotencyKey(key: string): string {
    return `idempotency:booking:${key}`;
  }

  /**
   * Seeds / initializes seat inventory in Redis (used by admin or DB sync)
   */
  public async initializeInventory(
    trainId: string,
    journeyDate: string,
    travelClass: string,
    quota: string,
    seats: number
  ): Promise<void> {
    const key = this.getInventoryKey(trainId, journeyDate, travelClass, quota);
    await this.redis.set(key, seats);
  }

  /**
   * Reads current available seats from Redis cache
   */
  public async getAvailableSeats(
    trainId: string,
    journeyDate: string,
    travelClass: string,
    quota: string
  ): Promise<number | null> {
    const key = this.getInventoryKey(trainId, journeyDate, travelClass, quota);
    const count = await this.redis.get(key);
    return count !== null ? parseInt(count, 10) : null;
  }

  /**
   * Atomically verifies and reserves seats in Redis during high-concurrency 10:00 AM spikes.
   *
   * Flow:
   * 1. Acquires idempotency guard to eliminate duplicate concurrent clicks.
   * 2. Executes atomic Lua script to inspect seat availability and decrement.
   * 3. Guarantees zero overselling under arbitrarily high concurrency.
   * 4. Categorizes errors into SeatUnavailable vs ServerOverload.
   */
  public async reserveSeatAtomically(params: ReservationParams): Promise<ReservationResult> {
    const {
      trainId,
      journeyDate,
      travelClass,
      quota,
      requestedSeats,
      idempotencyKey,
      userId,
    } = params;

    const inventoryKey = this.getInventoryKey(trainId, journeyDate, travelClass, quota);
    const idemKey = this.getIdempotencyKey(idempotencyKey);
    const lockToken = `${userId}:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;

    // -----------------------------------------------------------------------
    // Step 1: Idempotency Protection (SET NX EX 60)
    // -----------------------------------------------------------------------
    let idempotencyAcquired: string | null = null;
    try {
      // Lock for 60 seconds during processing
      idempotencyAcquired = await this.redis.set(idemKey, lockToken, "EX", 60, "NX");
    } catch (err: any) {
      this.handleRedisConnectionError(err, "Idempotency Lock Acquisition");
    }

    if (!idempotencyAcquired) {
      throw new DuplicateBookingError(
        idempotencyKey,
        "A booking with this idempotency key is already in progress or has been submitted."
      );
    }

    // -----------------------------------------------------------------------
    // Step 2: Atomic Lua Execution (Seat Check & Decrement)
    // -----------------------------------------------------------------------
    let luaResult: [number, number];
    try {
      const rawResult = (await this.redis.eval(
        ATOMIC_DECREMENT_LUA,
        1,
        inventoryKey,
        requestedSeats
      )) as [number, number];
      luaResult = rawResult;
    } catch (err: any) {
      // Release idempotency lock so user can retry upon server recovery
      await this.releaseIdempotencyLock(idemKey, lockToken).catch(() => {});
      this.handleRedisConnectionError(err, "Atomic Seat Decrement");
      throw err; // unreachable, handled above
    }

    const [status, remainingOrAvailable] = luaResult;

    // Status -2: Key does not exist in Redis
    if (status === -2) {
      await this.releaseIdempotencyLock(idemKey, lockToken).catch(() => {});
      throw new SeatUnavailableError(
        `Tatkal booking has not opened or inventory is uninitialized for Train ${trainId} on ${journeyDate}.`,
        { trainId, journeyDate, travelClass, quota, requestedSeats, availableSeats: 0 }
      );
    }

    // Status -1: Insufficient seats remaining
    if (status === -1) {
      await this.releaseIdempotencyLock(idemKey, lockToken).catch(() => {});
      throw new SeatUnavailableError(
        `Tatkal quota exhausted. Requested ${requestedSeats} seat(s), but only ${remainingOrAvailable} seat(s) remain.`,
        {
          trainId,
          journeyDate,
          travelClass,
          quota,
          requestedSeats,
          availableSeats: remainingOrAvailable,
        }
      );
    }

    // Status 1: Seats successfully secured atomically
    return {
      secured: true,
      remainingSeats: remainingOrAvailable,
      inventoryKey,
      idempotencyKey,
      lockToken,
    };
  }

  /**
   * Compensation logic: Restores seats in Redis if PostgreSQL transaction fails.
   */
  public async rollbackReservation(
    inventoryKey: string,
    seatsToRestore: number,
    idempotencyKey: string,
    lockToken: string
  ): Promise<number> {
    try {
      const remaining = (await this.redis.eval(
        ATOMIC_ROLLBACK_LUA,
        1,
        inventoryKey,
        seatsToRestore
      )) as number;

      // Release idempotency lock
      const idemKey = this.getIdempotencyKey(idempotencyKey);
      await this.releaseIdempotencyLock(idemKey, lockToken);

      console.warn(
        `[Compensation] Successfully rolled back ${seatsToRestore} seat(s) to ${inventoryKey}. Remaining: ${remaining}`
      );
      return remaining;
    } catch (err: any) {
      console.error(
        `[CRITICAL COMPENSATION FAILURE] Failed to rollback seats to ${inventoryKey}:`,
        err.message
      );
      throw new DatabaseSyncError(
        "Failed to rollback reserved seats in cache after database error.",
        { inventoryKey, seatsToRestore, originalError: err.message }
      );
    }
  }

  /**
   * Releases an idempotency lock token safely
   */
  private async releaseIdempotencyLock(idemKey: string, lockToken: string): Promise<void> {
    await this.redis.eval(RELEASE_LOCK_LUA, 1, idemKey, lockToken);
  }

  /**
   * Categorizes network/pool/timeout errors specifically as ServerOverloadError
   */
  private handleRedisConnectionError(err: any, operationContext: string): never {
    const msg = err.message || "";
    console.error(`[Redis Failure during ${operationContext}]:`, msg);

    // Specific network or pool overload conditions
    if (
      msg.includes("ETIMEDOUT") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("Command timed out") ||
      msg.includes("max number of clients reached") ||
      msg.includes("Connection is closed") ||
      msg.includes("OOM") ||
      msg.includes("LOADING")
    ) {
      throw new ServerOverloadError(
        "Tatkal booking engine is under extreme load. Connection pool or lock saturated. Please retry.",
        2,
        { subsystem: "redis_pool" }
      );
    }

    // Default to server overload if Redis fails during peak rush
    throw new ServerOverloadError(
      `Tatkal booking engine temporarily unable to process request (${msg}). Please retry.`,
      3,
      { subsystem: "redis_lock" }
    );
  }
}

export default new RedisBookingService();

