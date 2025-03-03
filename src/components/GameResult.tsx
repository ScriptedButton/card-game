"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type ResultType = "win" | "lose" | "push" | "blackjack" | null;

interface GameResultProps {
  result: ResultType;
  payout?: number;
}

const GameResult: React.FC<GameResultProps> = ({ result, payout = 0 }) => {
  // Add debug logging
  useEffect(() => {
    console.log("GameResult rendered with:", { result, payout });

    // Safety check - can't access scores directly here, rely on the fix in the parent component
    if (result === "win") {
      console.log(
        "Win result displayed - check console.logs to verify this is correct"
      );
    }
  }, [result, payout]);

  useEffect(() => {
    // Launch confetti for win or blackjack
    if (result === "win" || result === "blackjack") {
      const duration = result === "blackjack" ? 3000 : 1500;
      const particleCount = result === "blackjack" ? 150 : 80;

      confetti({
        particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FF4500"],
        gravity: 0.8,
        scalar: 1.2,
        shapes: ["circle", "square"],
        ticks: 200,
      });

      if (result === "blackjack") {
        // For blackjack, add a second confetti burst after a delay
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 80,
            origin: { x: 0, y: 0.6 },
            colors: ["#FFD700", "#FFA500", "#FF4500"],
          });

          confetti({
            particleCount: 100,
            angle: 120,
            spread: 80,
            origin: { x: 1, y: 0.6 },
            colors: ["#FFD700", "#FFA500", "#FF4500"],
          });
        }, 300);
      }
    }
  }, [result]);

  if (!result) return null;

  const resultText = {
    win: "You Win!",
    lose: "Dealer Wins",
    push: "Push",
    blackjack: "Blackjack!",
  };

  const resultClasses = {
    win: "text-green-400",
    lose: "text-red-500",
    push: "text-yellow-300",
    blackjack: "text-yellow-400",
  };

  const variants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: { duration: 0.3 },
    },
  };

  // Additional animation for the payout amount
  const payoutVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3,
        duration: 0.5,
      },
    },
    exit: { opacity: 0, y: 10 },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <motion.div
          className={`text-center p-6 pointer-events-auto`}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <h2
            className={`text-5xl font-bold mb-3 ${resultClasses[result]} animate-pulse`}
          >
            {resultText[result]}
          </h2>

          {(result === "win" || result === "blackjack") && payout > 0 && (
            <motion.div
              className="text-2xl font-semibold text-yellow-300"
              variants={payoutVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              +${payout.toFixed(2)}
            </motion.div>
          )}

          {/* Add debug info */}
          <div className="mt-2 text-xs text-gray-400">
            Debug: Result type "{result}"
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GameResult;
