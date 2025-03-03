"use client";

import React from "react";
import { motion } from "framer-motion";

export type LoadingStage = "shuffling" | "dealing" | "calculating" | "loading";

interface LoadingIndicatorProps {
  loadingStage?: LoadingStage;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  loadingStage = "loading",
}) => {
  const messages = {
    shuffling: "Shuffling Deck...",
    dealing: "Dealing Cards...",
    calculating: "Calculating Results...",
    loading: "Loading Game...",
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, rotateY: 180 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateY: i % 2 === 0 ? [180, 0] : [180, 0],
      transition: {
        opacity: { duration: 0.3 },
        y: { type: "spring", stiffness: 300, damping: 15 },
        rotateY: { duration: 0.5, delay: i * 0.1 },
        delay: i * 0.15,
      },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: -20,
      rotateY: 180,
      transition: {
        duration: 0.3,
        delay: i * 0.05,
      },
    }),
  };

  // Shimmer effect for cards
  const shimmerVariants = {
    initial: {
      x: "-100%",
      opacity: 0,
    },
    animate: {
      x: "100%",
      opacity: [0, 0.1, 0.2, 0.1, 0],
      transition: {
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 2,
        ease: "easeInOut",
      },
    },
  };

  // Progress indicator
  const progressVariants = {
    initial: { width: "0%" },
    animate: {
      width: "100%",
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  };

  // Cards to display based on loading stage
  const getCardCount = () => {
    switch (loadingStage) {
      case "shuffling":
        return 4;
      case "dealing":
        return 2;
      case "calculating":
        return 3;
      default:
        return 4;
    }
  };

  const getCardColors = (index: number) => {
    const suits = ["♠", "♥", "♦", "♣"];
    const colors = ["text-black", "text-red-600", "text-red-600", "text-black"];

    return {
      suit: suits[index % 4],
      color: colors[index % 4],
    };
  };

  const renderCards = () => {
    const cards = [];
    const numCards = getCardCount();

    for (let i = 0; i < numCards; i++) {
      const { suit, color } = getCardColors(i);
      cards.push(
        <motion.div
          key={i}
          className="relative w-16 h-24 rounded-lg bg-white shadow-xl border border-gray-200 flex items-center justify-center transform-style-preserve-3d"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          custom={i}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Card Front */}
          <div className={`text-4xl ${color} font-bold`}>{suit}</div>

          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
          />

          {/* Card Back (invisible when flipped) */}
          <div
            className="absolute inset-0 bg-blue-800 rounded-lg backface-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 2px, transparent 0, transparent 4px)",
            }}
          ></div>
        </motion.div>
      );
    }

    return cards;
  };

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/10">
      <div className="text-center mb-6">
        <motion.h2
          className="text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {messages[loadingStage]}
        </motion.h2>

        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
            variants={progressVariants}
            initial="initial"
            animate="animate"
          />
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 py-4">
        {renderCards()}
      </div>

      <div className="mt-6 text-center">
        <motion.p
          className="text-white/70 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Preparing your game experience...
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
