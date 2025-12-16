"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EntityDialog } from "@/components/ui/entity-dialog";
import { Edit, Trash } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface EditSeasonDialogProps {
  season: {
    _id: Id<"seasons">;
    name: string;
    start: number;
    end: number;
  };
  onSeasonUpdated?: () => void;
}

export function EditSeasonDialog({ season, onSeasonUpdated }: EditSeasonDialogProps) {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const updateSeason = useMutation(api.myFunctions.updateSeason);
  const deleteSeason = useMutation(api.myFunctions.deleteSeason);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const toLocalInputValue = (ms: number) => {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  return (
    <div className="flex items-center gap-2">
      <EntityDialog
        mode="edit"
        title="Edit Season"
        description="Update this season."
        trigger={
          <Button variant="ghost" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
          </Button>
        }
        fields={[
          { id: "name", label: "Season Name", type: "text", required: true },
          { id: "startDate", label: "Start Date & Time", type: "datetime-local", required: true },
          { id: "endDate", label: "End Date & Time", type: "datetime-local", required: true },
        ]}
        initialValues={{
          name: season.name,
          startDate: toLocalInputValue(season.start),
          endDate: toLocalInputValue(season.end),
        }}
        submitLabel="Save Changes"
        onSubmit={async (vals) => {
          const name = String(vals.name ?? "").trim();
          const start = new Date(String(vals.startDate)).getTime();
          const end = new Date(String(vals.endDate)).getTime();
          if (!name || !start || !end) return;
          await updateSeason({ id: season._id, name, start, end });
          onSeasonUpdated?.();
        }}
      />
      <Button
        type="button"
        variant="destructive"
        onClick={async () => {
          if (!confirm("Are you sure you want to delete this season?")) return;
          await deleteSeason({ id: season._id });
          onSeasonUpdated?.();
        }}
        className="gap-2"
        size="sm"
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
}
