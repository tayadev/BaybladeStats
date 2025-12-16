"use client";

import * as React from "react";
import { EditMatchDialog } from "@/components/edit-match-dialog";
import type { Id } from "@/convex/_generated/dataModel";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DataTable from "@/components/table";
import { Header } from "@/components/header";
import { CreateMatchDialog } from "@/components/create-match-dialog";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
}

type MatchItem = {
  id: string;
  date: string;
  tournament: string;
  winner: string;
  loser: string;
  rawId: Id<"matches">;
  rawDate: number;
  rawTournament?: Id<"tournaments">;
  rawWinner: Id<"users">;
  rawLoser: Id<"users">;
};

const columns: ColumnDef<MatchItem, unknown>[] = [
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "tournament",
    header: "Tournament",
  },
  {
    accessorKey: "winner",
    header: "Winner",
  },
  {
    accessorKey: "loser",
    header: "Loser",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-end">
          <EditMatchDialog
            match={{
              _id: row.original.rawId,
              date: row.original.rawDate,
              tournament: row.original.rawTournament,
              winner: row.original.rawWinner,
              loser: row.original.rawLoser,
            }}
          />
          <Link href={`/match/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" /> View
            </Button>
          </Link>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

export default function MatchesPage() {
  const matches = useQuery(api.myFunctions.listMatches);
  const players = useQuery(api.myFunctions.listPlayers);

  // Create a map of player IDs to names
  const playerMap = new Map(
    (players ?? []).map((p) => [p._id, p.name])
  );

  const items: MatchItem[] = (matches ?? []).map((m) => ({
    id: m._id as unknown as string,
    rawId: m._id,
    rawDate: m.date,
    rawTournament: m.tournament,
    rawWinner: m.winner,
    rawLoser: m.loser,
    date: formatDate(m.date),
    tournament: m.tournament as unknown as string,
    winner: playerMap.get(m.winner) || "Unknown",
    loser: playerMap.get(m.loser) || "Unknown",
  }));

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">Matches</h1>
          <p className="text-muted-foreground">
            Browse all matches.
          </p>
        </div>

        <CreateMatchDialog />

        {matches === undefined ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading matches…</p>
          </div>
        ) : (
          <DataTable columns={columns} data={items} />
        )}
      </main>
    </>
  );
}
