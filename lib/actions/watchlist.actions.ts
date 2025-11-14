"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(
  email: string
): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    // Better Auth stores users in the "user" collection
    const user = await db
      .collection("user")
      .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || "");
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail error:", err);
    return [];
  }
}

export const addWatchlist = async ({
  userId,
  symbol,
  company,
  minValue,
  maxValue,
}: {
  userId: string;
  symbol: string;
  company: string;
  minValue?: number;
  maxValue?: number;
}) => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const result = await Watchlist.findOneAndUpdate(
      { userId, symbol },
      {
        userId,
        symbol,
        company,
        minValue,
        maxValue,
        addedAt: new Date(),
      },
      {
        upsert: true, // Insert if not found
        new: true, // Return the updated document
      }
    );

    return { success: true, data: result };
  } catch (e) {
    console.error("Add watchlist failed", e);
    return { success: false, error: "Add watchlist failed" };
  }
};

export async function checkIfInWatchlist(
  userId: string,
  symbol: string
): Promise<boolean> {
  try {
    const entry = await Watchlist.findOne({ userId, symbol });
    return !!entry;
  } catch (err) {
    console.error("checkIfInWatchlist error:", err);
    return false;
  }
}

export const getAllWatchlists = async (): Promise<Watchlist[]> => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const watchlists = await db
      .collection<Watchlist>("watchlists")
      .find()
      .toArray();
    return watchlists;
  } catch (e) {
    console.error("Error fetching watchlists: ", e);
    return [];
  }
};

export const getWatchlistByUserId = async (
  userId: string
): Promise<Watchlist[]> => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const watchlistsFromDb = await db
      .collection<Watchlist>("watchlists")
      .find({ userId })
      .toArray();

    const watchlists: Watchlist[] = watchlistsFromDb.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
      symbol: doc.symbol.toString(),
      userId: doc.userId.toString(),
      addedAt: doc.addedAt.toString(),
      company: doc.company.toString(),
      maxValue: doc.maxValue.toString(),
      minValue: doc.minValue.toString(),
    }));

    return watchlists;
  } catch (e) {
    console.error("Error fetching watchlists: ", e);
    return [];
  }
};
