"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useBlackjack } from "@/lib/context/BlackjackContext";
import { Button } from "@/components/ui/button";
import PlayingCard from "@/components/cards/PlayingCard";
import LoadingIndicator, {
  LoadingStage as LoadingIndicatorStage,
} from "@/components/LoadingIndicator";
import Link from "next/link";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import GameResult, { ResultType } from "@/components/GameResult";
import { isBust } from "@/lib/utils/blackjackUtils";

// Define types needed for the component
type GameResult = "player" | "dealer" | "push" | null;

// Add a helper function to convert GameResult to ResultType
const mapResultToResultType = (result: GameResult): ResultType => {
  if (result === "player") return "win";
  if (result === "dealer") return "lose";
  if (result === "push") return "push";
  return "lose"; // Default fallback
};

// Convert LoadingStage from context to LoadingIndicatorStage
const mapLoadingStage = (stage: string): LoadingIndicatorStage => {
  if (stage === "shuffling") return "shuffling";
  if (stage === "dealing") return "dealing";
  if (stage === "playerHit" || stage === "dealerPlay" || stage === "doubleDown")
    return "calculating";
  return "loading";
};

// Add a simpler isBustScore function that works with score numbers
const isBustScore = (score: number): boolean => {
  return score > 21;
};

// Define types for the floating symbols
interface FloatingSymbol {
  symbol: string;
  left: string;
  top: string;
  rotation: string;
  duration: string;
  delay: string;
  isRed: boolean;
  key: string;
}

// Add this component before the GamePage component
function FloatingCardSymbols() {
  const [symbols, setSymbols] = useState<FloatingSymbol[]>([]);

  useEffect(() => {
    // Generate stable positions for symbols
    const generatedSymbols: FloatingSymbol[] = [];
    ["♠", "♥", "♦", "♣"].forEach((symbol, i) => {
      for (let j = 0; j < 3; j++) {
        // Use seeded random numbers for consistency
        const seed = i * 10 + j;
        const left = i * 25 + (seed % 10) + "%";
        const top = j * 30 + 10 + "%";
        const rotation = ((seed * 7) % 180) - 90 + "deg";
        const duration = 15 + (seed % 20) + "s";
        const delay = i * 2 + j * 5 + "s";

        generatedSymbols.push({
          symbol,
          left,
          top,
          rotation,
          duration,
          delay,
          isRed: symbol === "♥" || symbol === "♦",
          key: `${symbol}-${j}`,
        });
      }
    });

    setSymbols(generatedSymbols);
  }, []);

  if (symbols.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {symbols.map((item) => (
        <div
          key={item.key}
          className={`absolute text-4xl ${
            item.isRed ? "text-red-500/20" : "text-white/20"
          } font-bold`}
          style={{
            left: item.left,
            top: item.top,
            transform: `rotate(${item.rotation})`,
            animation: `floatDownward ${item.duration} linear ${item.delay} infinite`,
          }}
        >
          {item.symbol}
        </div>
      ))}
    </div>
  );
}

// Add this component for client-side only confetti
function ConfettiCelebration() {
  const [confetti, setConfetti] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    // Generate confetti only on the client
    const confettiElements = Array.from({ length: 50 }).map((_, i) => (
      <div
        key={i}
        className="confetti"
        style={{
          left: `${Math.random() * 100}%`,
          top: "-10px",
          width: `${Math.random() * 10 + 5}px`,
          height: `${Math.random() * 10 + 5}px`,
          animationDelay: `${Math.random() * 2}s`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }}
      ></div>
    ));

    setConfetti(confettiElements);
  }, []);

  return <div className="celebration">{confetti}</div>;
}

