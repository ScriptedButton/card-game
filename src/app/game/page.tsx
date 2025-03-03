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
  } = useBlackjack();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [dealerTimer, setDealerTimer] = useState<number>(0);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  // Handle bet change
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setBetAmount(isNaN(value) ? 10 : value);
  };

  // Handle starting a new game
  const handleStartGame = () => {
    startNewGame(betAmount);
  };

  // Add log message
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
      originalConsoleLog(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");
      setLogs((prev) => [...prev, `LOG: ${message}`]);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");
      setLogs((prev) => [...prev, `ERROR: ${message}`]);
    };

    console.warn = (...args) => {
      originalConsoleWarn(...args);
      const message = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" ");
      setLogs((prev) => [...prev, `WARN: ${message}`]);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
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

  return (
    <main className="flex min-h-screen flex-col items-center game-table p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button
              variant="outline"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
            >
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white text-center">
            Blackjack 21
          </h1>
          <div className="bg-green-950/50 px-4 py-2 rounded-lg border border-yellow-500/30">
            <p className="text-yellow-400 text-xl font-bold">${balance}</p>
          </div>
        </div>

        {/* Debug Button */}
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500 text-purple-300 hover:bg-purple-500/10"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Bug className="h-4 w-4 mr-2" />
            {showDebug ? "Hide Debug" : "Show Debug"}
            {showDebug ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>

        {/* Debug Info */}
        {showDebug && (
          <Card className="bg-gray-900/80 border-gray-700 p-4 mb-4 text-xs text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold mb-2 text-purple-300">Game State</h3>
                <p>
                  Game Status:{" "}
                  <span className="text-yellow-300">{gameStatus}</span>
                </p>
                <p>
                  Loading Stage:{" "}
                  <span className="text-yellow-300">{loadingStage}</span>
                </p>
                <p>
                  Is Loading:{" "}
                  <span className="text-yellow-300">
                    {isLoading ? "Yes" : "No"}
                  </span>
                </p>
                <p>
                  Result:{" "}
                  <span className="text-yellow-300">{result || "None"}</span>
                </p>
                <p>
                  Current Bet:{" "}
                  <span className="text-yellow-300">${currentBet}</span>
                </p>
                <p>
                  Player Score:{" "}
                  <span className="text-yellow-300">{playerScore}</span>
                </p>
                <p>
                  Dealer Score:{" "}
                  <span className="text-yellow-300">{dealerScore}</span>
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-purple-300">Cards</h3>
                <p>
                  Player Cards:{" "}
                  <span className="text-yellow-300">{playerCards.length}</span>
                </p>
                <pre className="text-gray-400 text-xs overflow-auto max-h-16">
                  {JSON.stringify(playerCards, null, 2)}
                </pre>
                <p>
                  Dealer Cards:{" "}
                  <span className="text-yellow-300">{dealerCards.length}</span>
                </p>
                <pre className="text-gray-400 text-xs overflow-auto max-h-16">
                  {JSON.stringify(dealerCards, null, 2)}
                </pre>
              </div>
            </div>

            <h3 className="font-bold mt-4 mb-2 text-purple-300">
              Console Logs
            </h3>
            <div
              ref={logsRef}
              className="bg-black/50 p-2 rounded h-32 overflow-auto text-xs font-mono"
            >
              {logs.map((log, index) => {
                const isError = log.startsWith("ERROR");
                const isWarning = log.startsWith("WARN");
                return (
                  <div
                    key={index}
                    className={`${
                      isError
                        ? "text-red-400"
                        : isWarning
                        ? "text-yellow-400"
                        : "text-green-300"
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => setLogs([])}
              >
                Clear Logs
              </Button>
              <Button
                size="sm"
                className="bg-purple-700 hover:bg-purple-800 text-white"
                onClick={handleReload}
              >
                Reload Page
              </Button>
            </div>
          </Card>
        )}

        {/* Game Area */}
        <div className="bg-green-800/50 rounded-xl p-8 border-4 border-green-950/50 mb-8 relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
              <div className="text-center">
                <LoadingIndicator size="large" message={getLoadingMessage()} />

                {/* Show cancel button if loading takes too long */}
                {dealerTimer > 5 && loadingStage === "dealerPlay" && (
                  <div className="mt-6">
                    <Button
                      variant="destructive"
                      className="bg-red-700 hover:bg-red-800"
                      onClick={handleReload}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Cancel & Reload
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dealer Area */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Dealer</h2>
              {gameStatus === "complete" && (
                <div className="bg-green-900/70 px-3 py-1 rounded text-white">
                  Score: {dealerScore}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {dealerCards.map((card, index) => (
                <PlayingCard
                  key={`dealer-${index}`}
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
                />
              ))}
              {dealerCards.length === 0 && (
                <div className="h-[320px] w-[220px] flex items-center justify-center">
                  <p className="text-white/50">Dealer cards will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Player Area */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Your Hand</h2>
              <div className="bg-green-900/70 px-3 py-1 rounded text-white">
                Score: {playerScore}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              {playerCards.map((card, index) => (
                <PlayingCard key={`player-${index}`} card={card} />
              ))}
              {playerCards.length === 0 && (
                <div className="h-[320px] w-[220px] flex items-center justify-center">
                  <p className="text-white/50">Your cards will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <Card className="bg-green-950/80 border-green-900 p-6">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-100 p-4 rounded mb-6 flex items-start gap-3">
              <AlertCircle className="text-red-400 h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="mb-2">{error}</p>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-300 hover:bg-red-950"
                    onClick={dismissError}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-700 hover:bg-red-800 text-white"
                    onClick={handleReload}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Reload Page
                  </Button>
                </div>
              </div>
            </div>
          )}

          {gameStatus === "idle" && (
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-xl font-bold text-white mb-2">
                Place Your Bet
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(Math.max(5, betAmount - 5))}
                  className="text-white border-white/20"
                >
                  -
                </Button>
                <input
                  type="number"
                  value={betAmount}
                  onChange={handleBetChange}
                  className="w-24 text-center bg-green-900 text-white border border-yellow-500/30 rounded p-2"
                />
                <Button
                  variant="outline"
                  onClick={() => setBetAmount(Math.min(balance, betAmount + 5))}
                  className="text-white border-white/20"
                >
                  +
                </Button>
              </div>
              <Button
                onClick={handleStartGame}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg"
                disabled={isLoading || betAmount <= 0 || betAmount > balance}
              >
                {isLoading ? "Dealing..." : "Deal Cards"}
              </Button>
            </div>
          )}

          {gameStatus === "playerTurn" && (
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={hit}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4"
                disabled={isLoading}
              >
                Hit
              </Button>
              <Button
                onClick={stand}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-4"
                disabled={isLoading}
              >
                Stand
              </Button>
              {playerCards.length === 2 && balance >= currentBet && (
                <Button
                  onClick={doubleDown}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-8 py-4"
                  disabled={isLoading}
                >
                  Double Down
                </Button>
              )}
              <div className="w-full text-center mt-2">
                <p className="text-white/70">Current bet: ${currentBet}</p>
              </div>
            </div>
          )}

          {gameStatus === "dealerTurn" && !isLoading && (
            <div className="text-center">
              <p className="text-white text-xl mb-4">Dealer is playing...</p>
              <div className="animate-pulse bg-green-800/50 rounded-full h-4 w-32 mx-auto"></div>
              {dealerTimer > 5 && (
                <Button
                  className="mt-6 bg-red-700 hover:bg-red-800"
                  onClick={handleReload}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Cancel & Reload
                </Button>
              )}
            </div>
          )}

          {gameStatus === "complete" && (
            <div className="flex flex-col items-center gap-4">
              <div
                className={`text-2xl font-bold mb-2 ${
                  result === "player"
                    ? "text-green-400"
                    : result === "dealer"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {result === "player"
                  ? "You Win!"
                  : result === "dealer"
                  ? "Dealer Wins"
                  : "Push (Tie)"}
              </div>
              <Button
                onClick={() => handleStartGame()}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4"
                disabled={isLoading}
              >
                Play Again
              </Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
