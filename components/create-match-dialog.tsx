"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Combobox, type ComboboxItem } from "@/components/combobox";
import type { Id } from "@/convex/_generated/dataModel";

export function CreateMatchDialog() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [tournament, setTournament] = useState("");
  const [winner, setWinner] = useState("");
  const [loser, setLoser] = useState("");
  const [loading, setLoading] = useState(false);
  
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const tournaments = useQuery(api.myFunctions.listTournaments);
  const players = useQuery(api.myFunctions.listPlayers);
  const createMatch = useMutation(api.myFunctions.createMatch);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const tournamentItems: ComboboxItem[] = [
    { value: "none", label: "No Tournament" },
    ...(tournaments ?? []).map((t) => ({
      value: t._id,
      label: t.name,
    })),
  ];

  const playerItems: ComboboxItem[] = (players ?? []).map((p) => ({
    value: p._id,
    label: p.name,
  }));

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !winner || !loser) return;
    if (winner === loser) {
      alert("Winner and loser must be different players");
      return;
    }

    setLoading(true);
    try {
      const matchDate = new Date(date).getTime();
      await createMatch({ 
        date: matchDate,
        tournament: tournament && tournament !== "none" ? (tournament as Id<"tournaments">) : undefined,
        winner: winner as Id<"users">,
        loser: loser as Id<"users">,
      });
      setDate("");
      setTournament("");
      setWinner("");
      setLoser("");
      setOpen(false);
    } catch (error) {
      console.error("Failed to create match:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Match
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
          <DialogDescription>
            Record a new match result.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date & Time</Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Tournament (Optional)</Label>
            <Combobox
              items={tournamentItems}
              value={tournament}
              onValueChange={setTournament}
              placeholder="Select tournament (optional)..."
              searchPlaceholder="Search tournaments..."
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Winner</Label>
            <Combobox
              items={playerItems}
              value={winner}
              onValueChange={setWinner}
              placeholder="Select winner..."
              searchPlaceholder="Search players..."
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Loser</Label>
            <Combobox
              items={playerItems}
              value={loser}
              onValueChange={setLoser}
              placeholder="Select loser..."
              searchPlaceholder="Search players..."
              disabled={loading}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !date || !winner || !loser || winner === loser}>
              {loading ? "Creating..." : "Create Match"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
