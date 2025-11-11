"use client";

import { useEffect, useState } from "react";
import { getWatchlistByUserId } from "@/lib/actions/watchlist.actions";
import { useUser } from "@/components/UserContext";

export default function WatchlistPage() {
  const user = useUser();
  const [watchlist, setWatchlist] = useState<Watchlist[]>([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) return;
      const userWatchlist = await getWatchlistByUserId(user.id);
      setWatchlist(userWatchlist);
    };

    fetchWatchlist();
  }, [user]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  }

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="flex flex-col gap-6">
          <h1 className="break-words w-full">My Watchlist</h1>
          {watchlist.map((item) => (
            <div key={item._id} className="border p-4 rounded shadow-sm">
              <h2>Symbol: {item.symbol}</h2>
              <p>Company: {item.company}</p>
              <p>Added At: {formatDate(item.addedAt)}</p>
              <p>Max Value: {item.maxValue}</p>
              <p>Min Value: {item.minValue}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
