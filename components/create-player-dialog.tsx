"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EntityDialog } from "@/components/ui/entity-dialog";

export function CreatePlayerDialog() {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const createPlayer = useMutation(api.myFunctions.createPlayer);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  return (
    <EntityDialog
      mode="create"
      title="Create New Player"
      description="Add a new player to the system. Players can be connected to auth accounts later."
      trigger={
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Player
        </Button>
      }
      fields={[
        { id: "name", label: "Player Name", type: "text", placeholder: "Enter player name", required: true },
        { id: "role", label: "Role", type: "select", required: true, options: [
          { label: "Player", value: "player" },
          { label: "Judge", value: "judge" },
        ] },
      ]}
      submitLabel="Create Player"
      onSubmit={async (vals) => {
        const name = String(vals.name ?? "").trim();
        const role = (String(vals.role ?? "player") as "player" | "judge");
        if (!name) return;
        await createPlayer({ name, role });
      }}
    />
  );
}
