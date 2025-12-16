"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Header } from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const currentUser = useQuery(api.myFunctions.getCurrentUser);
  const router = useRouter();

  useEffect(() => {
    if (currentUser === null) {
      router.push("/signin");
    } else if (currentUser && currentUser.role !== "judge") {
      router.push("/");
    }
  }, [currentUser, router]);

  if (currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (currentUser === null || currentUser.role !== "judge") {
    return null;
  }

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-8 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-foreground">Judge Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {currentUser.name}! This is the judge-only dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Tournaments</h3>
            <p className="text-sm text-muted-foreground">
              Manage and view tournament information
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Players</h3>
            <p className="text-sm text-muted-foreground">
              View and manage player registrations
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Results</h3>
            <p className="text-sm text-muted-foreground">
              Record match results and update standings
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
