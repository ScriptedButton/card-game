"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

interface LeaderboardEntry {
  playerName: string;
  score: number;
  gamesPlayed: number;
  highestWin: number;
  timestamp: number;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayerName?: string;
}

export default function Leaderboard({
  isOpen,
  onClose,
  currentPlayerName,
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/leaderboard");
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black/80 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/10"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Leaderboard 🏆</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              ✕
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-white/60 text-center py-8">
              No entries yet. Be the first to make it to the leaderboard!
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.playerName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center p-4 rounded-lg ${
                    entry.playerName === currentPlayerName
                      ? "bg-white/20 border border-white/20"
                      : "bg-black/40"
                  }`}
                >
                  <div className="flex-shrink-0 w-8 text-xl font-bold text-white/60">
                    {index + 1}.
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-baseline">
                      <span className="text-lg font-semibold text-white">
                        {entry.playerName}
                      </span>
                      <span className="ml-2 text-sm text-white/60">
                        ({entry.gamesPlayed} games)
                      </span>
                    </div>
                    <div className="text-sm text-white/80">
                      Highest Balance: {entry.score} | Best Win:{" "}
                      {entry.highestWin}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
