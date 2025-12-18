import { describe, it, expect } from 'vitest';
import { internal } from './_generated/api';
import {
  createConvexTest,
  createTestUser,
  createTestSeason,
  createTestMatch,
  createTestTournament,
  getSeasonSnapshots,
  getPlayerLatestElo,
  MOCK_DATES,
} from './__tests__/setup';
import { STARTING_ELO, WIN_BONUS } from './eloCalculations';

describe('recalculateSeasonElo', () => {
  it('should initialize all players with starting ELO', async () => {
    const t = createConvexTest();

    // Arrange: Create test data
    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    await createTestMatch(t, player1, player2, MOCK_DATES.match1);

    // Act: Recalculate
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Assert: Both players should have starting ELO snapshot
    const snapshots = await getSeasonSnapshots(t, season);

    const player1Snapshots = snapshots.filter((s) => s.playerId === player1);
    const player2Snapshots = snapshots.filter((s) => s.playerId === player2);

    // Each player should have at least one snapshot (season_start)
    expect(player1Snapshots.length).toBeGreaterThan(0);
    expect(player2Snapshots.length).toBeGreaterThan(0);

    // Find the season_start snapshot
    const player1Start = player1Snapshots.find((s) => s.calculationMetadata?.reason === 'season_start');
    const player2Start = player2Snapshots.find((s) => s.calculationMetadata?.reason === 'season_start');

    expect(player1Start).toBeDefined();
    expect(player2Start).toBeDefined();
    expect(player1Start!.elo).toBe(STARTING_ELO);
    expect(player2Start!.elo).toBe(STARTING_ELO);
  });

  it('should correctly process match ELO changes', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    await createTestMatch(t, player1, player2, MOCK_DATES.match1);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const player1Elo = await getPlayerLatestElo(t, player1, season);
    const player2Elo = await getPlayerLatestElo(t, player2, season);

    // Winner (Alice) should have: STARTING_ELO + (STARTING_ELO * 0.08) + WIN_BONUS
    // = 100 + 8 + 2 = 110
    expect(player1Elo).toBe(110);

    // Loser (Bob) should have: STARTING_ELO - (STARTING_ELO * 0.08)
    // = 100 - 8 = 92
    expect(player2Elo).toBe(92);
  });

  it('should process multiple matches in chronological order', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Match 1: Alice beats Bob (Alice goes to 110, Bob to 92)
    await createTestMatch(t, player1, player2, MOCK_DATES.match1);
    // Match 2: Bob beats Alice
    await createTestMatch(t, player2, player1, MOCK_DATES.match2);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const player1Elo = await getPlayerLatestElo(t, player1, season);
    const player2Elo = await getPlayerLatestElo(t, player2, season);

    // After match 1: Alice=110, Bob=92
    // After match 2: Bob wins against Alice (110)
    //   Bob: 92 + floor(110 * 0.08) + 2 = 92 + 8 + 2 = 102
    //   Alice: 110 - 8 = 102
    expect(player1Elo).toBe(102);
    expect(player2Elo).toBe(102);
  });

  it('should handle three matches correctly', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Match 1: Alice beats Bob
    await createTestMatch(t, player1, player2, MOCK_DATES.match1);
    // Match 2: Bob beats Alice
    await createTestMatch(t, player2, player1, MOCK_DATES.match2);
    // Match 3: Alice beats Bob again
    await createTestMatch(t, player1, player2, MOCK_DATES.match3);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const player1Elo = await getPlayerLatestElo(t, player1, season);
    const player2Elo = await getPlayerLatestElo(t, player2, season);

    // After match 1: Alice=110, Bob=92
    // After match 2: Alice=102, Bob=102
    // After match 3: Alice wins against Bob (102)
    //   Alice: 102 + floor(102 * 0.08) + 2 = 102 + 8 + 2 = 112
    //   Bob: 102 - 8 = 94
    expect(player1Elo).toBe(112);
    expect(player2Elo).toBe(94);
  });

  it('should delete and recreate all snapshots on full recalculation', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    await createTestMatch(t, player1, player2, MOCK_DATES.match1);

    // First calculation
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const snapshotsBefore = await getSeasonSnapshots(t, season);
    const idsBefore = new Set(snapshotsBefore.map((s) => s._id));

    // Second calculation should delete and recreate
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const snapshotsAfter = await getSeasonSnapshots(t, season);
    const idsAfter = new Set(snapshotsAfter.map((s) => s._id));

    // Should have same count
    expect(snapshotsAfter.length).toBe(snapshotsBefore.length);

    // But different IDs (recreated)
    const hasOverlap = [...idsBefore].some((id) => idsAfter.has(id));
    expect(hasOverlap).toBe(false);
  });

  it('should return correct statistics', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    await createTestMatch(t, player1, player2, MOCK_DATES.match1);
    await createTestMatch(t, player2, player1, MOCK_DATES.match2);

    const result = await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    expect(result.playersProcessed).toBe(2);
    expect(result.matchesProcessed).toBe(2);
  });

  it('should throw error for invalid season ID', async () => {
    const t = createConvexTest();

    // Create a fake season ID with invalid format
    const fakeSeasonId = 'kg12345678901234567890' as any;

    // Validator should catch invalid ID format before the function runs
    await expect(
      t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: fakeSeasonId,
      })
    ).rejects.toThrow('Validator error');
  });

  it('should handle tournament bonuses', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Match gives Alice 110 ELO
    await createTestMatch(t, player1, player2, MOCK_DATES.match1);

    // Tournament won by Alice (should add 8% of current ELO)
    await createTestTournament(t, 'Tournament 1', MOCK_DATES.tournament1, player1);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const player1Elo = await getPlayerLatestElo(t, player1, season);

    // After match: Alice has 110
    // Tournament bonus: floor(110 * 0.08) = 8
    // Final: 110 + 8 = 118
    expect(player1Elo).toBe(118);
  });

  it('should only process matches within season boundaries', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Match within season
    await createTestMatch(t, player1, player2, MOCK_DATES.match1);

    // Match before season
    await createTestMatch(t, player1, player2, MOCK_DATES.seasonStart - 1000);

    // Match after season
    await createTestMatch(t, player1, player2, MOCK_DATES.seasonEnd + 1000);

    const result = await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Should only process the 1 match within boundaries
    expect(result.matchesProcessed).toBe(1);
  });

  it('should filter out deleted matches', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Create match
    const matchId = await createTestMatch(t, player1, player2, MOCK_DATES.match1);

    // Soft delete the match
    await t.run(async (ctx: any) => {
      await ctx.db.patch(matchId, { deleted: true });
    });

    const result = await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Should not process deleted match
    expect(result.matchesProcessed).toBe(0);
  });

  it('should handle players with no prior snapshots', async () => {
    const t = createConvexTest();

    const player1 = await createTestUser(t, 'Alice');
    const player2 = await createTestUser(t, 'Bob');
    const player3 = await createTestUser(t, 'Charlie');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Only Alice and Bob play
    await createTestMatch(t, player1, player2, MOCK_DATES.match1);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Charlie should have no snapshots in this season
    const player3Elo = await getPlayerLatestElo(t, player3, season);
    expect(player3Elo).toBeNull();

    // Alice and Bob should have snapshots
    const player1Elo = await getPlayerLatestElo(t, player1, season);
    const player2Elo = await getPlayerLatestElo(t, player2, season);

    expect(player1Elo).not.toBeNull();
    expect(player2Elo).not.toBeNull();
  });
});
