/**
 * Global test utilities and helpers
 */

export const MOCK_TIMESTAMP = new Date('2024-01-15T12:00:00Z').getTime();
export const MOCK_USER_ID = 'jx7abc123' as any; // Mock Convex ID
export const MOCK_SEASON_ID = 'kd8def456' as any;

export function mockConvexId(prefix: string, suffix: string): any {
  return `${prefix}${suffix}` as any;
}

export function advanceTime(ms: number) {
  return MOCK_TIMESTAMP + ms;
}

// Time helpers for inactivity penalty tests
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const SIXTY_DAYS_MS = 60 * ONE_DAY_MS;
