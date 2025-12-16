"use client";

import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";

type TablePlayer = {
  playerId: Id<"users">;
  playerName: string;
  playerImage?: string;
  currentElo: number;
  inactivityPenalty: number;
};

export function LeaderboardTable({
  players,
  startRank,
}: {
  players: TablePlayer[];
  startRank: number;
}) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Player
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold">
                ELO
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {players.map((player, index) => (
              <tr
                key={player.playerId}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium">
                  #{startRank + index}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/player/${player.playerId}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    {player.playerImage ? (
                      <img
                        src={player.playerImage}
                        alt={player.playerName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                        {player.playerName[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{player.playerName}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold">
                  {Math.round(player.currentElo)}
                </td>
                <td className="px-4 py-3 text-center">
                  {player.inactivityPenalty > 0 ? (
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-600"
                    >
                      Inactive
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
