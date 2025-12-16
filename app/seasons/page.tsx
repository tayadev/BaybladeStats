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

type SeasonItem = {
  id: string;
  name: string;
  start: string;
  end: string;
};

const columns: ColumnDef<SeasonItem, any>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "start",
    header: "Start Date",
  },
  {
    accessorKey: "end",
    header: "End Date",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="text-right">
        <Link href={`/season/${row.original.id}`}>
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

export default function SeasonsPage() {
  const seasons = useQuery(api.myFunctions.listSeasons);

  const items: SeasonItem[] = (seasons ?? []).map((s) => ({
    id: s._id as unknown as string,
    name: s.name,
    start: formatDate(s.start),
    end: formatDate(s.end),
  }));

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">Seasons</h1>
          <p className="text-muted-foreground">
            Browse all seasons.
          </p>
        </div>

        {seasons === undefined ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading seasons…</p>
          </div>
        ) : (
          <DataTable columns={columns} data={items} />
        )}
      </main>
    </>
  );
}
