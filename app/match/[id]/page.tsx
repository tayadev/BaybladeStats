"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Header } from "@/components/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return "";
  }
}

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const idParam = (params?.id ?? "") as string;

  const isPlausibleConvexId = (s: string) => /^[a-z0-9]{10,}$/i.test(s);
  const validId = isPlausibleConvexId(idParam);
  const id = (validId ? (idParam as Id<"matches">) : undefined) as
    | Id<"matches">
    | undefined;

  const match = useQuery(
    api.myFunctions.getMatchById,
    id ? { id } : undefined
  );

  const winnerUser = useQuery(
    api.myFunctions.getUserById,
    match?.winner ? { id: match.winner } : undefined
  );

  const loserUser = useQuery(
    api.myFunctions.getUserById,
    match?.loser ? { id: match.loser } : undefined
  );

  const tournament = useQuery(
    api.myFunctions.getTournamentById,
    match?.tournament ? { id: match.tournament } : undefined
  );

  if (match === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!validId) {
    return (
      <>
        <Header />
        <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold mb-2">Invalid match id</h1>
            <p className="text-muted-foreground">Please check the URL and try again.</p>
          </div>
        </main>
      </>
    );
  }

  if (match === null) {
    return (
      <>
        <Header />
        <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold mb-2">Match not found</h1>
            <p className="text-muted-foreground">We couldn't find that match.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-4">
            {formatDate(match.date)}
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Winner</p>
              <Link href={`/player/${match.winner}`}>
                <p className="text-2xl font-bold text-foreground hover:underline">
                  {winnerUser?.name ?? "Loading..."}
                </p>
              </Link>
            </div>
            <div className="px-6 text-center">
              <p className="text-sm text-muted-foreground">vs</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm text-muted-foreground mb-1">Loser</p>
              <Link href={`/player/${match.loser}`}>
                <p className="text-2xl font-bold text-muted-foreground hover:underline">
                  {loserUser?.name ?? "Loading..."}
                </p>
              </Link>
            </div>
          </div>
        </div>

        {match.tournament && (
          <section className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Tournament</h2>
            {tournament ? (
              <Link href={`/tournament/${match.tournament}`}>
                <Button variant="link" className="p-0 h-auto">
                  <p className="text-foreground hover:underline">{tournament.name}</p>
                </Button>
              </Link>
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
