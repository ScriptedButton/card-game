"use client";

import React, { useState } from "react";
import { Card as CardUI } from "@/components/ui/card";
import { Card } from "@/lib/services/cardApi";
import {
  getCardDisplay,
  getSuitColor,
  getSuitSymbol,
} from "@/lib/utils/cardUtils";

interface PlayingCardProps {
  card?: Card;
  isFlipped?: boolean;
  onClick?: () => void;
  backContent?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  hasError?: boolean;
}

const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFlipped = false,
  onClick,
  backContent,
  className = "",
  isLoading = false,
  hasError = false,
}) => {
  const [flipped, setFlipped] = useState(isFlipped);

  const handleClick = () => {
    if (isLoading || hasError) return;
    setFlipped(!flipped);
    if (onClick) onClick();
  };

  // Only try to access card properties if card is defined
  const suitSymbol = card && card.suit ? getSuitSymbol(card.suit) : "";
  const suitColorClass = card && card.suit ? getSuitColor(card.suit) : "";
  const rankDisplay = card && card.rank ? getCardDisplay(card.rank) : "";

  const renderCardContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 border-t-2 border-yellow-500 border-solid rounded-full animate-spin"></div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <p className="text-red-400">Card error</p>
        </div>
      );
    }

    if (!card || !card.rank || !card.suit) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <p className="text-gray-500">No card available</p>
        </div>
      );
    }

    return (
      <>
        <div className={`text-xl font-bold ${suitColorClass}`}>
          {rankDisplay}
          <span className="ml-1">{suitSymbol}</span>
        </div>
        <div className={`text-center text-6xl ${suitColorClass}`}>
          {suitSymbol}
        </div>
        <div
          className={`text-xl font-bold self-end rotate-180 ${suitColorClass}`}
        >
          {rankDisplay}
          <span className="ml-1">{suitSymbol}</span>
        </div>
      </>
    );
  };

  return (
    <div
      className={`perspective-1000 w-[220px] h-[320px] cursor-pointer ${className} ${
        isLoading || hasError ? "cursor-not-allowed" : ""
      }`}
      onClick={handleClick}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Card Front */}
        <CardUI
          className={`absolute w-full h-full backface-hidden ${
            hasError ? "bg-red-900/20" : "bg-white"
          } border-2 ${
            hasError ? "border-red-600" : "border-gray-200"
          } shadow-lg ${
            flipped ? "rotate-y-180 pointer-events-none" : ""
          } flex flex-col justify-between p-4`}
        >
          {renderCardContent()}
        </CardUI>

        {/* Card Back */}
        <CardUI
          className={`absolute w-full h-full backface-hidden bg-green-800 border-2 border-gray-200 shadow-lg rotate-y-180 ${
            flipped ? "" : "pointer-events-none"
          } flex flex-col justify-center items-center p-4`}
        >
          {backContent || (
            <div className="h-full w-full flex items-center justify-center">
              <div className="w-4/5 h-4/5 border-4 border-double border-yellow-300 rounded-lg flex items-center justify-center">
                <div className="text-yellow-300 text-2xl font-bold">
                  Card Game
                </div>
              </div>
            </div>
          )}
        </CardUI>
      </div>
    </div>
  );
};

export default PlayingCard;
