"use client";

import { useEffect, useState } from "react";
import { getWatchlistByUserId } from "@/lib/actions/watchlist.actions";
import { useUser } from "@/components/UserContext";
import WatchlistButton from "@/components/WatchlistButton";

export default function WatchlistPage() {
  const user = useUser();
  const [watchlist, setWatchlist] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) {
        setLoading(false); // prevent endless spinner when logging in
        return;
      }
      try {
        setLoading(true);
        const userWatchlist = await getWatchlistByUserId(user.id);
        setWatchlist(userWatchlist);
      } catch (err) {
        setError("Failed to load watchlist. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    if (!isAdded) {
      // Remove from local state so user doesn't see removed items in watchlist
      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading your watchlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4">
      <section className="w-full max-w-4xl">
        <div className="flex flex-col gap-6">
          <h1 className="break-words w-full">My Watchlist</h1>
          {watchlist.length === 0 ? (
            <p>
              Your watchlist is empty. Start adding stocks to track them here.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {watchlist.map((item) => (
                <div
                  key={item._id}
                  className="border border-white p-4 rounded shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="text-center">
                      <span className="font-semibold"></span> {item.symbol}
                    </div>
                    <div className="text-center">
                      <span className="font-semibold"></span> {item.company}
                    </div>
                    <div className="text-center">
                      <span className="font-semibold">Date Added:</span>{" "}
                      {formatDate(item.addedAt)}
                    </div>
                    <div className="text-center">
                      <span className="font-semibold">Min Value:</span>{" "}
                      {item.minValue}
                    </div>
                    <div className="text-center">
                      <span className="font-semibold">Max Value:</span>{" "}
                      {item.maxValue}
                    </div>
                    <div>
                      {" "}
                      <WatchlistButton
                        symbol={item.symbol.toUpperCase()}
                        company={item.company.toUpperCase()}
                        userId={user.id}
                        isInWatchlist={true}
                        onWatchlistChange={handleWatchlistChange}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
