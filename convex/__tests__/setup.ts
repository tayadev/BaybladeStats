import { convexTest } from "convex-test";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

/**
 * Convex test helper utilities
 * Based on: https://docs.convex.dev/testing
 */

// Import all Convex modules for testing
// This is required for t.run() to work properly
const modules = import.meta.glob("../**/*.ts");

export function createConvexTest() {
  return convexTest(schema, modules);
}

/**
 * Mock date constants for consistent testing
 */
export const MOCK_DATES = {
  seasonStart: new Date('2024-01-01T00:00:00Z').getTime(),
  seasonEnd: new Date('2024-12-31T23:59:59Z').getTime(),
  match1: new Date('2024-02-01T12:00:00Z').getTime(),
  match2: new Date('2024-03-01T12:00:00Z').getTime(),
  match3: new Date('2024-04-01T12:00:00Z').getTime(),
  tournament1: new Date('2024-05-01T12:00:00Z').getTime(),
};

/**
 * Create a test user directly in the database (bypassing auth)
 *
 * Note: This bypasses the createPlayer mutation which requires judge authentication.
 * For integration tests, we insert users directly into the database.
 */
export async function createTestUser(
  t: any,
  name: string,
  role: 'player' | 'judge' = 'player'
): Promise<Id<'users'>> {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert('users', {
      name,
      role,
    });
  });
}

/**
 * Create a test season directly in the database
 */
export async function createTestSeason(
  t: any,
  name: string,
  start: number,
  end: number
): Promise<Id<'seasons'>> {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert('seasons', {
      name,
      start,
      end,
    });
  });
}

/**
 * Create a test tournament directly in the database
 */
export async function createTestTournament(
  t: any,
  name: string,
  date: number,
  winner: Id<'users'>
): Promise<Id<'tournaments'>> {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert('tournaments', {
      name,
      date,
      winner,
    });
  });
}

/**
 * Create a test match directly in the database
 */
export async function createTestMatch(
  t: any,
  winner: Id<'users'>,
  loser: Id<'users'>,
  date: number,
  tournament?: Id<'tournaments'>
): Promise<Id<'matches'>> {
  return await t.run(async (ctx: any) => {
    return await ctx.db.insert('matches', {
      winner,
      loser,
      date,
      tournament,
    });
  });
}

/**
 * Get all ELO snapshots for a season
 */
export async function getSeasonSnapshots(
  t: any,
  seasonId: Id<'seasons'>
) {
  return await t.run(async (ctx: any) => {
    return await ctx.db
      .query('eloSnapshots')
      .withIndex('by_season', (q: any) => q.eq('seasonId', seasonId))
      .collect();
  });
}

/**
 * Get all ELO snapshots for a player in a season
 */
export async function getPlayerSeasonSnapshots(
  t: any,
  playerId: Id<'users'>,
  seasonId: Id<'seasons'>
) {
  return await t.run(async (ctx: any) => {
    return await ctx.db
      .query('eloSnapshots')
      .withIndex('by_player_season', (q: any) =>
        q.eq('playerId', playerId).eq('seasonId', seasonId)
      )
      .collect();
  });
}

/**
 * Get the latest ELO for a player in a season
 */
export async function getPlayerLatestElo(
  t: any,
  playerId: Id<'users'>,
  seasonId: Id<'seasons'>
): Promise<number | null> {
  const snapshots = await getPlayerSeasonSnapshots(t, playerId, seasonId);
  if (snapshots.length === 0) return null;

  const latest = snapshots.sort((a, b) => b.timestamp - a.timestamp)[0];
  return latest.elo;
}
