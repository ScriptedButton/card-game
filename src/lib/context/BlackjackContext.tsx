"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Card, getShuffledDeck, getAllCards } from "@/lib/services/cardApi";
import {
  calculateHandValue,
  determineWinner,
  isBlackjack,
  isBust,
  shouldDealerHit,
  calculatePayout,
} from "@/lib/utils/blackjackUtils";

type GameStatus = "idle" | "dealing" | "playerTurn" | "dealerTurn" | "complete";
type GameResult = "player" | "dealer" | "push" | null;
type LoadingStage =
  | "idle"
  | "shuffling"
  | "dealing"
  | "playerHit"
  | "dealerPlay"
  | "doubleDown";

interface BlackjackContextType {
  // Game state
  gameStatus: GameStatus;
  playerCards: Card[];
  dealerCards: Card[];
  playerScore: number;
  dealerScore: number;
  result: GameResult;
  balance: number;
  currentBet: number;
  isLoading: boolean;
  loadingStage: LoadingStage;
  error: string | null;
  hasBlackjack: boolean;

  // Game actions
  startNewGame: (bet?: number) => Promise<void>;
  hit: () => Promise<void>;
  stand: () => Promise<void>;
  setBet: (amount: number) => void;
  doubleDown: () => Promise<void>;
  dismissError: () => void;
  resetGame: () => void;
}

const BlackjackContext = createContext<BlackjackContextType | undefined>(
  undefined
);

export const useBlackjack = () => {
  const context = useContext(BlackjackContext);
  if (context === undefined) {
    throw new Error("useBlackjack must be used within a BlackjackProvider");
  }
  return context;
};

interface BlackjackProviderProps {
  children: ReactNode;
  initialBalance?: number;
}

