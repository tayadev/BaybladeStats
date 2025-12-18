import { describe, it, expect } from 'vitest';
import {
  calculateMatchElo,
  calculateTournamentBonus,
  calculateInactivityPenalty,
  STARTING_ELO,
  LOSS_PERCENTAGE,
  WIN_BONUS,
  TOURNAMENT_BONUS_PERCENTAGE,
  INACTIVITY_DAYS,
  INACTIVITY_PENALTY_PERCENTAGE,
} from './eloCalculations';

describe('calculateMatchElo', () => {
  it('should calculate ELO transfer correctly for equal players', () => {
    const result = calculateMatchElo(100, 100);

    expect(result.pointsTransferred).toBe(8); // 100 * 0.08 = 8
    expect(result.newLoserElo).toBe(92);      // 100 - 8 = 92
    expect(result.newWinnerElo).toBe(110);    // 100 + 8 + 2 = 110
  });

  it('should calculate ELO transfer for different ratings', () => {
    const result = calculateMatchElo(150, 200);

    expect(result.pointsTransferred).toBe(16); // 200 * 0.08 = 16
    expect(result.newLoserElo).toBe(184);      // 200 - 16 = 184
    expect(result.newWinnerElo).toBe(168);     // 150 + 16 + 2 = 168
  });

  it('should floor points transferred', () => {
    const result = calculateMatchElo(100, 105);

    expect(result.pointsTransferred).toBe(8); // floor(105 * 0.08) = floor(8.4) = 8
    expect(result.newLoserElo).toBe(97);      // 105 - 8 = 97
    expect(result.newWinnerElo).toBe(110);    // 100 + 8 + 2 = 110
  });

  it('should handle high ELO differences', () => {
    const result = calculateMatchElo(100, 500);

    expect(result.pointsTransferred).toBe(40); // 500 * 0.08 = 40
    expect(result.newLoserElo).toBe(460);      // 500 - 40 = 460
    expect(result.newWinnerElo).toBe(142);     // 100 + 40 + 2 = 142
  });

  it('should handle low loser ELO', () => {
    const result = calculateMatchElo(100, 10);

    expect(result.pointsTransferred).toBe(0);  // floor(10 * 0.08) = floor(0.8) = 0
    expect(result.newLoserElo).toBe(10);       // 10 - 0 = 10
    expect(result.newWinnerElo).toBe(102);     // 100 + 0 + 2 = 102
  });

  it('should always give winner at least WIN_BONUS points', () => {
    const result = calculateMatchElo(100, 1);

    expect(result.newWinnerElo).toBeGreaterThanOrEqual(100 + WIN_BONUS);
  });

  it('should handle zero ELO loser edge case', () => {
    const result = calculateMatchElo(100, 0);

    expect(result.pointsTransferred).toBe(0);  // floor(0 * 0.08) = 0
    expect(result.newLoserElo).toBe(0);        // 0 - 0 = 0
    expect(result.newWinnerElo).toBe(102);     // 100 + 0 + 2 = 102
  });

  it('should handle very high ELO values', () => {
    const result = calculateMatchElo(1000, 1000);

    expect(result.pointsTransferred).toBe(80);  // 1000 * 0.08 = 80
    expect(result.newLoserElo).toBe(920);       // 1000 - 80 = 920
    expect(result.newWinnerElo).toBe(1082);     // 1000 + 80 + 2 = 1082
  });
});

describe('calculateTournamentBonus', () => {
  it('should calculate 8% bonus correctly', () => {
    expect(calculateTournamentBonus(100)).toBe(8);   // floor(100 * 0.08)
    expect(calculateTournamentBonus(125)).toBe(10);  // floor(125 * 0.08) = floor(10) = 10
    expect(calculateTournamentBonus(200)).toBe(16);  // floor(200 * 0.08) = 16
  });

  it('should floor the bonus', () => {
    expect(calculateTournamentBonus(105)).toBe(8);   // floor(105 * 0.08) = floor(8.4) = 8
    expect(calculateTournamentBonus(106)).toBe(8);   // floor(106 * 0.08) = floor(8.48) = 8
    expect(calculateTournamentBonus(112)).toBe(8);   // floor(112 * 0.08) = floor(8.96) = 8
    expect(calculateTournamentBonus(113)).toBe(9);   // floor(113 * 0.08) = floor(9.04) = 9
  });

  it('should handle zero ELO', () => {
    expect(calculateTournamentBonus(0)).toBe(0);
  });

  it('should handle small ELO values', () => {
    expect(calculateTournamentBonus(1)).toBe(0);     // floor(1 * 0.08) = floor(0.08) = 0
    expect(calculateTournamentBonus(10)).toBe(0);    // floor(10 * 0.08) = floor(0.8) = 0
    expect(calculateTournamentBonus(12)).toBe(0);    // floor(12 * 0.08) = floor(0.96) = 0
    expect(calculateTournamentBonus(13)).toBe(1);    // floor(13 * 0.08) = floor(1.04) = 1
  });

  it('should handle large ELO values', () => {
    expect(calculateTournamentBonus(1000)).toBe(80);  // floor(1000 * 0.08) = 80
    expect(calculateTournamentBonus(5000)).toBe(400); // floor(5000 * 0.08) = 400
  });

  it('should always return an integer', () => {
    for (let elo = 0; elo <= 1000; elo += 13) {
      const bonus = calculateTournamentBonus(elo);
      expect(Number.isInteger(bonus)).toBe(true);
    }
  });
});

