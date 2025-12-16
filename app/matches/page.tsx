"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DataTable from "@/components/table";
import { Header } from "@/components/header";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString();
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
};

const columns: ColumnDef<MatchItem, any>[] = [
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
    cell: () => (
      <div className="text-right">
        <Button variant="ghost" size="sm" className="gap-2">
          <Eye className="h-4 w-4" /> View
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

export default function MatchesPage() {
  const matches = useQuery(api.myFunctions.listMatches);

  const items: MatchItem[] = (matches ?? []).map((m) => ({
    id: m._id as unknown as string,
    date: formatDate(m.date),
    tournament: m.tournament as unknown as string,
    winner: m.winner as unknown as string,
    loser: m.loser as unknown as string,
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
