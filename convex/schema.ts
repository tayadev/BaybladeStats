import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  users: defineTable({
    role: v.union(v.literal("player"), v.literal("judge")),
    name: v.string(),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  }),
  seasons: defineTable({
    name: v.string(),
    start: v.number(),
    end: v.number(),
    deleted: v.optional(v.boolean()),
  }),
  tournaments: defineTable({
    name: v.string(),
    date: v.number(),
    winner: v.id("users"),
    deleted: v.optional(v.boolean()),
  }),
  matches: defineTable({
    date: v.number(),
    tournament: v.optional(v.id("tournaments")),
    winner: v.id("users"),
    loser: v.id("users"),
    deleted: v.optional(v.boolean()),
  })
    .index("by_winner", ["winner"])
    .index("by_loser", ["loser"])
    .index("by_tournament", ["tournament"]),
});
