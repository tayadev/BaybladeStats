"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DataTable from "@/components/table";
import { Header } from "@/components/header";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString();
  } catch {
    return "";
  }
}

type PlayerItem = {
  id: string;
  name: string;
  role: "player" | "judge";
  created: string;
};

const columns: ColumnDef<PlayerItem, any>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.getValue("role")}</span>
    ),
  },
  {
    accessorKey: "created",
    header: "Joined",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="text-right">
        <Link href={`/player/${row.original.id}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <Eye className="h-4 w-4" /> View
          </Button>
        </Link>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

export default function PlayersDirectoryPage() {
  const players = useQuery(api.myFunctions.listPlayers);

  const items: PlayerItem[] = (players ?? []).map((p) => ({
    id: p._id as unknown as string,
    name: p.name,
    role: p.role,
    created: formatDate(p._creationTime),
  }));

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">Players</h1>
          <p className="text-muted-foreground">
            Browse all registered players.
          </p>
        </div>

        {players === undefined ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading players…</p>
          </div>
        ) : (
          <DataTable columns={columns} data={items} />
        )}
      </main>
    </>
  );
}
