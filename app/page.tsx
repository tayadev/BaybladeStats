"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { LeaderboardPodium } from "@/components/leaderboard-podium";
import { LeaderboardTable } from "@/components/leaderboard-table";

export default function Home() {
  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-8">
        <WelcomeSection />
        <CurrentSeasonLeaderboard />
      </main>
    </>
  );
}

function WelcomeSection() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold">Welcome to BLG Stats App</h1>
      <p className="text-muted-foreground mt-2">
        Track rankings, matches, and tournament results
      </p>
    </div>
  );
}

function CurrentSeasonLeaderboard() {
  const currentSeason = useQuery(api.eloQueries.getCurrentSeason);
  const leaderboard = useQuery(
    api.eloQueries.getSeasonLeaderboard,
    currentSeason ? { seasonId: currentSeason._id, limit: 10 } : "skip"
  );

  // Loading state
  if (currentSeason === undefined || leaderboard === undefined) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  // No current season
  if (currentSeason === null) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="rounded-lg border bg-card p-12 shadow-sm text-center">
          <h2 className="text-2xl font-semibold mb-2">No Active Season</h2>
          <p className="text-muted-foreground mb-4">
            There is currently no active season. Check back soon!
          </p>
          <Link href="/seasons">
            <Button variant="outline">View Past Seasons</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Empty leaderboard
  if (leaderboard.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="rounded-lg border bg-card p-12 shadow-sm text-center">
          <h2 className="text-2xl font-semibold mb-2">No Rankings Yet</h2>
          <p className="text-muted-foreground mb-4">
            No matches have been played in {currentSeason.name} yet.
          </p>
          <Link href="/matches">
            <Button variant="outline">View Matches</Button>
          </Link>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <section className="max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Current Season Rankings</h2>
          <p className="text-sm text-muted-foreground">{currentSeason.name}</p>
        </div>
        <Link href="/leaderboard">
          <Button variant="outline">View Full Leaderboard</Button>
        </Link>
      </div>

      <LeaderboardPodium players={topThree} />

      {remaining.length > 0 && (
        <LeaderboardTable players={remaining} startRank={4} />
      )}
    </section>
  );
}
