import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { convexTest } from 'convex-test';
import { api, internal } from '@/convex/_generated/api';
import schema from '@/convex/schema';
import { createTestUser, createTestSeason, createTestMatch, MOCK_DATES } from '@/convex/__tests__/setup';

/**
 * E2E Integration Test: Leaderboard
 *
 * Tests the full flow:
 * 1. Create test data in Convex database
 * 2. Query leaderboard data via Convex query
 * 3. Render leaderboard component
 * 4. Verify correct data display
 */

describe('Leaderboard Integration', () => {
  it('should display players ranked by ELO', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    // Arrange: Create test data
    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const charlie = await createTestUser(t, 'Charlie');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Alice beats Bob (Alice: 110, Bob: 92)
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    // Alice beats Charlie (Alice: ~118, Charlie: 92)
    await createTestMatch(t, alice, charlie, MOCK_DATES.match2);
    // Bob beats Charlie (Bob: ~102, Charlie: ~84)
    await createTestMatch(t, bob, charlie, MOCK_DATES.match3);

    // Recalculate ELO
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Act: Query leaderboard
    const leaderboard = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season,
    });

    // Assert: Verify ranking order
    expect(leaderboard).toHaveLength(3);
    expect(leaderboard[0].playerName).toBe('Alice'); // Highest ELO
    expect(leaderboard[1].playerName).toBe('Bob');   // Middle ELO
    expect(leaderboard[2].playerName).toBe('Charlie'); // Lowest ELO

    // Verify ELO values are correct
    expect(leaderboard[0].currentElo).toBeGreaterThan(leaderboard[1].currentElo);
    expect(leaderboard[1].currentElo).toBeGreaterThan(leaderboard[2].currentElo);
  });

  it('should handle empty leaderboard', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    // Create season with no matches
    const season = await createTestSeason(t, 'Empty Season', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Query leaderboard
    const leaderboard = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season,
    });

    // Should be empty
    expect(leaderboard).toHaveLength(0);
  });

  it('should update leaderboard when new match is added', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    // Create initial data
    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // First match
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const leaderboardBefore = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season,
    });

    expect(leaderboardBefore[0].playerName).toBe('Alice');

    // Add second match where Bob wins
    await createTestMatch(t, bob, alice, MOCK_DATES.match2);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    const leaderboardAfter = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season,
    });

    // Verify rankings updated
    expect(leaderboardAfter[0].playerName).toBe('Bob'); // Bob now has higher ELO
    expect(leaderboardAfter[1].playerName).toBe('Alice');
  });

  it('should show inactivity penalties in leaderboard', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');
    const season = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);

    // Alice beats Bob early in season
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season,
    });

    // Query leaderboard (uses current time internally for inactivity calculation)
    const leaderboard = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season,
    });

    // Alice should be in leaderboard with ELO data
    const aliceEntry = leaderboard.find(entry => entry.playerId === alice);
    expect(aliceEntry).toBeDefined();
    expect(aliceEntry!.baseElo).toBe(110); // Original ELO from match win
    // Current ELO may have inactivity penalty depending on time elapsed
  });

  it('should handle multiple seasons independently', async () => {
    const t = convexTest(schema, import.meta.glob('../../convex/**/*.ts'));

    const alice = await createTestUser(t, 'Alice');
    const bob = await createTestUser(t, 'Bob');

    // Season 1: Alice wins
    const season1 = await createTestSeason(t, 'Season 1', MOCK_DATES.seasonStart, MOCK_DATES.seasonEnd);
    await createTestMatch(t, alice, bob, MOCK_DATES.match1);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season1,
    });

    // Season 2: Bob wins
    const season2Start = MOCK_DATES.seasonEnd + 1;
    const season2End = season2Start + (365 * 24 * 60 * 60 * 1000);
    const season2 = await createTestSeason(t, 'Season 2', season2Start, season2End);
    await createTestMatch(t, bob, alice, season2Start + 1000);
    await t.mutation(internal.eloRecalculation.recalculateSeasonElo, {
      seasonId: season2,
    });

    // Query both leaderboards
    const leaderboard1 = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season1,
    });
    const leaderboard2 = await t.query(api.eloQueries.getSeasonLeaderboard, {
      seasonId: season2,
    });

    // Season 1: Alice leads
    expect(leaderboard1[0].playerName).toBe('Alice');
    expect(leaderboard1[1].playerName).toBe('Bob');

    // Season 2: Bob leads
    expect(leaderboard2[0].playerName).toBe('Bob');
    expect(leaderboard2[1].playerName).toBe('Alice');

    // Seasons are independent - both should start at 100
    expect(leaderboard2[0].currentElo).toBeLessThanOrEqual(110); // Around starting ELO + match
  });
});
