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
import { Card as PlayingCardType } from "@/lib/services/cardApi";

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
  // Game history to preserve completed hands
  const [gameHistory, setGameHistory] = useState<{
    playerCards: PlayingCardType[];
    dealerCards: PlayingCardType[];
    result: typeof result;
    playerScore: number;
    dealerScore: number;
    hasBlackjack: boolean;
    currentBet: number;
  } | null>(null);

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
    console.log("Starting game with bet amount:", betAmount);
    startNewGame(betAmount);
  };

  // Handle chip selection
  const handleChipClick = (value: number) => {
    console.log("Chip selected:", value);
    // Update the local state first
    setBetAmount(value);

    // Update the context state if in idle mode
    if (gameStatus === "idle") {
      setBet(value);
    }
  };

  // Add log message
  useEffect(() => {
    // Store original console methods
    originalLogRef.current = console.log;
    originalErrorRef.current = console.error;
    originalWarnRef.current = console.warn;

    // Use useCallback to memoize the console method overrides
    const logFunction = (...args: any[]) => {
      originalLogRef.current(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");

      // Use a function to update state instead of directly updating
      setTimeout(() => {
        setLogs((prev) => [...prev, `LOG: ${message}`]);
      }, 0);
    };

    const errorFunction = (...args: any[]) => {
      originalErrorRef.current(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");

      // Use a function to update state instead of directly updating
      setTimeout(() => {
        setLogs((prev) => [...prev, `ERROR: ${message}`]);
      }, 0);
    };

    const warnFunction = (...args: any[]) => {
      originalWarnRef.current(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");

      // Use a function to update state instead of directly updating
      setTimeout(() => {
        setLogs((prev) => [...prev, `WARN: ${message}`]);
      }, 0);
    };

    console.log = logFunction;
    console.error = errorFunction;
    console.warn = warnFunction;

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

  // Show game result when game ends and save the current game to history
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

      // Store the current game state in history
      setGameHistory({
        playerCards: [...playerCards],
        dealerCards: [...dealerCards],
        result,
        playerScore,
        dealerScore,
        hasBlackjack,
        currentBet,
      });

      setShowGameResult(true);

      // Hide result after 3 seconds and reset game state
      const timer = setTimeout(() => {
        setShowGameResult(false);
        if (gameStatus === "complete") {
          console.log(
            "Game is complete, waiting for user to choose next action"
          );
          // We don't automatically reset - wait for the user to press Play Again
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [
    gameStatus,
    result,
    playerScore,
    dealerScore,
    hasBlackjack,
    playerCards,
    dealerCards,
    currentBet,
  ]);

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

  // Memoize the result type and payout amount to prevent recalculations during render
  const memoizedResultType = React.useMemo(
    () => getResultType(),
    [showGameResult, result, dealerScore, playerScore, hasBlackjack]
  );

  const memoizedPayoutAmount = React.useMemo(
    () => getPayoutAmount(),
    [result, hasBlackjack, currentBet]
  );

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

  // Handle restarting the game when errors occur
  const handleRestartGame = () => {
    console.log("Restarting game after error");
    dismissError();
    // Reset to idle state
    setShowGameResult(false);
    setBetAmount(10);
    handleChipClick(10);
  };

  // Explicitly reset the game state to show chips
  const handlePlayAgain = () => {
    console.log("Playing again, resetting to idle state");
    setShowGameResult(false);
    setBetAmount(10);

    // Keep the game history data until a new game starts
    // This ensures cards remain visible during transition

    // Wait for UI update before starting new game
    setTimeout(() => {
      // Clear the game history when starting a new game
      setGameHistory(null);
      startNewGame(10);
    }, 0);
  };

  // Render the dealer area with animations
  const renderDealerArea = () => {
    // Use cards from game history if available and game is complete
    const cardsToDisplay =
      gameStatus === "complete" && gameHistory
        ? gameHistory.dealerCards
        : dealerCards;

    // Use score from game history if available and game is complete
    const scoreToDisplay =
      gameStatus === "complete" && gameHistory
        ? gameHistory.dealerScore
        : dealerScore;

    // Determine what to show for score
    const displayedScore =
      gameStatus === "dealerTurn" || gameStatus === "complete"
        ? scoreToDisplay
        : cardsToDisplay.length > 0
        ? "?"
        : "0";

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
            {displayedScore}
          </motion.span>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <AnimatePresence mode="sync" presenceAffectsLayout={false}>
            {cardsToDisplay.map((card, index) => (
              <PlayingCard
                key={`dealer-${card.suit}-${card.rank}-${index}`}
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
                  (gameStatus === "dealerTurn" &&
                    index >= dealerCards.length - 1)
                }
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Render the player area with animations
  const renderPlayerArea = () => {
    // Use cards from game history if available and game is complete
    const cardsToDisplay =
      gameStatus === "complete" && gameHistory
        ? gameHistory.playerCards
        : playerCards;

    // Use score from game history if available and game is complete
    const scoreToDisplay =
      gameStatus === "complete" && gameHistory
        ? gameHistory.playerScore
        : playerScore;

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
                scoreToDisplay > 21
                  ? "rgba(220, 38, 38, 0.7)"
                  : "rgba(0, 0, 0, 0.5)",
            }}
            transition={{ duration: 0.3 }}
          >
            {scoreToDisplay}
          </motion.span>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <AnimatePresence mode="sync" presenceAffectsLayout={false}>
            {cardsToDisplay.map((card, index) => (
              <PlayingCard
                key={`player-${card.suit}-${card.rank}-${index}`}
                card={card}
                animationDelay={index * 0.2 + 0.3}
                isNew={
                  gameStatus === "dealing" ||
                  (gameStatus === "playerTurn" &&
                    index >= cardsToDisplay.length - 1 &&
                    index >= playerCards.length - 1) // Only new if added during current game
                }
                isWinningHand={gameStatus === "complete" && result === "player"}
              />
            ))}
          </AnimatePresence>
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
            onClick={handlePlayAgain}
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

  // Debug logging for game status changes
  useEffect(() => {
    console.log(`Game status changed to: ${gameStatus}`);

    if (gameStatus === "idle") {
      console.log("Game is idle - chips should be visible now");
    } else if (gameStatus === "complete") {
      console.log("Game complete - cards should remain visible");
      // Log if we have game history to confirm preservation
      if (gameHistory) {
        console.log("Game history is preserved:", {
          playerCards: gameHistory.playerCards.length,
          dealerCards: gameHistory.dealerCards.length,
          result: gameHistory.result,
        });
      } else {
        console.warn("No game history available for completed game!");
      }
    }
  }, [gameStatus, gameHistory]);

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
        {/* Display error message if there is one */}
        {error && (
          <motion.div
            className="mb-4 p-4 bg-red-600/80 text-white rounded-lg shadow-lg w-full max-w-md"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start">
              <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <button
                  onClick={handleRestartGame}
                  className="mt-2 bg-red-700 hover:bg-red-800 text-white py-1 px-4 rounded-md text-sm flex items-center"
                >
                  <RefreshCw className="mr-1 h-4 w-4" /> Restart Game
                </button>
              </div>
              <button
                onClick={dismissError}
                className="ml-3 flex-shrink-0 text-white hover:text-red-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

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
                      onClick={() => handleChipClick(chipValue)}
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
                        ${gameStatus === "idle" ? betAmount : currentBet}
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
          <GameResult
            result={memoizedResultType}
            payout={memoizedPayoutAmount}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
