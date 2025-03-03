"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBlackjack } from "@/lib/context/BlackjackContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PlayingCard from "@/components/cards/PlayingCard";
import LoadingIndicator from "@/components/LoadingIndicator";
import Link from "next/link";
import {
  AlertCircle,
  RefreshCw,
  XCircle,
  Bug,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GameResult from "@/components/GameResult";

export default function GamePage() {
  const {
    gameStatus,
    playerCards,
    dealerCards,
    playerScore,
    dealerScore,
    result,
    balance,
    currentBet,
    isLoading,
    loadingStage,
    error,
    startNewGame,
    hit,
    stand,
    setBet,
    doubleDown,
    dismissError,
    hasBlackjack,
  } = useBlackjack();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [dealerTimer, setDealerTimer] = useState<number>(0);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);
  const [showGameResult, setShowGameResult] = useState(false);

  // Add refs at the top level for console methods
  const originalLogRef = useRef<typeof console.log>(console.log);
  const originalErrorRef = useRef<typeof console.error>(console.error);
  const originalWarnRef = useRef<typeof console.warn>(console.warn);

  // Handle bet change
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setBetAmount(isNaN(value) ? 10 : value);
  };

  // Handle starting a new game
  const handleStartGame = () => {
    startNewGame(betAmount);
  };

  // Add log message
  useEffect(() => {
    // Store original console methods
    originalLogRef.current = console.log;
    originalErrorRef.current = console.error;
    originalWarnRef.current = console.warn;

    console.log = (...args) => {
      originalLogRef.current(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");
      setLogs((prev) => [...prev, `LOG: ${message}`]);
    };

    console.error = (...args) => {
      originalErrorRef.current(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");
      setLogs((prev) => [...prev, `ERROR: ${message}`]);
    };

    console.warn = (...args) => {
      originalWarnRef.current(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");
      setLogs((prev) => [...prev, `WARN: ${message}`]);
    };

    return () => {
      console.log = originalLogRef.current;
      console.error = originalErrorRef.current;
      console.warn = originalWarnRef.current;
    };
  }, []);

  // Scroll logs to bottom when they update
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  // Reset timer when dealer is not playing
  useEffect(() => {
    if (gameStatus !== "dealerTurn") {
      setDealerTimer(0);
      return;
    }

    // Start a timer when dealer is playing to show how long it's taking
    const interval = setInterval(() => {
      setDealerTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus]);

  // Show game result when game ends
  useEffect(() => {
    if (
      gameStatus === "complete" &&
      (result === "player" || result === "dealer" || result === "push")
    ) {
      console.log("Game completed with result:", {
        gameStatus,
        result,
        playerScore,
        dealerScore,
        hasBlackjack,
      });

      setShowGameResult(true);

      // Hide result after 3 seconds
      const timer = setTimeout(() => {
        setShowGameResult(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [gameStatus, result, playerScore, dealerScore, hasBlackjack]);

  // Check if the current hand should have been a win for the dealer
  useEffect(() => {
    // This special check runs when viewing a completed game
    if (gameStatus === "complete" && dealerScore === 21 && playerScore < 21) {
      console.log(
        "IMPORTANT: Dealer has 21, player has less - this should be a dealer win"
      );
      if (result === "player") {
        console.error(
          "CRITICAL BUG: Game showing player win when dealer has 21 and player has less!"
        );
      }
    }
  }, [gameStatus, dealerScore, playerScore, result]);

  // Log the result type determination separately from the render function
  useEffect(() => {
    if (showGameResult) {
      console.log("Determining result type:", { result, hasBlackjack });

      // Special case for dealer having 21
      if (dealerScore === 21 && playerScore < 21) {
        console.log("OVERRIDE: Dealer has 21, forcing correct 'lose' result");
      }

      // Regular result mapping log
      const uiResult =
        result === "player"
          ? "win"
          : result === "dealer"
          ? "lose"
          : result === "push"
          ? "push"
          : null;

      console.log(
        `Transforming game result "${result}" to UI result "${uiResult}"`
      );

      // Special case for blackjack
      if (result === "player" && hasBlackjack) {
        console.log("Player has blackjack!");
      }
    }
  }, [showGameResult, result, dealerScore, playerScore, hasBlackjack]);

  // Convert gameStatus to result type for GameResult component
  const getResultType = () => {
    if (!showGameResult) return null;

    // FIXED: Make sure the result is correct for dealer having 21
    if (dealerScore === 21 && playerScore < 21) {
      return "lose";
    }

    // Regular result mapping
    const uiResult =
      result === "player"
        ? "win"
        : result === "dealer"
        ? "lose"
        : result === "push"
        ? "push"
        : null;

    // Add special case for blackjack
    if (result === "player" && hasBlackjack) {
      return "blackjack";
    }

    return uiResult;
  };

  // Calculate payout amount for result display
  const getPayoutAmount = () => {
    if (result === "player") {
      return hasBlackjack ? currentBet * 2.5 : currentBet * 2;
    }
    return 0;
  };

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: i * 0.1,
      },
    }),
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 },
    },
  };

  // Get loading message based on current stage
  const getLoadingMessage = () => {
    switch (loadingStage) {
      case "shuffling":
        return "Shuffling deck...";
      case "dealing":
        return "Dealing cards...";
      case "playerHit":
        return "Drawing card...";
      case "dealerPlay":
        return `Dealer is playing... (${dealerTimer}s)`;
      case "doubleDown":
        return "Doubling down...";
      default:
        return "Loading...";
    }
  };

  // Handle page reload button
  const handleReload = () => {
    window.location.reload();
  };

  // Render the dealer area with animations
  const renderDealerArea = () => {
    return (
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl text-yellow-300 font-semibold mb-1">Dealer</h2>
        <div className="flex justify-center mb-2">
          <motion.span
            className="text-lg text-white bg-black/50 px-3 py-1 rounded-full"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {dealerScore}
          </motion.span>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {dealerCards.map((card, index) => (
            <PlayingCard
              key={`dealer-${index}`}
              card={
                index === 0 ||
                gameStatus === "dealerTurn" ||
                gameStatus === "complete"
                  ? card
                  : undefined
              }
              isFlipped={
                index !== 0 &&
                gameStatus !== "dealerTurn" &&
                gameStatus !== "complete"
              }
              animationDelay={index * 0.2}
              isNew={
                gameStatus === "dealing" ||
                (gameStatus === "dealerTurn" && index >= dealerCards.length - 1)
              }
            />
          ))}
        </div>
      </motion.div>
    );
  };

  // Render the player area with animations
  const renderPlayerArea = () => {
    return (
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl text-yellow-300 font-semibold mb-1">Player</h2>
        <div className="flex justify-center mb-2">
          <motion.span
            className="text-lg text-white bg-black/50 px-3 py-1 rounded-full"
            initial={{ scale: 0.9 }}
            animate={{
              scale: 1,
              backgroundColor:
                playerScore > 21
                  ? "rgba(220, 38, 38, 0.7)"
                  : "rgba(0, 0, 0, 0.5)",
            }}
            transition={{ duration: 0.3 }}
          >
            {playerScore}
          </motion.span>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          {playerCards.map((card, index) => (
            <PlayingCard
              key={`player-${index}`}
              card={card}
              animationDelay={index * 0.2 + 0.3}
              isNew={
                gameStatus === "dealing" ||
                (gameStatus === "playerTurn" && index >= playerCards.length - 1)
              }
            />
          ))}
        </div>
      </motion.div>
    );
  };

  // Render game controls with animations
  const renderGameControls = () => {
    return (
      <motion.div
        className="flex gap-3 justify-center mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {gameStatus === "playerTurn" && (
          <>
            <motion.button
              className="bg-gradient-to-r from-green-600 to-green-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg hover:shadow-green-500/20"
              onClick={hit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Hit
            </motion.button>
            <motion.button
              className="bg-gradient-to-r from-red-600 to-red-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg hover:shadow-red-500/20"
              onClick={stand}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Stand
            </motion.button>
            {playerCards.length === 2 && balance >= currentBet && (
              <motion.button
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg hover:shadow-blue-500/20"
                onClick={doubleDown}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Double Down
              </motion.button>
            )}
          </>
        )}
        {gameStatus === "complete" && (
          <motion.button
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium py-2 px-6 rounded-lg shadow-lg hover:shadow-yellow-500/20"
            onClick={handleStartGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Play Again
          </motion.button>
        )}
      </motion.div>
    );
  };

  return (
    <main className="game-table flex min-h-screen flex-col items-center justify-between p-4 relative overflow-hidden">
      <motion.header
        className="w-full flex justify-between items-center p-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-yellow-400 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
            Blackjack 21
          </h1>
        </div>
        <motion.div
          className="text-white bg-black/40 px-4 py-2 rounded-lg shadow-md"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <span className="font-semibold text-yellow-300">Balance:</span> $
          {balance.toFixed(2)}
        </motion.div>
      </motion.header>

      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl">
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <>
            {renderDealerArea()}

            <div className="my-8 h-px w-3/4 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

            {renderPlayerArea()}

            {renderGameControls()}

            {gameStatus === "idle" && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h2 className="text-xl text-yellow-300 mb-3 text-center">
                  Place Your Bet
                </h2>
                <div className="flex gap-3 justify-center flex-wrap">
                  {[5, 10, 25, 50, 100].map((chipValue) => (
                    <motion.button
                      key={chipValue}
                      className={`chip-${chipValue} rounded-full w-16 h-16 flex items-center justify-center text-white font-bold shadow-lg`}
                      style={{
                        backgroundColor:
                          chipValue === 5
                            ? "#4299E1"
                            : chipValue === 10
                            ? "#48BB78"
                            : chipValue === 25
                            ? "#ED8936"
                            : chipValue === 50
                            ? "#9F7AEA"
                            : "#F56565",
                      }}
                      onClick={() => setBetAmount(chipValue)}
                      whileHover={{
                        scale: 1.1,
                        rotate: 5,
                        boxShadow:
                          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ${chipValue}
                    </motion.button>
                  ))}
                </div>

                {betAmount > 0 && (
                  <motion.div
                    className="mt-6 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-lg text-white mb-3">
                      Current Bet:{" "}
                      <span className="text-yellow-300 font-bold">
                        ${currentBet}
                      </span>
                    </p>
                    <div className="flex gap-3 justify-center">
                      <motion.button
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg"
                        onClick={handleStartGame}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Deal Cards
                      </motion.button>
                      <motion.button
                        className="bg-gradient-to-r from-red-600 to-red-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg"
                        onClick={() => setBetAmount(0)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Clear Bet
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Game result component */}
      <AnimatePresence>
        {showGameResult && (
          <GameResult result={getResultType()} payout={getPayoutAmount()} />
        )}
      </AnimatePresence>
    </main>
  );
}
