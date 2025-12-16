"use client";

import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PodiumPlayer = {
  playerId: Id<"users">;
  playerName: string;
  playerImage?: string;
  currentElo: number;
  inactivityPenalty: number;
};

export function LeaderboardPodium({ players }: { players: PodiumPlayer[] }) {
  // Reorder for visual podium: 2nd, 1st, 3rd
  const orderedPlayers = [players[1], players[0], players[2]].filter(Boolean);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      {orderedPlayers.map((player, visualIndex) => {
        const actualRank = visualIndex === 1 ? 1 : visualIndex === 0 ? 2 : 3;
        return (
          <PodiumCard
            key={player.playerId}
            player={player}
            rank={actualRank}
            isFirst={actualRank === 1}
          />
        );
      })}
    </div>
  );
}

function PodiumCard({
  player,
  rank,
  isFirst,
}: {
  player: PodiumPlayer;
  rank: number;
  isFirst: boolean;
}) {
  const medalColors = {
    1: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    2: "bg-gradient-to-br from-gray-300 to-gray-400",
    3: "bg-gradient-to-br from-amber-600 to-amber-700",
  };

  const cardHeights = {
    1: "md:min-h-[320px]",
    2: "md:min-h-[280px]",
    3: "md:min-h-[280px]",
  };

  return (
    <Link href={`/player/${player.playerId}`}>
      <Card
        className={cn(
          "relative overflow-hidden transition-all hover:shadow-lg hover:scale-105",
          cardHeights[rank as keyof typeof cardHeights],
          isFirst && "md:border-2 md:border-yellow-500"
        )}
      >
        <CardHeader className="text-center pb-2">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2",
              medalColors[rank as keyof typeof medalColors]
            )}
          >
            {rank}
          </div>

          {player.playerImage ? (
            <img
              src={player.playerImage}
              alt={player.playerName}
              className={cn(
                "rounded-full object-cover mx-auto border-4 border-border",
                isFirst ? "w-20 h-20" : "w-16 h-16"
              )}
            />
          ) : (
            <div
              className={cn(
                "rounded-full bg-muted flex items-center justify-center mx-auto border-4 border-border font-semibold",
                isFirst ? "w-20 h-20 text-2xl" : "w-16 h-16 text-xl"
              )}
            >
              {player.playerName[0]?.toUpperCase()}
            </div>
          )}
        </CardHeader>

        <CardContent className="text-center pb-4">
          <CardTitle className={cn("mb-2", isFirst ? "text-xl" : "text-lg")}>
            {player.playerName}
          </CardTitle>
          <div className="mb-2">
            <div
              className={cn("font-bold", isFirst ? "text-3xl" : "text-2xl")}
            >
              {Math.round(player.currentElo)}
            </div>
            <div className="text-xs text-muted-foreground">ELO Rating</div>
          </div>

          {player.inactivityPenalty > 0 && (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-600"
            >
              Inactive (-{Math.round(player.inactivityPenalty)})
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
