"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/ui/entity-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function CreateSeasonDialog() {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const createSeason = useMutation(api.myFunctions.createSeason);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  return (
    <EntityDialog
      mode="create"
      title="Create New Season"
      description="Add a new season to the system."
      trigger={
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Season
        </Button>
      }
      fields={[
        { id: "name", label: "Season Name", type: "text", placeholder: "e.g., Season 1 2025", required: true },
        { id: "startDate", label: "Start Date & Time", type: "datetime-local", required: true },
        { id: "endDate", label: "End Date & Time", type: "datetime-local", required: true },
      ]}
      submitLabel="Create Season"
      onSubmit={async (vals) => {
        const name = String(vals.name ?? "").trim();
        const start = new Date(String(vals.startDate)).getTime();
        const end = new Date(String(vals.endDate)).getTime();
        if (!name || !start || !end) return;
        await createSeason({ name, start, end });
      }}
    />
  );
}
