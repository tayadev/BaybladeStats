"use client";

import * as React from "react";
import { EditTournamentDialog } from "@/components/edit-tournament-dialog";
import type { Id } from "@/convex/_generated/dataModel";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DataTable from "@/components/table";
import { Header } from "@/components/header";
import { CreateTournamentDialog } from "@/components/create-tournament-dialog";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
}

type TournamentItem = {
  id: string;
  name: string;
  date: string;
  rawId: Id<"tournaments">;
  rawDate: number;
  rawWinnerId: Id<"users">;
};

const columns: ColumnDef<TournamentItem, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-end">
          <EditTournamentDialog
            tournament={{
              _id: row.original.rawId,
              name: row.original.name,
              date: row.original.rawDate,
              winner: row.original.rawWinnerId,
            }}
          />
          <Link href={`/tournament/${row.original.id}`}>
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

export default function TournamentsPage() {
  const tournaments = useQuery(api.myFunctions.listTournaments);

  const items: TournamentItem[] = (tournaments ?? []).map((t) => ({
    id: t._id as unknown as string,
    rawId: t._id,
    rawDate: t.date,
    rawWinnerId: t.winner,
    name: t.name,
    date: formatDate(t.date),
  }));

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">Tournaments</h1>
          <p className="text-muted-foreground">
            Browse all tournaments.
          </p>
        </div>

        <CreateTournamentDialog />

        {tournaments === undefined ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading tournaments…</p>
          </div>
        ) : (
          <DataTable columns={columns} data={items} />
        )}
      </main>
    </>
  );
}
