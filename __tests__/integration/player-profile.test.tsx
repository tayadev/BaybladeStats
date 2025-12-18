import { describe, it, expect } from 'vitest';
import { convexTest } from 'convex-test';
import { api, internal } from '@/convex/_generated/api';
import schema from '@/convex/schema';
import {
  createTestUser,
  createTestSeason,
  createTestMatch,
  createTestTournament,
  MOCK_DATES,
} from '@/convex/__tests__/setup';

/**
 * E2E Integration Test: Player Profile
 *
 * Tests the full flow of fetching and displaying player data:
 * 1. Create player with match history
 * 2. Query player stats, ELO history, matches
 * 3. Verify data accuracy and completeness
 */

describe('Player Profile Integration', () => {
  it('should fetch complete player profile with stats', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    // Arrange: Create player with match history
    const alice = await createTestUser(t, 'Alice Player');
    const bob = await createTestUser(t, 'Bob');
    const charlie = await createTestUser(t, 'Charlie');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Alice's matches: 2 wins, 1 loss
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await createTestMatch(t, alice, charlie, MOCK_DATES.match2);
    await createTestMatch(t, bob, alice, MOCK_DATES.match3);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Act: Query player data
    const player = await t.query(api.myFunctions.getUserById, {
      id: alice,
    });

    const stats = await t.query(api.eloQueries.getPlayerSeasonStats, {
      playerId: alice,
      seasonId: season,
    });

    const matches = await t.query(api.myFunctions.getPlayerMatches, {
      playerId: alice,
    });

    // Assert: Verify player info
    expect(player).not.toBeNull();
    expect(player?.name).toBe('Alice Player');
    expect(player?.role).toBe('player');

    // Verify stats
    expect(stats).not.toBeNull();
    expect(stats?.wins).toBe(2);
    expect(stats?.losses).toBe(1);
    expect(stats?.currentElo).toBeLessThan(120); // Should be around 100-120 range

    // Verify matches
    expect(matches).toHaveLength(3);
    expect(matches.some(m => m.winner === alice)).toBe(true);
    expect(matches.some(m => m.loser === alice)).toBe(true);
  });

  it('should fetch player ELO history timeline', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Create match history
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await createTestMatch(t, bob, alice, MOCK_DATES.match2);
    await createTestMatch(t, alice, bob, MOCK_DATES.match3);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Query ELO history
    const history = await t.query(api.eloQueries.getPlayerEloHistory, {
      playerId: alice,
      seasonId: season,
    });

    // Verify history structure
    expect(history).toBeDefined();
    expect(history.length).toBeGreaterThan(0);

    // Should have snapshots in chronological order
    const timestamps = history.map(h => h.timestamp);
    const isSorted = timestamps.every((val, i, arr) => i === 0 || arr[i - 1] <= val);
    expect(isSorted).toBe(true);

    // Should include season_start, match wins/losses
    const reasons = history.map(h => h.metadata?.reason);
    expect(reasons).toContain('season_start');
    expect(reasons).toContain('match_win');
    expect(reasons).toContain('match_loss');
  });

  it('should track player across multiple seasons', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');

    // Season 1
    const season1 = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season1,
    });

    // Season 2
    const season2Start = MOCK_DATES.seasonEnd + 1;
    const season2End = season2Start + (365 * 24 * 60 * 60 * 1000);
    const season2 = await createTestSeason(t, 'Season 2', season2Start, season2End);
    await createTestMatch(t, alice, bob, season2Start + 1000);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season2,
    });

    // Query player seasons
    const seasons = await t.query(api.myFunctions.getPlayerSeasons, {
      playerId: alice,
    });

    // Should participate in both seasons
    expect(seasons.length).toBeGreaterThanOrEqual(2);
    expect(seasons.some(s => s._id === season1)).toBe(true);
    expect(seasons.some(s => s._id === season2)).toBe(true);
  });

  it('should show match ELO changes for player', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    const matchId = await createTestMatch(t, alice, bob, MOCK_DATES.match1);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Query match ELO changes
    const changes = await t.query(api.eloQueries.getMatchEloChanges, {
      matchId,
    });

    // Verify changes structure
    expect(changes).not.toBeNull();
    expect(changes?.winner).toBeDefined();
    expect(changes?.loser).toBeDefined();

    // Winner's new ELO should be higher than before
    expect(changes?.winner.newElo).toBeGreaterThan(changes?.winner.previousElo);

    // Loser's new ELO should be lower than before
    expect(changes?.loser.newElo).toBeLessThan(changes?.loser.previousElo);

    // Winner should have positive change
    expect(changes?.winner.change).toBeGreaterThan(0);

    // Loser should have negative change
    expect(changes?.loser.change).toBeLessThan(0);
  });

  it('should display tournament bonuses in player history', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Alice wins match to get higher ELO
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);

    // Alice wins tournament
    await createTestTournament(t, 'Championship', MOCK_DATES.tournament1, alice);

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Query Alice's ELO history
    const history = await t.query(api.eloQueries.getPlayerEloHistory, {
      playerId: alice,
      seasonId: season,
    });

    // Should include tournament bonus
    const tournamentSnapshot = history.find(
      h => h.metadata?.reason === 'tournament_bonus'
    );

    expect(tournamentSnapshot).toBeDefined();
    expect(tournamentSnapshot?.metadata?.tournamentBonus).toBeGreaterThan(0);
  });

  it('should handle player with no match history', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const newPlayer = await createTestUser(t, 'New Player');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Query player data
    const player = await t.query(api.myFunctions.getUserById, {
      id: newPlayer,
    });

    const stats = await t.query(api.eloQueries.getPlayerSeasonStats, {
      playerId: newPlayer,
      seasonId: season,
    });

    const matches = await t.query(api.myFunctions.getPlayerMatches, {
      playerId: newPlayer,
    });

    // Player should exist
    expect(player).not.toBeNull();

    // Stats should show zeros (API returns object with zeros, not null)
    expect(stats?.wins).toBe(0);
    expect(stats?.losses).toBe(0);
    expect(stats?.currentElo).toBe(0);

    // No matches
    expect(matches).toHaveLength(0);
  });

  it('should show correct win/loss ratio', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const charlie = await createTestUser(t, 'Charlie');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Alice: 3 wins, 1 loss
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await createTestMatch(t, alice, charlie, MOCK_DATES.match2);
    await createTestMatch(t, alice, bob, MOCK_DATES.match3);
    await createTestMatch(t, charlie, alice, new Date('2024-04-15T12:00:00Z').getTime());

    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const stats = await t.query(api.eloQueries.getPlayerSeasonStats, {
      playerId: alice,
      seasonId: season,
    });

    expect(stats?.wins).toBe(3);
    expect(stats?.losses).toBe(1);

    // Win rate should be 75%
    const winRate = stats!.wins / (stats!.wins + stats!.losses);
    expect(winRate).toBe(0.75);
  });
});