describe('calculateInactivityPenalty', () => {
  const currentTimestamp = new Date('2024-03-01T00:00:00Z').getTime();
  const seasonEndTimestamp = new Date('2024-12-31T23:59:59Z').getTime();

  it('should return 0 penalty for activity within 60 days', () => {
    const lastMatchTimestamp = new Date('2024-02-01T00:00:00Z').getTime(); // 29 days ago

    const penalty = calculateInactivityPenalty(
      200,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    expect(penalty).toBe(0);
  });

  it('should return 0 penalty exactly at 59 days', () => {
    const lastMatchTimestamp = currentTimestamp - (59 * 24 * 60 * 60 * 1000);

    const penalty = calculateInactivityPenalty(
      200,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    expect(penalty).toBe(0);
  });

  it('should return 0 penalty at exactly 59.99 days', () => {
    const lastMatchTimestamp = currentTimestamp - (59.99 * 24 * 60 * 60 * 1000);

    const penalty = calculateInactivityPenalty(
      200,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    expect(penalty).toBe(0);
  });

  it('should apply penalty after 60 days (one period)', () => {
    const lastMatchTimestamp = currentTimestamp - (60 * 24 * 60 * 60 * 1000);
    const currentElo = 200;

    const penalty = calculateInactivityPenalty(
      currentElo,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    // One period: 200 * (1 - 0.08) = 200 * 0.92 = 184
    // Penalty: floor(200 - 184) = 16
    expect(penalty).toBe(16);
  });

  it('should apply compounding penalties for multiple periods', () => {
    const lastMatchTimestamp = currentTimestamp - (120 * 24 * 60 * 60 * 1000); // 120 days = 2 periods
    const currentElo = 200;

    const penalty = calculateInactivityPenalty(
      currentElo,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    // Period 1: 200 * 0.92 = 184
    // Period 2: 184 * 0.92 = 169.28
    // Penalty: floor(200 - 169.28) = 30
    expect(penalty).toBe(30);
  });

  it('should apply three periods correctly', () => {
    const lastMatchTimestamp = currentTimestamp - (180 * 24 * 60 * 60 * 1000); // 180 days = 3 periods
    const currentElo = 200;

    const penalty = calculateInactivityPenalty(
      currentElo,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    // Period 1: 200 * 0.92 = 184
    // Period 2: 184 * 0.92 = 169.28
    // Period 3: 169.28 * 0.92 = 155.7376
    // Penalty: floor(200 - 155.7376) = 44
    expect(penalty).toBe(44);
  });

  it('should cap penalty calculation at season end', () => {
    const lastMatchTimestamp = new Date('2024-01-01T00:00:00Z').getTime();
    const currentTimestamp = new Date('2025-06-01T00:00:00Z').getTime(); // Way after season end
    const seasonEndTimestamp = new Date('2024-12-31T23:59:59Z').getTime();

    // Should calculate based on season end, not current timestamp
    const penalty = calculateInactivityPenalty(
      200,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    // Days from Jan 1 to Dec 31 = 365 days = 6 periods (365/60 = 6.08, floor = 6)
    // Calculate expected penalty manually:
    let elo = 200;
    for (let i = 0; i < 6; i++) {
      elo = elo * 0.92;
    }
    const expectedPenalty = Math.floor(200 - elo);

    expect(penalty).toBe(expectedPenalty);
    expect(penalty).toBeGreaterThan(0);
    expect(penalty).toBeLessThan(200); // Should not remove all ELO
  });

  it('should floor the final penalty', () => {
    const lastMatchTimestamp = currentTimestamp - (61 * 24 * 60 * 60 * 1000);
    const currentElo = 100;

    const penalty = calculateInactivityPenalty(
      currentElo,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    // Should be floored integer
    expect(penalty).toBe(Math.floor(penalty));
    expect(Number.isInteger(penalty)).toBe(true);
  });

  it('should handle zero ELO', () => {
    const lastMatchTimestamp = currentTimestamp - (120 * 24 * 60 * 60 * 1000);

    const penalty = calculateInactivityPenalty(
      0,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    expect(penalty).toBe(0);
  });

  it('should handle very high ELO values', () => {
    const lastMatchTimestamp = currentTimestamp - (60 * 24 * 60 * 60 * 1000);
    const currentElo = 1000;

    const penalty = calculateInactivityPenalty(
      currentElo,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    // One period: 1000 * 0.92 = 920
    // Penalty: floor(1000 - 920) = 80
    expect(penalty).toBe(80);
  });

  it('should not apply penalty for exactly 60 days (edge case)', () => {
    // At exactly 60 days, floor(60/60) = 1, so one period applies
    const lastMatchTimestamp = currentTimestamp - (60 * 24 * 60 * 60 * 1000);
    const currentElo = 100;

    const penalty = calculateInactivityPenalty(
      currentElo,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    // Should apply 1 period of penalty
    expect(penalty).toBe(8); // floor(100 - 100*0.92) = floor(100 - 92) = 8
  });

  it('should handle fractional days correctly', () => {
    // 119.5 days should be 1 period (floor(119.5/60) = 1)
    const lastMatchTimestamp = currentTimestamp - (119.5 * 24 * 60 * 60 * 1000);
    const currentElo = 200;

    const penalty = calculateInactivityPenalty(
      currentElo,
      lastMatchTimestamp,
      currentTimestamp,
      seasonEndTimestamp
    );

    // One period: 200 * 0.92 = 184
    // Penalty: floor(200 - 184) = 16
    expect(penalty).toBe(16);
  });
});
