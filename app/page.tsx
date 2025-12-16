"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Doc } from "../convex/_generated/dataModel";
import Link from "next/link";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-8">
        <PlayersList />
      </main>
    </>
  );
}

function PlayersList() {
  const { isAuthenticated } = useConvexAuth();
  const players = useQuery(api.myFunctions.listPlayers) ?? [];

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto">
      <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200">
        Players
      </h2>
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl p-4 shadow-sm">
        {players && players.length > 0 ? (
          <ul className="space-y-2">
            {players.map((player: Doc<"users">) => (
              <li
                key={player._id}
                className="text-slate-700 dark:text-slate-300 flex justify-between items-center p-2 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
              >
                <span className="font-medium">{player.name}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {player.email} 
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {player.role} 
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">
            No players found. Add a player to get started!
          </p>
        )}
      </div>
      {isAuthenticated && (
        <Link
          href="/numbers"
          className="text-center bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white text-sm font-medium px-6 py-3 rounded-lg cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
        >
          View Numbers
        </Link>
      )}
    </div>
  );
}
