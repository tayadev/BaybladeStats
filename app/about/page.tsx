"use client";

import { Header } from "@/components/header";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">About</h1>
          <p className="text-muted-foreground">
            Learn more about BaybladeStats
          </p>
        </div>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-3">What is BaybladeStats?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Add a description about the project here
          </p>
        </section>
      </main>
    </>
  );
}