export default function GamePage() {
  // Re-add client-side detection state
  const [isClient, setIsClient] = useState(false);

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
    hasBlackjack,
    startNewGame,
    hit,
    stand,
    setBet,
    doubleDown,
    dismissError,
    resetGame,
  } = useBlackjack();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);
  const [showGameResult, setShowGameResult] = useState(false);

  // Add refs at the top level for console methods
  const originalLogRef = useRef<typeof console.log>(console.log);
  const originalErrorRef = useRef<typeof console.error>(console.error);
  const originalWarnRef = useRef<typeof console.warn>(console.warn);

  // Add a new state to track mouse position for ambient lighting
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Set up client-side detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle mouse move for ambient lighting effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Handle starting a new game
  const handleStartGame = () => {
    console.log("Starting game with bet amount:", betAmount);
    startNewGame(betAmount);
  };

  // Handle chip selection
  const handleChipClick = (value: number) => {
    console.log("Chip selected:", value, "Current game status:", gameStatus);

    // Update the local state first
    setBetAmount(value);

    // Update the context state if in idle mode
    if (gameStatus === "idle") {
      console.log("Setting bet in context to:", value);
      setBet(value);
    } else {
      console.log(
        "Can't update bet - game is not in idle state (current state:",
        gameStatus,
        ")"
      );
    }
  };

  // Add log message
  useEffect(() => {
    // Store original console methods
    originalLogRef.current = console.log;
    originalErrorRef.current = console.error;
    originalWarnRef.current = console.warn;

    // Use useCallback to memoize the console method overrides
    const logFunction = (...args: unknown[]) => {
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

    const errorFunction = (...args: unknown[]) => {
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

    const warnFunction = (...args: unknown[]) => {
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
        playerCards: playerCards.length,
        dealerCards: dealerCards.length,
      });

      // No need to store the current game state in history since we're not using it

      setShowGameResult(true);
    }
  }, [
    gameStatus,
    result,
    playerScore,
    dealerScore,
    hasBlackjack,
    playerCards,
    dealerCards,
  ]);

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

  // Memoize the result type to prevent recalculations during render
  const resultType = useMemo(() => {
    if (gameStatus === "complete") {
      console.log("Computing result type once for:", result);

      // Additional validation for equal scores
      if (
        playerScore === dealerScore &&
        !isBust(playerCards) &&
        !isBust(dealerCards)
      ) {
        console.log(
          "EQUAL SCORES DETECTED: Forcing push result for equal scores:",
          playerScore
        );
        return "push";
      }

      return mapResultToResultType(result);
    }
    return undefined;
  }, [result, gameStatus, playerScore, dealerScore, playerCards, dealerCards]);

  // Check if the current hand should have been a win for the dealer
  useEffect(() => {
    // This special check runs when viewing a completed game
    if (gameStatus === "complete" && dealerScore === 21 && playerScore < 21) {
      console.log(
        "IMPORTANT: Dealer has 21, player has less - this should be a dealer win"
      );
      if (resultType === "win") {
        console.error(
          "CRITICAL BUG: Game showing player win when dealer has 21 and player has less!"
        );
      }
    }
  }, [gameStatus, dealerScore, playerScore, resultType]);

  // Main render function
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center game-table p-4 relative"
      onMouseMove={handleMouseMove}
    >
      {/* Table edge effect */}
      <div className="table-edge"></div>

      {/* Client-side only background animations */}
      {isClient && (
        <>
          {/* Ambient light effect that follows cursor */}
          <div
            className="ambient-light pointer-events-none"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`,
              opacity: 0.5,
            }}
          ></div>

          {/* Floating card symbols */}
          <FloatingCardSymbols />
        </>
      )}

      {/* Game Header Bar */}
      <div className="relative">
        {/* Decorative top border with gold accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600/20 via-yellow-400 to-yellow-600/20"></div>

        <div className="bg-black/80 backdrop-blur-md p-3 flex items-center mb-4 border-b border-green-900/70 shadow-lg shadow-black/50">
          {/* Home button on left */}
          <div className="flex-none ml-2">
            <Link
              href="/"
              className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium flex items-center gap-2 hover:-translate-y-0.5 transition-transform relative z-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </Link>
          </div>

          {/* Centered title with card suit icons */}
          <div className="flex-grow flex justify-center items-center">
            <div className="flex items-center">
              {/* Heart (red) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500 mx-1"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>

              {/* Spade (black) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white mx-1"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C8 2 4 5 4 9c0 2.73 2 5.5 4 6.5v2.5H8v2h8v-2h-2v-2.5c2-.5 4-3.27 4-6.5 0-4-3-7-6-7zm0 2c.73 0 2 1.27 2 2 0 .75-1 1.5-2 1.5s-2-.75-2-1.5c0-.73 1.27-2 2-2z" />
              </svg>

              {/* Club (black) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white mx-1"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C9 2 7.5 4 7.5 6.5c0 .88.33 1.72.89 2.35C7 9.76 6 11.29 6 13c0 1.66 1.34 3 3 3l-.06 2H9.88L10 20c0 1.1.9 2 2 2s2-.9 2-2l.12-2H14l-.06-2c1.66 0 3-1.34 3-3 0-1.71-1-3.24-2.39-4.15.56-.63.89-1.47.89-2.35C15.5 4 14 2 12 2z" />
              </svg>

              {/* Diamond (red) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500 mx-1"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L5 12l7 10 7-10z" />
              </svg>

              <h1
                className="text-white text-3xl font-bold mx-2 tracking-wider uppercase"
                style={{
                  fontFamily:
                    "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif",
                  textShadow:
                    "0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)",
                  letterSpacing: "0.15em",
                }}
              >
                BLACKJACK
              </h1>
            </div>
          </div>

          {/* Balance on right */}
          <div className="flex-none mr-2">
            <div className="bg-gradient-to-b from-yellow-700 to-yellow-900 p-[1px] rounded-lg shadow-lg shadow-yellow-900/40">
              <div className="bg-black/80 backdrop-blur-md px-5 py-2 rounded-lg">
                <div className="text-white/70 text-xs uppercase tracking-wider text-center">
                  BALANCE
                </div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-200 text-center">
                  ${balance}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative bottom shadow */}
        <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-green-900/40 to-transparent"></div>
      </div>

      {/* Confetti celebration for wins */}
      {(resultType === "win" || hasBlackjack) && <ConfettiCelebration />}

      {/* Game error display */}
      {error && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-md rounded-xl p-8 max-w-md w-full border border-red-700 shadow-xl shadow-red-900/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h2 className="text-2xl font-bold text-red-500">Error</h2>
            </div>
            <p className="text-white/90 mb-6">{error}</p>
            <div className="flex justify-end">
              <Button
                onClick={dismissError}
                className="premium-button flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white"
              >
                <XCircle className="h-4 w-4" />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="p-8 max-w-md w-full">
            <LoadingIndicator loadingStage={mapLoadingStage(loadingStage)} />
          </div>
        </div>
      )}

      {/* Dealer Area */}
      <div className="dealer-area min-h-[250px] w-full max-w-7xl mx-auto px-4 relative">
        <div className="absolute top-1 left-4 text-yellow-300/80 font-semibold bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
          Dealer
        </div>

        <div className="flex flex-col items-center mt-10">
          {/* Dealer Score Display */}
          {dealerCards.length > 0 && gameStatus !== "idle" && (
            <div className="mb-4 bg-black/50 backdrop-blur px-4 py-2 rounded-full text-white shadow-lg inline-flex">
              <span className="mr-2">Dealer:</span>
              <span className="font-bold">
                {gameStatus === "playerTurn" && dealerCards.length === 2
                  ? "?"
                  : dealerScore}
              </span>
            </div>
          )}

          {/* Dealer Cards Area */}
          <div className="dealer-cards flex justify-center mb-6 min-h-[180px] items-center">
            <div className="flex space-x-[-70px] lg:space-x-[-90px] items-center">
              {dealerCards.map((card, index) => (
                <div
                  key={`dealer-${index}`}
                  className="transform hover:z-10 transition-all"
                  style={{
                    zIndex: index,
                    transform: `translateY(${Math.sin(index * 0.5) * 5}px)`,
                  }}
                >
                  <PlayingCard
                    card={card}
                    isFlipped={gameStatus === "playerTurn" && index === 1}
                    animationDelay={index * 0.15}
                    isNew={
                      gameStatus === "dealing" ||
                      (gameStatus === "dealerTurn" &&
                        index === dealerCards.length - 1 &&
                        dealerCards.length > 2)
                    }
                    faceUp={!(gameStatus === "playerTurn" && index === 1)}
                    isWinningHand={
                      gameStatus === "complete" &&
                      result === "dealer" &&
                      !isBustScore(dealerScore)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Result Display */}
      {gameStatus === "complete" && resultType && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <GameResult
            result={resultType}
            playerScore={playerScore}
            dealerScore={dealerScore}
            hasBlackjack={hasBlackjack}
            currentBet={currentBet}
          />
        </div>
      )}

      {/* Card Table Center Area - Betting Area */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border-4 border-white/5 bg-gradient-to-br from-green-900/30 to-green-950/30 flex items-center justify-center shadow-inner">
          <div className="text-white/70 text-lg font-semibold">Blackjack</div>
        </div>

        {gameStatus === "idle" && (
          <div className="rounded-xl p-8 backdrop-blur-md relative z-10 bg-black/30 border border-white/10 shadow-2xl">
            <h2 className="text-3xl font-bold text-white text-center mb-8 text-shadow-lg">
              Place Your Bet
            </h2>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[5, 10, 25, 50, 100].map((value) => (
                <button
                  key={`chip-${value}`}
                  onClick={() => handleChipClick(value)}
                  className={`chip w-16 h-16 ${
                    betAmount === value ? "scale-110" : ""
                  }`}
                  style={{
                    background:
                      value === 5
                        ? "linear-gradient(135deg, #ff5555 0%, #aa0000 100%)"
                        : value === 10
                        ? "linear-gradient(135deg, #5555ff 0%, #0000aa 100%)"
                        : value === 25
                        ? "linear-gradient(135deg, #55aa55 0%, #008800 100%)"
                        : value === 50
                        ? "linear-gradient(135deg, #aa55aa 0%, #880088 100%)"
                        : "linear-gradient(135deg, #e6c656 0%, #9e7c0c 100%)",
                  }}
                >
                  ${value}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg">
                <div className="text-white/70 text-sm">Balance</div>
                <div className="text-2xl font-bold text-white">${balance}</div>
              </div>
              <div className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg">
                <div className="text-white/70 text-sm">Current Bet</div>
                <div className="text-2xl font-bold text-yellow-400">
                  ${betAmount}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleStartGame}
                disabled={betAmount <= 0 || betAmount > balance}
                className={`premium-button px-8 py-6 text-xl font-bold ${
                  betAmount <= 0 || betAmount > balance
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500"
                }`}
              >
                Deal Cards
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Player Area */}
      <div className="player-area min-h-[300px] w-full max-w-7xl mx-auto px-4 pb-6 relative">
        <div className="absolute top-1 left-4 text-yellow-300/80 font-semibold bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
          Player
        </div>

        <div className="flex flex-col items-center">
          {/* Player Cards Area */}
          <div className="player-cards flex justify-center mb-6 min-h-[180px] items-center">
            <div className="flex space-x-[-70px] lg:space-x-[-90px] items-center">
              {playerCards.map((card, index) => (
                <div
                  key={`player-${index}`}
                  className="transform hover:z-10 transition-all"
                  style={{
                    zIndex: index,
                    transform: `translateY(${
                      Math.sin(index * 0.5) * 5
                    }px) rotate(${
                      (index - Math.floor(playerCards.length / 2)) * 2
                    }deg)`,
                  }}
                >
                  <PlayingCard
                    card={card}
                    animationDelay={index * 0.15}
                    isNew={
                      gameStatus === "dealing" ||
                      (gameStatus === "playerTurn" &&
                        index === playerCards.length - 1 &&
                        playerCards.length > 2)
                    }
                    isWinningHand={
                      gameStatus === "complete" &&
                      (result === "player" || hasBlackjack) &&
                      !isBustScore(playerScore)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Player Score and Controls */}
          {playerCards.length > 0 && gameStatus !== "idle" && (
            <div className="flex flex-col items-center">
              <div className="mb-8 bg-black/50 backdrop-blur px-4 py-2 rounded-full text-white shadow-lg inline-flex">
                <span className="mr-2">Score:</span>
                <span
                  className={`font-bold ${
                    isBustScore(playerScore) ? "text-red-500" : ""
                  }`}
                >
                  {playerScore} {isBustScore(playerScore) && "(Bust)"}
                  {hasBlackjack && " (Blackjack!)"}
                </span>
              </div>

              {/* Game Controls */}
              {gameStatus === "playerTurn" && (
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    onClick={hit}
                    className="premium-button bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold px-8 py-5 text-lg"
                    disabled={isBustScore(playerScore) || hasBlackjack}
                  >
                    Hit
                  </Button>

                  <Button
                    onClick={stand}
                    className="premium-button bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-8 py-5 text-lg"
                    disabled={isBustScore(playerScore)}
                  >
                    Stand
                  </Button>

                  {playerCards.length === 2 && !hasBlackjack && (
                    <Button
                      onClick={doubleDown}
                      className="premium-button bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold px-8 py-5 text-lg"
                      disabled={balance < currentBet * 2}
                    >
                      Double Down
                    </Button>
                  )}
                </div>
              )}

              {/* New Game Button */}
              {gameStatus === "complete" && (
                <div className="mt-6">
                  <Button
                    onClick={resetGame}
                    className="premium-button bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold px-8 py-5 text-lg flex items-center gap-2"
                  >
                    <RefreshCw className="h-5 w-5" />
                    New Game
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Game Info Footer */}
      <div className="bg-black/40 backdrop-blur-sm p-2 flex justify-center items-center mt-4">
        <div className="text-white/50 text-xs">© 2025 Blackjack Game</div>
      </div>
    </main>
  );
}
