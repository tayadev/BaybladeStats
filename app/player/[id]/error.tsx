"use client";

export default function PlayerRouteError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm max-w-md w-full text-center">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this player profile.
        </p>
      </div>
    </div>
  );
}
