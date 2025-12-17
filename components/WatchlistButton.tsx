"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  addWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";

const WatchlistButton = ({
  userId,
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [showWidget, setShowWidget] = useState(false);
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");

  // Helper to allow only up to 2 decimal places
  const formatDecimal = (value: string) => {
    if (value === "") return "";
    const regex = /^\d*\.?\d{0,2}$/; // digits with up to 2 decimals
    if (regex.test(value)) return value;
    // If invalid, truncate to 2 decimals
    const [integer, decimal] = value.split(".");
    if (decimal) {
      return `${integer}.${decimal.slice(0, 2)}`;
    }
    return integer;
  };

  const handleRangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minValue || !maxValue) {
      alert("Please enter both min and max values");
      return;
    }

    try {
      const response = await addWatchlist({
        userId,
        symbol,
        company,
        minValue: parseFloat(minValue),
        maxValue: parseFloat(maxValue),
      });

      if (!response || !response.success) {
        throw new Error("Failed to save watchlist range");
      }
      setShowWidget(false);
      alert("Watchlist range saved!");
    } catch (err) {
      console.error(err);
      alert("Error saving watchlist range");
    }
  };

  const handleClick = async () => {
    const next = !added;
    if (next) {
      setAdded(next);
      onWatchlistChange?.(symbol, next);
      setShowWidget(true);
    } else {
      try {
        const response = await removeFromWatchlist({ userId, symbol });
        if (!response?.success)
          throw new Error(response?.error || "Failed to remove from watchlist");

        setAdded(next);
        onWatchlistChange?.(symbol, next);
        alert("Stock removed from watchlist!");
      } catch (err) {
        console.error(err);
        alert("Error removing from watchlist");
        setAdded(false);
        onWatchlistChange?.(symbol, false);
        setShowWidget(false);
      }
    }
  };

  const label = useMemo(() => {
    if (type === "icon") return "";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type]);

  return (
    <>
      <button
        className={`watchlist-btn ${added ? "watchlist-remove" : ""}`}
        onClick={handleClick}
      >
        {showTrashIcon && added ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6"
            />
          </svg>
        ) : null}
        <span>{label}</span>
      </button>

      {showWidget && (
        <div className="range-widget-overlay">
          <div className="range-widget-box">
            <h3>Set Watch Range</h3>
            <form onSubmit={handleRangeSubmit}>
              <label>
                Min Price:
                <input
                  type="text"
                  inputMode="decimal"
                  value={minValue}
                  onChange={(e) => setMinValue(formatDecimal(e.target.value))}
                  placeholder="e.g. 90.25"
                />
              </label>

              <label>
                Max Price:
                <input
                  type="text"
                  inputMode="decimal"
                  value={maxValue}
                  onChange={(e) => setMaxValue(formatDecimal(e.target.value))}
                  placeholder="e.g. 120.50"
                />
              </label>

              <div className="range-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowWidget(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default WatchlistButton;
