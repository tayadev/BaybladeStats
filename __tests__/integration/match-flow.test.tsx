import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { api, internal } from '@/convex/_generated/api';
import schema from '@/convex/schema';
import {
  createTestUser,
  createTestSeason,
  createTestMatch,
  createTestTournament,
  getPlayerLatestElo,
  MOCK_DATES,
} from '@/convex/__tests__/setup';

/**
 * E2E Integration Test: Match Creation Flow
 *
 * Tests the complete flow of match operations:
 * 1. Create match
 * 2. Trigger ELO recalculation
 * 3. Verify leaderboard updates
 * 4. Test match updates and deletions
 * 5. Verify data consistency throughout
 */

describe('Match Creation Flow', () => {
  it('should create match and update ELO automatically', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    // Setup
    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Get initial ELO (should be null - no matches yet)
    const aliceEloBefore = await getPlayerLatestElo(t, alice, season);
    expect(aliceEloBefore).toBeNull();

    // Create match
    const matchId = await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    expect(matchId).toBeDefined();

    // Trigger recalculation
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Verify ELO updated
    const aliceEloAfter = await getPlayerLatestElo(t, alice, season);
    const bobEloAfter = await getPlayerLatestElo(t, bob, season);

    expect(aliceEloAfter).toBe(110); // 100 + 8 + 2
    expect(bobEloAfter).toBe(92);    // 100 - 8
  });

  it('should handle rapid match creation', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Create multiple matches quickly
    const match1 = await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    const match2 = await createTestMatch(t, bob, alice, MOCK_DATES.match2);
    const match3 = await createTestMatch(t, alice, bob, MOCK_DATES.match3);

    expect(match1).toBeDefined();
    expect(match2).toBeDefined();
    expect(match3).toBeDefined();

    // Recalculate once after all matches
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Verify final ELO is correct
    const aliceElo = await getPlayerLatestElo(t, alice, season);
    const bobElo = await getPlayerLatestElo(t, bob, season);

    // After 3 matches with wins alternating, ELOs should be calculated correctly
    expect(aliceElo).toBeGreaterThan(100); // Net positive
    expect(bobElo).toBeLessThan(100);      // Net negative
  });

  it('should update match and recalculate ELO', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const charlie = await createTestUser(t, 'Charlie');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Create match: Alice beats Bob
    const matchId = await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const aliceEloBefore = await getPlayerLatestElo(t, alice, season);
    const bobEloBefore = await getPlayerLatestElo(t, bob, season);

    // Update match: Change winner to Charlie (simulating a correction)
    await t.run(async (ctx) => {
      await ctx.db.patch(matchId, {
        winner: charlie,
        loser: bob,
      });
    });

    // Recalculate
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const aliceEloAfter = await getPlayerLatestElo(t, alice, season);
    const charlieEloAfter = await getPlayerLatestElo(t, charlie, season);

    // Alice should be back to starting ELO (no matches)
    expect(aliceEloAfter).toBeNull();

    // Charlie should have winning ELO
    expect(charlieEloAfter).toBe(110);
  });

  it('should delete match and recalculate ELO', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Create two matches
    const match1 = await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    const match2 = await createTestMatch(t, alice, bob, MOCK_DATES.match2);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const aliceEloWith2Matches = await getPlayerLatestElo(t, alice, season);

    // Soft delete first match
    await t.run(async (ctx) => {
      await ctx.db.patch(match1, { deleted: true });
    });

    // Recalculate
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const aliceEloWith1Match = await getPlayerLatestElo(t, alice, season);

    // ELO should be lower with only 1 match
    expect(aliceEloWith1Match).toBeLessThan(aliceEloWith2Matches!);
    expect(aliceEloWith1Match).toBe(110); // One match win
  });

  it('should handle cross-season match correctly', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');

    // Create two seasons
    const season1 = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);
    const season2Start = MOCK_DATES.seasonEnd + 1;
    const season2End = season2Start + (365 * 24 * 60 * 60 * 1000);
    const season2 = await createTestSeason(t, 'Season 2', season2Start, season2End);

    // Match in season 1
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season1,
    });

    // Match in season 2
    await createTestMatch(t, bob, alice, season2Start + 1000);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season2,
    });

    // Verify independent seasons
    const aliceSeason1Elo = await getPlayerLatestElo(t, alice, season1);
    const aliceSeason2Elo = await getPlayerLatestElo(t, alice, season2);

    // Season 1: Alice won
    expect(aliceSeason1Elo).toBe(110);

    // Season 2: Alice lost (should start fresh at 100, then lose)
    expect(aliceSeason2Elo).toBe(92);
  });

  it('should maintain data consistency across tournament and match', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Tournament with matches
    const tournamentId = await createTestTournament(t, 'Championship', MOCK_DATES.tournament1, alice);

    // Add matches within tournament
    await createTestMatch(t, alice, bob, MOCK_DATES.match1, tournamentId);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Query tournament data
    const tournament = await t.query(api.myFunctions.getTournamentById, {
      id: tournamentId,
    });

    const tournamentMatches = await t.query(api.myFunctions.getTournamentMatches, {
      tournamentId,
    });

    const aliceElo = await getPlayerLatestElo(t, alice, season);

    // Verify tournament data
    expect(tournament).not.toBeNull();
    expect(tournament?.winner).toBe(alice);

    // Verify tournament matches
    expect(tournamentMatches).toHaveLength(1);
    expect(tournamentMatches[0].tournament).toBe(tournamentId);

    // Alice should have: match win (110) + tournament bonus (~8)
    expect(aliceElo).toBeGreaterThan(110);
    expect(aliceElo).toBe(118); // 110 + floor(110 * 0.08) = 110 + 8
  });

  it('should handle match date validation for seasons', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Create match before season start
    await createTestMatch(t, alice, bob, MOCK_DATES.seasonStart - 1000);

    // Create match during season
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);

    // Create match after season end
    await createTestMatch(t, alice, bob, MOCK_DATES.seasonEnd + 1000);

    const result = await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Only 1 match should be processed (the one within season boundaries)
    expect(result.matchesProcessed).toBe(1);
  });

  it('should reflect match changes in leaderboard immediately', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const charlie = await createTestUser(t, 'Charlie');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Initial matches
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await createTestMatch(t, charlie, bob, MOCK_DATES.match2);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const leaderboard1 = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season,
    });

    // Add new match that changes rankings
    await createTestMatch(t, bob, alice, MOCK_DATES.match3);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const leaderboard2 = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season,
    });

    // Leaderboard should have changed
    expect(leaderboard1[0].playerId).not.toBe(leaderboard2[0].playerId);

    // All players should still be present
    expect(leaderboard2).toHaveLength(3);
  });
});
