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
import { Edit, Trash } from "lucide-react";
import { Combobox, type ComboboxItem } from "@/components/combobox";
import type { Id } from "@/convex/_generated/dataModel";

interface EditMatchDialogProps {
  match: {
    _id: Id<"matches">;
    date: number;
    tournament?: Id<"tournaments">;
    winner: Id<"users">;
    loser: Id<"users">;
  };
  onMatchUpdated?: () => void;
}

export function EditMatchDialog({ match, onMatchUpdated }: EditMatchDialogProps) {
  const [open, setOpen] = useState(false);
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
  const [date, setDate] = useState(toLocalInputValue(match.date));
  const [tournament, setTournament] = useState<string>((match.tournament as unknown as string) || "none");
  const [winner, setWinner] = useState<string>(match.winner as unknown as string);
  const [loser, setLoser] = useState<string>(match.loser as unknown as string);
  const [loading, setLoading] = useState(false);

  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const tournaments = useQuery(api.myFunctions.listTournaments);
  const players = useQuery(api.myFunctions.listPlayers);
  const updateMatch = useMutation(api.myFunctions.updateMatch);
  const deleteMatch = useMutation(api.myFunctions.deleteMatch);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !winner || !loser || winner === loser) return;

    setLoading(true);
    try {
      const matchDate = new Date(date).getTime();
      await updateMatch({ 
        id: match._id,
        date: matchDate,
        tournament: tournament && tournament !== "none" ? (tournament as Id<"tournaments">) : undefined,
        winner: winner as Id<"users">,
        loser: loser as Id<"users">,
      });
      setOpen(false);
      onMatchUpdated?.();
    } catch (error) {
      console.error("Failed to update match:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this match?")) return;

    setLoading(true);
    try {
      await deleteMatch({ id: match._id });
      setOpen(false);
      onMatchUpdated?.();
    } catch (error) {
      console.error("Failed to delete match:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Match</DialogTitle>
          <DialogDescription>
            Update or delete this match.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
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
          <div className="flex gap-3 justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="gap-2"
            >
              <Trash className="h-4 w-4" /> Delete
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !date || !winner || !loser || winner === loser}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
