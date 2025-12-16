"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
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
      Welcome to the BLG Stats App!
    </div>
  );
}