export const BlackjackProvider: React.FC<BlackjackProviderProps> = ({
  children,
  initialBalance = 1000,
}) => {
  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [result, setResult] = useState<GameResult>(null);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [currentBet, setCurrentBet] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasBlackjack, setHasBlackjack] = useState<boolean>(false);

  // API state
  const [resultId, setResultId] = useState<string | null>(null);
  const [drawnCardIndex, setDrawnCardIndex] = useState<number>(0);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);

  // Derived state
  const playerScore = calculateHandValue(playerCards || []);
  const dealerScore = calculateHandValue(dealerCards || []);

  // Get a card from the deck - completely rewritten for reliability
  const getNextCard = useCallback(
    async (retries = 2): Promise<Card> => {
      // First, ensure we have a valid deck ID
      if (!resultId) {
        console.log("No deck available, creating one...");
        const response = await getShuffledDeck(1);

        if (!response || !response.id) {
          throw new Error("Failed to create a new deck");
        }

        setResultId(response.id);
        setAvailableCards(response.deck.cards);
        console.log(`Created new deck with ID: ${response.id}`);
      }

      // If we have available cards in memory, use those first
      if (availableCards.length > drawnCardIndex) {
        const card = availableCards[drawnCardIndex];
        setDrawnCardIndex(drawnCardIndex + 1);
        console.log(`Using cached card: ${card.rank} of ${card.suit}`);
        return card;
      }

      // Otherwise, fetch all cards from the API
      console.log("Fetching all cards from API...");
      const cards = await getAllCards(resultId);

      if (!cards || !Array.isArray(cards) || cards.length === 0) {
        throw new Error("Failed to get cards from the deck");
      }

      setAvailableCards(cards);

      // Reset the drawn card index and return the first card
      setDrawnCardIndex(1); // Set to 1 because we're returning the card at index 0
      console.log(`Fetched ${cards.length} cards, using first card`);
      return cards[0];
    },
    [resultId, availableCards, drawnCardIndex]
  );

  // Start a new game with a new deck
  const startNewGame = useCallback(
    async (bet: number = 10) => {
      if (bet > balance) {
        setError("Insufficient funds for this bet");
        return;
      }

      console.log("Starting new game with bet:", bet);
      setIsLoading(true);
      setLoadingStage("shuffling");
      setError(null);
      setResult(null);
      setGameStatus("dealing");
      setCurrentBet(bet);

      // Deduct the bet amount from the player's balance when the game starts
      // This bet will be:
      // - Lost if the dealer wins
      // - Returned if there's a push (tie)
      // - Returned plus winnings if the player wins
      setBalance((prev) => Math.max(0, prev - bet));
      console.log(`Bet of $${bet} deducted from balance`);

      try {
        // Always get a fresh deck for each new game
        const response = await getShuffledDeck(1);

        if (!response || !response.id) {
          throw new Error("Invalid API response: missing ID");
        }

        if (
          !response.deck ||
          !response.deck.cards ||
          !Array.isArray(response.deck.cards)
        ) {
          throw new Error("Invalid API response: missing cards data");
        }

        const cardArray = response.deck.cards;
        if (cardArray.length < 4) {
          throw new Error("Not enough cards in the deck");
        }

        console.log("Received new deck with", cardArray.length, "cards");
        console.log("Setting deck ID:", response.id);

        // Set the deck info BEFORE trying to get cards
        setResultId(response.id);
        setAvailableCards(cardArray);
        setDrawnCardIndex(0);

        // Now that we have the new cards ready, clear the previous hands
        setPlayerCards([]);
        setDealerCards([]);

        // Wait a small amount to ensure the UI has updated
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Deal initial cards from the local card array instead of calling getNextCard
        // This avoids any potential recursive state updates
        const playerCard1 = cardArray[0];
        const dealerCard1 = cardArray[1];
        const playerCard2 = cardArray[2];
        const dealerCard2 = cardArray[3];

        // Update our drawn card index to reflect that we've used 4 cards
        setDrawnCardIndex(4);

        // Add delay between dealing cards for visual effect
        setPlayerCards([playerCard1]);
        await new Promise((resolve) => setTimeout(resolve, 300));

        setDealerCards([dealerCard1]);
        await new Promise((resolve) => setTimeout(resolve, 300));

        setPlayerCards([playerCard1, playerCard2]);
        await new Promise((resolve) => setTimeout(resolve, 300));

        setDealerCards([dealerCard1, dealerCard2]);

        // Check for blackjack
        const playerHand = [playerCard1, playerCard2];
        const dealerHand = [dealerCard1, dealerCard2];

        const playerHasBlackjack = isBlackjack(playerHand);
        setHasBlackjack(playerHasBlackjack);

        // If player has blackjack, end game immediately
        if (playerHasBlackjack) {
          console.log("Player has blackjack!");

          // If dealer also has blackjack, it's a push
          if (isBlackjack(dealerHand)) {
            console.log("Dealer also has blackjack - Push");
            setResult("push");
            setGameStatus("complete");

            // Return the original bet to the player (bet was already deducted at game start)
            console.log(`Push with blackjack - returning bet of ${bet}`);
            setBalance((prev) => {
              const newBalance = prev + bet;
              console.log(
                `Balance updated for push with blackjack: ${prev} + ${bet} = ${newBalance}`
              );
              return newBalance;
            });
          } else {
            // Player wins with blackjack
            console.log("Player wins with blackjack!");
            setResult("player");
            setGameStatus("complete");

            // Update balance - blackjack pays 3:2
            const payoutAmount = calculatePayout(bet, true);
            setBalance((prev) => prev + payoutAmount);
          }
        } else {
          // Game continues
          setGameStatus("playerTurn");
        }
      } catch (error) {
        console.error("Error starting new game:", error);
        setError(
          `Failed to start game: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setGameStatus("idle"); // Reset game status if error occurs
      } finally {
        setIsLoading(false);
        setLoadingStage("idle");
      }
    },
    [
      balance,
      setBalance,
      setCurrentBet,
      setDealerCards,
      setPlayerCards,
      setGameStatus,
      setHasBlackjack,
      setIsLoading,
      setLoadingStage,
      setResult,
      getNextCard,
    ]
  );

  // Player hits (takes another card)
  const hit = async () => {
    if (gameStatus !== "playerTurn") {
      console.warn("Hit called when not in player turn");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingStage("playerHit");

      // Get a new card
      const newCard = await getNextCard();

      // Add the new card to the player's hand
      const updatedCards = [...playerCards, newCard];
      setPlayerCards(updatedCards);

      // Check for bust
      const newScore = calculateHandValue(updatedCards);

      // Handle bust
      if (newScore > 21) {
        console.log("Player busts with score", newScore);
        setGameStatus("complete");
        setResult("dealer");
      }

      setIsLoading(false);
      setLoadingStage("idle");
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error during hit:", errorMessage);
      setError(`Failed to draw card: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingStage("idle");
    }
  };

  // Player stands (ends turn)
  const stand = async () => {
    if (gameStatus !== "playerTurn") {
      console.warn("Stand called when not in player turn");
      return;
    }

    console.log("Player stands with score:", playerScore);

    // First make sure we're not loading
    setIsLoading(false);
    setLoadingStage("idle");

    // Mark that the dealer will play next
    console.log("Setting game state to dealer turn");
    setGameStatus("dealerTurn");

    // Start dealer play immediately, but give React a chance to update the UI first
    console.log("Scheduling dealer play with requestAnimationFrame");
    requestAnimationFrame(() => {
      console.log("Starting dealer play from stand action");
      dealerPlay()
        .then(() => console.log("Dealer play completed from stand"))
        .catch((err) => {
          console.error("Error in dealerPlay from stand:", err);
          setError(
            `Error during dealer's turn: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
          setGameStatus("complete");
        });
    });
  };

  // Double down (double bet, take one more card, then stand)
  const doubleDown = async () => {
    if (gameStatus !== "playerTurn" || playerCards.length !== 2) {
      console.warn("Double down called when not allowed");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingStage("doubleDown");

      // Double the bet
      const newBet = currentBet * 2;
      setCurrentBet(newBet);

      // Deduct the additional bet from balance
      setBalance((prev) => prev - currentBet);

      // Draw exactly one card
      const newCard = await getNextCard();
      const updatedCards = [...playerCards, newCard];
      setPlayerCards(updatedCards);

      // Automatically stand after drawing one card
      setGameStatus("dealerTurn");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error during double down:", errorMessage);
      setError(`Failed during double down: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingStage("idle");
    }
  };

  // Handle dealer play after player stands - wrap in useCallback to avoid dependency issues
  const dealerPlay = useCallback(async () => {
    if (gameStatus !== "dealerTurn") {
      console.warn(
        "dealerPlay called when not in dealer turn state - continuing anyway"
      );
    }

    try {
      setLoadingStage("dealerPlay");

      // Dealer must draw until they have at least 17
      let currentDealerCards = [...dealerCards];
      let currentDealerScore = calculateHandValue(currentDealerCards);

      // Keep drawing cards until dealer reaches at least 17
      while (currentDealerScore < 17) {
        setIsLoading(true);

        // Add a small delay for visual effect
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Draw a new card
        const newCard = await getNextCard();
        currentDealerCards = [...currentDealerCards, newCard];
        setDealerCards(currentDealerCards);

        // Recalculate score
        currentDealerScore = calculateHandValue(currentDealerCards);
      }

      // Determine the winner - determineWinner expects card arrays, not scores
      const outcome = determineWinner(playerCards, currentDealerCards);

      setResult(outcome);
      setGameStatus("complete");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error during dealer's turn:", errorMessage);
      setError(`Failed during dealer's turn: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setLoadingStage("idle");
    }
  }, [
    dealerCards,
    playerCards,
    gameStatus,
    getNextCard,
    setDealerCards,
    setError,
    setGameStatus,
    setIsLoading,
    setLoadingStage,
    setResult,
  ]);

  // Start the dealer's turn after a delay when player stands
  useEffect(() => {
    if (gameStatus === "dealerTurn" && !isLoading) {
      const timer = setTimeout(() => {
        dealerPlay();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [gameStatus, isLoading, dealerPlay]); // dealerPlay is now memoized with useCallback

  // Set the current bet amount
  const setBet = (amount: number) => {
    if (gameStatus !== "idle") return;

    if (amount > balance) {
      setError("Insufficient funds for this bet");
      return;
    }

    console.log("Setting bet to:", amount);
    setCurrentBet(amount);
    setError(null);
  };

  // Dismiss error message
  const dismissError = () => {
    setError(null);

    // Reset game to idle state to allow new bets
    if (gameStatus === "complete") {
      console.log("Resetting game to idle state from dismissError");
      setGameStatus("idle");
      setResult(null);
    }
  };

  // Add a dedicated function to reset the game
  const resetGame = () => {
    console.log("Explicitly resetting game to idle state");
    setGameStatus("idle");
    setResult(null);
    setPlayerCards([]);
    setDealerCards([]);
    setError(null);
  };

  // Initialize the game when the component mounts
  useEffect(() => {
    if (!isLoading && gameStatus === "idle") {
      console.log("Initial game setup");
      startNewGame(10); // Start with a default bet of 10
    }
  }, [gameStatus, isLoading, startNewGame]); // Added missing dependencies

  const value = {
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
  };

  return (
    <BlackjackContext.Provider value={value}>
      {children}
    </BlackjackContext.Provider>
  );
};

export default BlackjackContext;
