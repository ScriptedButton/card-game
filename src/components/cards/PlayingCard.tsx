"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/lib/services/cardApi";
import {
  getSuitSymbol,
  getSuitColor,
  getCardDisplay,
} from "@/lib/utils/cardUtils";

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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cardBounds, setCardBounds] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const cardRef = React.useRef<HTMLDivElement>(null);
  const hasAnimated = React.useRef(false);

  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
    }

    setIsCardFlipped(!faceUp);
  }, [faceUp, isInitialMount]);

  // Reset animation state when a new card is added
  useEffect(() => {
    // Reset the animation state when the card changes
    hasAnimated.current = false;

    // Set a timeout to mark the card as animated after the animation completes
    if (isNew) {
      const timeout = setTimeout(() => {
        hasAnimated.current = true;
      }, 800); // Match the animation duration

      return () => clearTimeout(timeout);
    }
  }, [isNew, card]); // Add card as a dependency to reset animation when card changes

  useEffect(() => {
    // Update card boundaries when mounted
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCardBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  // Handle mouse move for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    setCardBounds({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });

    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Calculate the 3D tilt values based on mouse position
  const calculateTilt = () => {
    if (cardBounds.width === 0 || isCardFlipped) return { x: 0, y: 0 };

    // Calculate the tilt based on mouse position relative to card center
    const centerX = cardBounds.width / 2;
    const centerY = cardBounds.height / 2;

    // Calculate tilt (max 15 degrees)
    const tiltX = ((mousePosition.y - centerY) / centerY) * 10;
    const tiltY = ((centerX - mousePosition.x) / centerX) * 10;

    return { x: tiltX, y: tiltY };
  };

  // Calculate the shine position
  const calculateShine = () => {
    if (cardBounds.width === 0 || isCardFlipped)
      return { opacity: 0, x: "50%", y: "50%" };

    const x = (mousePosition.x / cardBounds.width) * 100;
    const y = (mousePosition.y / cardBounds.height) * 100;

    return {
      opacity: 0.15,
      x: `${x}%`,
      y: `${y}%`,
    };
  };

  const tilt = calculateTilt();
  const shine = calculateShine();

  const cardWrapperStyle: React.CSSProperties = {
    opacity: isNew && !hasAnimated.current ? 0 : 1,
    transform: `scale(${isNew && !hasAnimated.current ? 0.8 : 1}) translateY(${
      isNew && !hasAnimated.current ? "50px" : "0"
    })`,
    transition: `opacity 0.8s ease, transform 0.8s ease`,
  };

  if (animationDelay > 0) {
    cardWrapperStyle.transitionDelay = `${animationDelay}s`;
  }

  return (
    <div className="perspective-1000" style={cardWrapperStyle}>
      <div
        ref={cardRef}
        className={`relative transform-style-3d w-[120px] h-[170px] ${
          isNew && !hasAnimated.current ? "deal-animation" : ""
        } ${isWinningHand ? "animate-pulse" : ""}`}
        style={{ transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
      >
        <div
          className="playing-card-front absolute w-full h-full backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: isCardFlipped
              ? "rotateY(180deg)"
              : `rotateY(0deg) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          {card && (
            <>
              {/* Card Top Left */}
              <div className="absolute top-3 left-3 flex flex-col items-center">
                <div className={`font-bold ${getSuitColor(card.suit)}`}>
                  {getCardDisplay(card.rank)}
                </div>
                <div
                  className={`text-lg card-symbol ${getSuitColor(card.suit)}`}
                >
                  {getSuitSymbol(card.suit)}
                </div>
              </div>

              {/* Card Bottom Right */}
              <div className="absolute bottom-3 right-3 flex flex-col items-center rotate-180">
                <div className={`font-bold ${getSuitColor(card.suit)}`}>
                  {getCardDisplay(card.rank)}
                </div>
                <div
                  className={`text-lg card-symbol ${getSuitColor(card.suit)}`}
                >
                  {getSuitSymbol(card.suit)}
                </div>
              </div>

              {/* Card Center Symbol */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`text-6xl card-symbol ${getSuitColor(card.suit)}`}
                >
                  {getSuitSymbol(card.suit)}
                </div>
              </div>

              {/* Background Pattern */}
              <div className="pattern-background"></div>

              {/* Dynamic Shine Effect */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)",
                  left: shine.x,
                  top: shine.y,
                  transform: "translate(-50%, -50%)",
                  width: "150%",
                  height: "150%",
                  opacity: shine.opacity,
                  mixBlendMode: "soft-light",
                  transition:
                    "opacity 0.1s ease, left 0.1s ease, top 0.1s ease",
                }}
              />
            </>
          )}
        </div>

        <div
          className="playing-card-back absolute w-full h-full backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: isCardFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
          }}
        >
          <div className="flex items-center justify-center h-full text-white text-opacity-30 font-bold text-lg">
            <div className="transform-style-3d rotate-y-180">B♠J</div>
          </div>
        </div>
      </div>
    </div>
  );
}
