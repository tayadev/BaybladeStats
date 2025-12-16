import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// Get the current authenticated user
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      role: v.union(v.literal("player"), v.literal("judge")),
      name: v.string(),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
});

// List all players
export const listPlayers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      role: v.union(v.literal("player"), v.literal("judge")),
      name: v.string(),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const players = await ctx.db.query("users").order("desc").collect();
    return players.map((p) => ({
      _id: p._id,
      _creationTime: p._creationTime,
      role: p.role,
      name: p.name,
      image: p.image,
    }));
  },
});

// Get a user by id
export const getUserById = query({
  args: { id: v.id("users") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      role: v.union(v.literal("player"), v.literal("judge")),
      name: v.string(),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      role: user.role,
      name: user.name,
      image: user.image,
    };
  },
});

// List all seasons
export const listSeasons = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("seasons"),
      _creationTime: v.number(),
      name: v.string(),
      start: v.number(),
      end: v.number(),
    })
  ),
  handler: async (ctx) => {
     const seasons = await ctx.db.query("seasons").order("desc").collect();
     return seasons.filter((s) => !s.deleted);
  },
});

// Get a season by id
export const getSeasonById = query({
  args: { id: v.id("seasons") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("seasons"),
      _creationTime: v.number(),
      name: v.string(),
      start: v.number(),
      end: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all tournaments
export const listTournaments = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      date: v.number(),
      winner: v.id("users"),
    })
  ),
  handler: async (ctx) => {
     const tournaments = await ctx.db.query("tournaments").order("desc").collect();
     return tournaments.filter((t) => !t.deleted);
  },
});

// Get a tournament by id
export const getTournamentById = query({
  args: { id: v.id("tournaments") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      date: v.number(),
      winner: v.id("users"),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all matches
export const listMatches = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("matches"),
      _creationTime: v.number(),
      date: v.number(),
      tournament: v.optional(v.id("tournaments")),
      winner: v.id("users"),
      loser: v.id("users"),
    })
  ),
  handler: async (ctx) => {
     const matches = await ctx.db.query("matches").order("desc").collect();
     return matches.filter((m) => !m.deleted);
  },
});

// Get a match by id
export const getMatchById = query({
  args: { id: v.id("matches") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("matches"),
      _creationTime: v.number(),
      date: v.number(),
      tournament: v.optional(v.id("tournaments")),
      winner: v.id("users"),
      loser: v.id("users"),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get matches for a player
export const getPlayerMatches = query({
  args: { playerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("matches"),
      _creationTime: v.number(),
      date: v.number(),
      tournament: v.optional(v.id("tournaments")),
      winner: v.id("users"),
      loser: v.id("users"),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await ctx.db.query("matches").collect();
    return matches.filter(
      (m) => m.winner === args.playerId || m.loser === args.playerId
    );
  },
});

// Get tournaments for a player
export const getPlayerTournaments = query({
  args: { playerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      date: v.number(),
      winner: v.id("users"),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await ctx.db.query("matches").collect();
    const tournamentIds = new Set(
      matches
        .filter((m) => m.winner === args.playerId || m.loser === args.playerId)
        .map((m) => m.tournament)
    );
    
    const tournaments = await ctx.db.query("tournaments").collect();
    return tournaments.filter((t) => tournamentIds.has(t._id));
  },
});

// Get seasons for a player
export const getPlayerSeasons = query({
  args: { playerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("seasons"),
      _creationTime: v.number(),
      name: v.string(),
      start: v.number(),
      end: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await ctx.db.query("matches").collect();
    const playerMatches = matches.filter(
      (m) => m.winner === args.playerId || m.loser === args.playerId
    );
    
    const seasons = await ctx.db.query("seasons").collect();
    return seasons.filter((season) =>
      playerMatches.some((match) => match.date >= season.start && match.date <= season.end)
    );
  },
});

// Create a new player (for judges)
export const createPlayer = mutation({
  args: {
    name: v.string(),
    role: v.union(v.literal("player"), v.literal("judge")),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a player");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can create players");
    }
    
    return await ctx.db.insert("users", {
      name: args.name,
      role: args.role,
    });
  },
});

// Create a new season (for judges)
export const createSeason = mutation({
  args: {
    name: v.string(),
    start: v.number(),
    end: v.number(),
  },
  returns: v.id("seasons"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a season");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can create seasons");
    }
    
    return await ctx.db.insert("seasons", {
      name: args.name,
      start: args.start,
      end: args.end,
    });
  },
});

// Create a new tournament (for judges)
export const createTournament = mutation({
  args: {
    name: v.string(),
    date: v.number(),
    winner: v.id("users"),
  },
  returns: v.id("tournaments"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a tournament");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can create tournaments");
    }
    
    return await ctx.db.insert("tournaments", {
      name: args.name,
      date: args.date,
      winner: args.winner,
    });
  },
});

// Create a new match (for judges)
export const createMatch = mutation({
  args: {
    date: v.number(),
    tournament: v.optional(v.id("tournaments")),
    winner: v.id("users"),
    loser: v.id("users"),
  },
  returns: v.id("matches"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a match");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can create matches");
    }
    
    return await ctx.db.insert("matches", {
      date: args.date,
      tournament: args.tournament,
      winner: args.winner,
      loser: args.loser,
    });
  },
});

// Update a season (for judges)
export const updateSeason = mutation({
  args: {
    id: v.id("seasons"),
    name: v.string(),
    start: v.number(),
    end: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a season");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can update seasons");
    }
    
    await ctx.db.patch(args.id, {
      name: args.name,
      start: args.start,
      end: args.end,
    });
    return null;
  },
});

// Delete a season (soft delete for judges)
export const deleteSeason = mutation({
  args: { id: v.id("seasons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a season");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can delete seasons");
    }
    
    await ctx.db.patch(args.id, { deleted: true });
    return null;
  },
});

// Update a tournament (for judges)
export const updateTournament = mutation({
  args: {
    id: v.id("tournaments"),
    name: v.string(),
    date: v.number(),
    winner: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a tournament");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can update tournaments");
    }
    
    await ctx.db.patch(args.id, {
      name: args.name,
      date: args.date,
      winner: args.winner,
    });
    return null;
  },
});

// Delete a tournament (soft delete for judges)
export const deleteTournament = mutation({
  args: { id: v.id("tournaments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a tournament");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can delete tournaments");
    }
    
    await ctx.db.patch(args.id, { deleted: true });
    return null;
  },
});

// Update a match (for judges)
export const updateMatch = mutation({
  args: {
    id: v.id("matches"),
    date: v.number(),
    tournament: v.optional(v.id("tournaments")),
    winner: v.id("users"),
    loser: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a match");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can update matches");
    }
    
    await ctx.db.patch(args.id, {
      date: args.date,
      tournament: args.tournament,
      winner: args.winner,
      loser: args.loser,
    });
    return null;
  },
});

// Delete a match (soft delete for judges)
export const deleteMatch = mutation({
  args: { id: v.id("matches") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a match");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can delete matches");
    }
    
    await ctx.db.patch(args.id, { deleted: true });
    return null;
  },
});