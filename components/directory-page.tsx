"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import DataTable from "./table";
import { Header } from "./header";

export type DirectoryPageProps<TData> = {
  title: string;
  description: string;
  createButton?: React.ReactNode;
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading: boolean;
  loadingLabel?: string;
};

export function DirectoryPage<TData>({
  title,
  description,
  createButton,
  columns,
  data,
  isLoading,
  loadingLabel,
}: DirectoryPageProps<TData>) {
  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {createButton ?? null}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">
              {loadingLabel ?? `Loading ${title.toLowerCase()}…`}
            </p>
          </div>
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </main>
    </>
  );
}
