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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(season.name);
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
  const [startDate, setStartDate] = useState(toLocalInputValue(season.start));
  const [endDate, setEndDate] = useState(toLocalInputValue(season.end));
  const [loading, setLoading] = useState(false);

  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const updateSeason = useMutation(api.myFunctions.updateSeason);
  const deleteSeason = useMutation(api.myFunctions.deleteSeason);

  if (currentUser === undefined || currentUser?.role !== "judge") {
    return null;
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    setLoading(true);
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      await updateSeason({ 
        id: season._id, 
        name: name.trim(), 
        start, 
        end 
      });
      setOpen(false);
      onSeasonUpdated?.();
    } catch (error) {
      console.error("Failed to update season:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this season?")) return;

    setLoading(true);
    try {
      await deleteSeason({ id: season._id });
      setOpen(false);
      onSeasonUpdated?.();
    } catch (error) {
      console.error("Failed to delete season:", error);
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
          <DialogTitle>Edit Season</DialogTitle>
          <DialogDescription>
            Update or delete this season.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Season Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date & Time</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date & Time</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
              <Button type="submit" disabled={loading || !name.trim() || !startDate || !endDate}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
