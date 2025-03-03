"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/lib/services/cardApi";
import {
  getSuitSymbol,
  getSuitColor,
  getCardDisplay,
} from "@/lib/utils/cardUtils";
import { motion } from "framer-motion";

export interface PlayingCardProps {
  card?: Card;
  isFlipped?: boolean;
  animationDelay?: number;
  isNew?: boolean;
  faceUp?: boolean;
  isWinningHand?: boolean;
}

export default function PlayingCard({
  card,
  isFlipped = false,
  animationDelay = 0,
  isNew = false,
  faceUp = true,
  isWinningHand = false,
}: PlayingCardProps) {
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [isCardFlipped, setIsCardFlipped] = useState(isFlipped);

  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
    }

    setIsCardFlipped(!faceUp);
  }, [faceUp, isInitialMount]);

  // Animation variants
  const cardVariants = {
    initial: {
      opacity: 0,
      y: 50,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: animationDelay,
      },
    },
    exit: {
      opacity: isWinningHand ? 1 : 0,
      y: isWinningHand ? 0 : -20,
      transition: {
        duration: 0.3,
        delay: 0.5,
      },
    },
    hover: {
      scale: 1.05,
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 },
    },
    new: {
      scale: [1, 1.1, 1],
      opacity: [1, 1, 1],
      boxShadow: [
        "0 0 0 rgba(255, 215, 0, 0)",
        "0 0 15px rgba(255, 215, 0, 0.7)",
        "0 0 0 rgba(255, 215, 0, 0)",
      ],
      transition: {
        duration: 1.2,
        times: [0, 0.5, 1],
        delay: 0.2 + animationDelay,
      },
    },
    winning: {
      boxShadow: [
        "0 0 0 rgba(0, 255, 0, 0)",
        "0 0 15px rgba(0, 255, 0, 0.7)",
        "0 0 0 rgba(0, 255, 0, 0)",
      ],
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: 1,
        repeatType: "loop" as const,
      },
    },
  };

  // Only try to access card properties if card is defined
  const suitSymbol = card && card.suit ? getSuitSymbol(card.suit) : "";
  const suitColorClass = card && card.suit ? getSuitColor(card.suit) : "";
  const rankDisplay = card && card.rank ? getCardDisplay(card.rank) : "";

  return (
    <motion.div
      className={`perspective-1000 w-[220px] h-[320px] cursor-pointer ${
        isNew ? "deal-animation" : ""
      }`}
      initial="initial"
      animate={
        isWinningHand
          ? ["animate", "winning"]
          : isNew
          ? ["animate", "new"]
          : "animate"
      }
      exit="exit"
      whileHover="hover"
      variants={cardVariants}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isCardFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Card Front */}
        <div
          className={`absolute w-full h-full backface-hidden bg-white border-2 border-gray-200 shadow-lg ${
            isCardFlipped ? "rotate-y-180 pointer-events-none" : ""
          } flex flex-col justify-between p-4 rounded-xl playing-card-front`}
        >
          {card && (
            <>
              <div
                className={`text-xl font-bold ${suitColorClass} flex items-center top-content`}
              >
                {rankDisplay}
                <span className="ml-1">{suitSymbol}</span>
              </div>
              <div
                className={`text-center text-7xl ${suitColorClass} flex-grow flex items-center justify-center card-symbol`}
              >
                {suitSymbol}
              </div>
              <div
                className={`text-xl font-bold self-end rotate-180 ${suitColorClass} flex items-center bottom-content`}
              >
                {rankDisplay}
                <span className="ml-1">{suitSymbol}</span>
              </div>
            </>
          )}
        </div>

        {/* Card Back */}
        <div
          className={`absolute w-full h-full backface-hidden bg-green-800 border-2 border-gray-200 shadow-lg rotate-y-180 ${
            isCardFlipped ? "" : "pointer-events-none"
          } flex flex-col justify-center items-center p-4 rounded-xl playing-card-back`}
        >
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-4/5 h-4/5 border-4 border-double border-yellow-300 rounded-lg flex items-center justify-center pattern-background">
              <div className="text-yellow-300 text-2xl font-bold">21</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
