"use client";

import React, { useEffect, useRef, useMemo } from "react";
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
  // Add a ref to track if we've already logged the result
  const hasLoggedResult = useRef(false);

  // Calculate payout based on result
  const calculatePayout = () => {
    switch (result) {
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

  const resultData = useMemo(
    () => ({
      win: {
        title: "You Win!",
        message: `You won ${payout} chips!`,
        className: "text-green-500",
        borderColor: "border-green-600",
        color: "from-green-500 to-green-700",
        textColor: "text-green-400",
        icon: "🏆",
      },
      lose: {
        title: "You Lose",
        message: "Better luck next time!",
        className: "text-red-500",
        borderColor: "border-red-600",
        color: "from-red-600 to-red-800",
        textColor: "text-red-400",
        icon: "💸",
      },
      push: {
        title: "Push",
        message: "It's a tie! Your bet has been returned.",
        className: "text-yellow-500",
        borderColor: "border-yellow-500",
        color: "from-blue-600 to-blue-800",
        textColor: "text-blue-400",
        icon: "🤝",
      },
      blackjack: {
        title: "Blackjack!",
        message: `Congratulations! You won ${payout} chips!`,
        className: "text-yellow-400",
        borderColor: "border-yellow-500",
        color: "from-yellow-400 to-yellow-600",
        textColor: "text-yellow-300",
        icon: "🃏",
      },
      dealerWin: {
        title: "Dealer Wins",
        message: "The house always wins... sometimes.",
        className: "text-red-500",
        borderColor: "border-red-600",
        color: "from-red-600 to-red-800",
        textColor: "text-red-400",
        icon: "💸",
      },
      bust: {
        title: "Bust!",
        message: "You went over 21!",
        className: "text-red-500",
        borderColor: "border-red-600",
        color: "from-red-600 to-red-800",
        textColor: "text-red-400",
        icon: "💥",
      },
    }),
    [payout]
  );

  useEffect(() => {
    // Only log if we haven't already
    if (!hasLoggedResult.current) {
      console.log("GameResult received:", {
        result,
        validType: result in resultData,
      });
      hasLoggedResult.current = true;

      // Trigger confetti effect for wins and blackjacks
      if (result === "win" || result === "blackjack") {
        const colors =
          result === "blackjack"
            ? ["#FFD700", "#FFA500"]
            : ["#00FF00", "#32CD32"];

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors,
        });

        // For blackjack, add a second burst of confetti
        if (result === "blackjack") {
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
  }, [result, resultData]); // Add resultData to dependencies

  // Use the result data if it exists, otherwise use lose as fallback
  const currentResult = resultData[result] || resultData.lose;

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
              rotate: result === "blackjack" ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 0.6,
              repeat: result === "blackjack" ? Infinity : 0,
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
          {(result === "win" ||
            result === "blackjack" ||
            result === "push") && (
            <motion.div
              className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-700/50 rounded-lg p-4 mb-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-yellow-200/80 text-sm">
                {result === "push" ? "Returned" : "Payout"}
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                ${payout.toFixed(2)}
              </div>
              {result === "blackjack" && (
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
