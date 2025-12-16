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

interface EditTournamentDialogProps {
  tournament: {
    _id: Id<"tournaments">;
    name: string;
    date: number;
    winner: Id<"users">;
  };
  onTournamentUpdated?: () => void;
}

export function EditTournamentDialog({ tournament, onTournamentUpdated }: EditTournamentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tournament.name);
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
  const [date, setDate] = useState(toLocalInputValue(tournament.date));
  const [winner, setWinner] = useState<string>(tournament.winner as unknown as string);
  const [loading, setLoading] = useState(false);

  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const players = useQuery(api.myFunctions.listPlayers);
  const updateTournament = useMutation(api.myFunctions.updateTournament);
  const deleteTournament = useMutation(api.myFunctions.deleteTournament);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const winnerItems: ComboboxItem[] = (players ?? []).map((p) => ({
    value: p._id,
    label: p.name,
  }));

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date || !winner) return;

    setLoading(true);
    try {
      const tournamentDate = new Date(date).getTime();
      await updateTournament({ 
        id: tournament._id, 
        name: name.trim(), 
        date: tournamentDate,
        winner: winner as Id<"users">,
      });
      setOpen(false);
      onTournamentUpdated?.();
    } catch (error) {
      console.error("Failed to update tournament:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;

    setLoading(true);
    try {
      await deleteTournament({ id: tournament._id });
      setOpen(false);
      onTournamentUpdated?.();
    } catch (error) {
      console.error("Failed to delete tournament:", error);
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
          <DialogTitle>Edit Tournament</DialogTitle>
          <DialogDescription>
            Update or delete this tournament.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
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
            <Label>Winner</Label>
            <Combobox
              items={winnerItems}
              value={winner}
              onValueChange={setWinner}
              placeholder="Select winner..."
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
              <Button type="submit" disabled={loading || !name.trim() || !date || !winner}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
