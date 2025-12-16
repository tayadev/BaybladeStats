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

export function CreateTournamentDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [winner, setWinner] = useState("");
  const [loading, setLoading] = useState(false);
  
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const players = useQuery(api.myFunctions.listPlayers);
  const createTournament = useMutation(api.myFunctions.createTournament);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const winnerItems: ComboboxItem[] = (players ?? []).map((p) => ({
    value: p._id,
    label: p.name,
  }));

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date || !winner) return;

    setLoading(true);
    try {
      const tournamentDate = new Date(date).getTime();
      await createTournament({ 
        name: name.trim(), 
        date: tournamentDate,
        winner: winner as Id<"users">,
      });
      setName("");
      setDate("");
      setWinner("");
      setOpen(false);
    } catch (error) {
      console.error("Failed to create tournament:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Tournament
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Add a new tournament to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input
              id="name"
              placeholder="e.g., Spring Championship"
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
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || !date || !winner}>
              {loading ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
