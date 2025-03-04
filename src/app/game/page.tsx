"use client";

import React, { useState, useEffect } from "react";
import { useBlackjack } from "@/lib/context/BlackjackContext";
import { Button } from "@/components/ui/button";
import PlayingCard from "@/components/cards/PlayingCard";
import LoadingIndicator, {
  LoadingStage as LoadingIndicatorStage,
} from "@/components/LoadingIndicator";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import GameResult, { ResultType } from "@/components/GameResult";
import PlayerNameInput from "@/components/PlayerNameInput";
import Leaderboard from "@/components/Leaderboard";

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

export default function GamePage() {
  const {
    playerName,
    setPlayerName,
    balance,
    currentBet,
    setBet,
    gameStatus,
    playerCards,
    dealerCards,
    playerScore,
    dealerScore,
    hasBlackjack,
    result,
    error,
    isLoading,
    loadingStage,
    hit,
    stand,
    doubleDown,
    startNewGame,
    resetGame,
    dismissError,
  } = useBlackjack();

  const [isClient, setIsClient] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [betAmount, setBetAmount] = useState(10);

  // Initialize client-side features
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isClient) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  const toggleLeaderboard = () => {
    setShowLeaderboard(!showLeaderboard);
  };

  const handleChipClick = (value: number) => {
    setBetAmount(value);
    setBet(value);
  };

  const handleStartGame = () => {
    startNewGame(betAmount);
  };

  const resultType = result ? mapResultToResultType(result) : null;

  // If no player name is set, show the player name input
  if (!playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center p-4">
        <PlayerNameInput onSubmit={setPlayerName} />
      </div>
    );
  }

  return (
    <div
      className="game-table min-h-screen flex flex-col relative"
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => (window.location.href = "/")}
            >
              🏠 Home
            </Button>
            <span className="text-white/80">
              {playerName ? `Player: ${playerName}` : "Welcome!"}
            </span>
            <span className="text-yellow-400 font-bold">
              Balance: {balance} 💰
            </span>
          </div>
          <Button
            onClick={toggleLeaderboard}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            🏆 Leaderboard
          </Button>
        </div>
      </header>

      {/* Table edge effect */}
      <div className="table-edge"></div>

      {/* Client-side only background animations */}
      {isClient && (
        <>
          {/* Ambient light effect that follows cursor */}
          <div
            className="ambient-light"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`,
            }}
          />

          {/* Floating card symbols */}
          <FloatingCardSymbols />
        </>
      )}

      {/* Game content */}
      <main className="flex-1 flex flex-col relative z-10">
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
                  <div className="text-2xl font-bold text-white">
                    ${balance}
                  </div>
                </div>
                <div className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg">
                  <div className="text-white/70 text-sm">Current Bet</div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 text-2xl font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => {
                        const value = Math.max(
                          0,
                          Math.min(balance, parseInt(e.target.value) || 0)
                        );
                        setBetAmount(value);
                        setBet(value);
                      }}
                      className="w-24 bg-black/30 text-2xl font-bold text-yellow-400 border border-white/10 rounded px-2 py-1"
                      min="0"
                      max={balance}
                    />
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
      </main>

      {/* Game Info Footer */}
      <div className="bg-black/40 backdrop-blur-sm p-2 flex justify-center items-center mt-4">
        <div className="text-white/50 text-xs">© 2025 Blackjack Game</div>
      </div>

      {/* Error Display */}
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="p-8 max-w-md w-full">
            <LoadingIndicator loadingStage={mapLoadingStage(loadingStage)} />
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={toggleLeaderboard}
        currentPlayerName={playerName}
      />
    </div>
  );
}
