"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export type ResultType =
  | "win"
  | "lose"
  | "push"
  | "blackjack"
  | "dealerWin"
  | "bust";

interface GameResultProps {
  result: ResultType;
  playerScore: number;
  dealerScore: number;
  hasBlackjack: boolean;
  currentBet: number;
}

const GameResult: React.FC<GameResultProps> = ({
  result,
  playerScore,
  dealerScore,
  hasBlackjack,
  currentBet,
}) => {
  // Safety check: Override result for equal scores
  let correctedResult = result;

  // If scores are equal and neither exceeded 21, it should be a push
  if (playerScore === dealerScore && playerScore <= 21 && dealerScore <= 21) {
    if (result !== "push") {
      console.error(
        "RESULT CORRECTION: Equal scores should be a push! Fixing display.",
        {
          original: result,
          playerScore,
          dealerScore,
        }
      );
      correctedResult = "push";
    }
  }

  // Add a ref to track if we've already logged the result
  const hasLoggedResult = useRef(false);

  // Calculate payout based on result
  const calculatePayout = () => {
    switch (correctedResult) {
      case "blackjack":
        return currentBet * 2.5; // 3:2 payout for blackjack
      case "win":
        return currentBet * 2; // 1:1 payout for regular win
      case "push":
        return currentBet; // return original bet for push
      default:
        return 0; // lose, get nothing
    }
  };

  const payout = calculatePayout();

  useEffect(() => {
    // Only log if we haven't already
    if (!hasLoggedResult.current) {
      console.log("GameResult received:", {
        result: correctedResult,
        validType: correctedResult in resultData,
      });
      hasLoggedResult.current = true;

      // Trigger confetti effect for wins and blackjacks
      if (correctedResult === "win" || correctedResult === "blackjack") {
        const duration = correctedResult === "blackjack" ? 3000 : 2000;
        const colors =
          correctedResult === "blackjack"
            ? ["#FFD700", "#FFA500"]
            : ["#00FF00", "#32CD32"];

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors,
        });

        // For blackjack, add a second burst of confetti
        if (correctedResult === "blackjack") {
          setTimeout(() => {
            confetti({
              particleCount: 150,
              spread: 100,
              origin: { y: 0.6 },
              colors: colors,
            });
          }, 500);
        }
      }
    }
  }, [correctedResult]); // Now we can safely include correctedResult in dependencies

  const resultData = {
    win: {
      title: "You Win!",
      message: `You beat the dealer with a score of ${playerScore}!`,
      color: "from-green-500 to-green-700",
      textColor: "text-green-400",
      borderColor: "border-green-600",
      icon: "🏆",
    },
    blackjack: {
      title: "Blackjack!",
      message: "Perfect hand! You got a Blackjack!",
      color: "from-yellow-400 to-yellow-600",
      textColor: "text-yellow-300",
      borderColor: "border-yellow-500",
      icon: "🃏",
    },
    push: {
      title: "Push",
      message: "It's a tie. Your bet has been returned.",
      color: "from-blue-600 to-blue-800",
      textColor: "text-blue-400",
      borderColor: "border-blue-600",
      icon: "🤝",
    },
    lose: {
      title: "You Lose",
      message: `The dealer won with a score of ${dealerScore}.`,
      color: "from-red-600 to-red-800",
      textColor: "text-red-400",
      borderColor: "border-red-600",
      icon: "💸",
    },
    dealerWin: {
      title: "Dealer Wins",
      message: `The dealer won with a score of ${dealerScore}.`,
      color: "from-red-600 to-red-800",
      textColor: "text-red-400",
      borderColor: "border-red-600",
      icon: "💸",
    },
    bust: {
      title: "Bust!",
      message: `You went over 21 with a score of ${playerScore}.`,
      color: "from-red-600 to-red-800",
      textColor: "text-red-400",
      borderColor: "border-red-600",
      icon: "💥",
    },
    // Default fallback for unexpected result types
    default: {
      title: "Game Over",
      message: "The game has ended.",
      color: "from-gray-600 to-gray-800",
      textColor: "text-gray-400",
      borderColor: "border-gray-600",
      icon: "🎮",
    },
  };

  // Use the result data if it exists, otherwise use default
  const currentResult = resultData[correctedResult] || resultData.default;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 25,
          duration: 0.4,
        }}
        className={`w-[340px] max-w-md mx-auto backdrop-blur-lg bg-black/40 rounded-2xl overflow-hidden shadow-2xl border-2 ${currentResult.borderColor}`}
      >
        <div
          className={`bg-gradient-to-r ${currentResult.color} text-white p-4 text-center relative overflow-hidden`}
        >
          {/* Animated background design */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1%, transparent 7%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 1%, transparent 7%)",
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          {/* Light streak animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            animate={{
              opacity: [0, 0.5, 0],
              left: ["-100%", "100%", "100%"],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />

          <motion.div
            className="text-6xl mb-2"
            animate={{
              scale: [1, 1.2, 1],
              rotate: correctedResult === "blackjack" ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 0.6,
              repeat: correctedResult === "blackjack" ? Infinity : 0,
              repeatType: "loop",
            }}
          >
            {currentResult.icon}
          </motion.div>
          <h2 className="text-2xl font-bold mb-1">{currentResult.title}</h2>
        </div>

        <div className="p-6">
          <p className={`${currentResult.textColor} text-lg text-center mb-6`}>
            {currentResult.message}
          </p>

          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/20 p-3 rounded-lg text-center">
              <div className="text-white/60 text-sm">Your Score</div>
              <div
                className={`text-xl font-bold ${
                  playerScore > 21 ? "text-red-500" : "text-white"
                }`}
              >
                {playerScore} {hasBlackjack && "♠♥"}
              </div>
            </div>
            <div className="bg-black/20 p-3 rounded-lg text-center">
              <div className="text-white/60 text-sm">Dealer Score</div>
              <div
                className={`text-xl font-bold ${
                  dealerScore > 21 ? "text-red-500" : "text-white"
                }`}
              >
                {dealerScore}
              </div>
            </div>
          </div>

          {/* Payout display */}
          {(correctedResult === "win" ||
            correctedResult === "blackjack" ||
            correctedResult === "push") && (
            <motion.div
              className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-700/50 rounded-lg p-4 mb-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-yellow-200/80 text-sm">
                {correctedResult === "push" ? "Returned" : "Payout"}
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                ${payout.toFixed(2)}
              </div>
              {correctedResult === "blackjack" && (
                <div className="text-yellow-200/70 text-xs mt-1">
                  Blackjack pays 3:2
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Decorative card symbols at the bottom */}
        <div className="flex justify-center gap-4 mb-4 text-white/30 text-xl">
          <span>♠</span>
          <span>♥</span>
          <span>♦</span>
          <span>♣</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameResult;
