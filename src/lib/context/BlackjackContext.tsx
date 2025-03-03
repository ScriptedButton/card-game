"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Card,
  DeckResponse,
  getShuffledDeck,
  getAllCards,
  getCardAt,
} from "@/lib/services/cardApi";
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
  const [retryCount, setRetryCount] = useState<number>(0);

  // API state
  const [resultId, setResultId] = useState<string | null>(null);
  const [drawnCardIndex, setDrawnCardIndex] = useState<number>(0);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);

  // Derived state
  const playerScore = calculateHandValue(playerCards || []);
  const dealerScore = calculateHandValue(dealerCards || []);

  // Get a card from the deck
  const getNextCard = async (retries = 2): Promise<Card> => {
    if (!resultId) {
      throw new Error("No deck available");
    }

    // If we've used all available cards, fetch all cards again
    if (drawnCardIndex >= availableCards.length) {
      try {
        console.log("Fetching all cards for resultId:", resultId);
        const allCards = await getAllCards(resultId);

        if (!allCards || !Array.isArray(allCards) || allCards.length === 0) {
          throw new Error("No cards available");
        }

        setAvailableCards(allCards);
        setDrawnCardIndex(0);
        return allCards[0];
      } catch (err) {
        console.error("Error getting all cards:", err);

        // If we still have retries left, try again after a short delay
        if (retries > 0) {
          console.log(`Retrying card fetch. Attempts remaining: ${retries}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return getNextCard(retries - 1);
        }

        throw new Error(
          `Failed to get cards: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }

    const card = availableCards[drawnCardIndex];

    if (!card || !card.rank || !card.suit) {
      console.error("Invalid card at index", drawnCardIndex, ":", card);

      // If we still have retries left, try the next card
      if (retries > 0 && drawnCardIndex + 1 < availableCards.length) {
        console.log(
          `Skipping invalid card and trying next one. Attempts remaining: ${retries}`
        );
        setDrawnCardIndex((prev) => prev + 1);
        return getNextCard(retries - 1);
      }

      throw new Error("Received invalid card data");
    }

    setDrawnCardIndex((prev) => prev + 1);
    return card;
  };

  // Start a new game with a new deck
  const startNewGame = async (bet: number = 10) => {
    if (bet > balance) {
      setError("Insufficient funds for this bet");
      return;
    }

    setIsLoading(true);
    setLoadingStage("shuffling");
    setError(null);
    setPlayerCards([]);
    setDealerCards([]);
    setResult(null);
    setGameStatus("dealing");
    setCurrentBet(bet);
    setRetryCount(0);

    try {
      console.log("Starting new game with bet:", bet);

      // Get a new shuffled deck
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

      console.log(
        `Received ${cardArray.length} cards with deck ID: ${response.id}`
      );

      setResultId(response.id);
      setAvailableCards(cardArray);
      setDrawnCardIndex(0);

      // Deal initial cards
      setLoadingStage("dealing");
      const dealer: Card[] = [];
      const player: Card[] = [];

      // Make sure each card has rank and suit
      for (let i = 0; i < 2; i++) {
        const playerCard = cardArray[i];
        const dealerCard = cardArray[i + 2];

        if (!playerCard || !playerCard.rank || !playerCard.suit) {
          throw new Error(`Invalid player card at index ${i}`);
        }

        if (!dealerCard || !dealerCard.rank || !dealerCard.suit) {
          throw new Error(`Invalid dealer card at index ${i + 2}`);
        }

        player.push(playerCard);
        dealer.push(dealerCard);
      }

      setDrawnCardIndex(4);
      setPlayerCards(player);
      setDealerCards(dealer);

      console.log(
        "Initial deal complete. Player cards:",
        player,
        "Dealer cards:",
        dealer
      );

      // Check for blackjack
      if (isBlackjack(player) || isBlackjack(dealer)) {
        console.log("Blackjack detected!");
        await handleGameEnd(player);
      } else {
        setGameStatus("playerTurn");
      }
    } catch (err: any) {
      console.error("Error starting new game:", err);

      // If we have retries left, try again
      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1);
        console.log(`Retrying game start. Attempt ${retryCount + 1}/3`);

        // Wait a moment before retrying
        setTimeout(() => {
          startNewGame(bet);
        }, 1500);
        return;
      }

      setError(
        `Failed to start new game: ${
          err.message || "Unknown error"
        }. Please try again later.`
      );
      setGameStatus("idle");
    } finally {
      setIsLoading(false);
      setLoadingStage("idle");
    }
  };

  // Player hits (takes another card)
  const hit = async () => {
    if (gameStatus !== "playerTurn") return;

    setIsLoading(true);
    setLoadingStage("playerHit");

    try {
      console.log("Player hits");
      const card = await getNextCard();

      if (!card || !card.rank || !card.suit) {
        throw new Error("Invalid card received from API");
      }

      const updatedPlayerCards = [...playerCards, card];
      setPlayerCards(updatedPlayerCards);

      console.log("Player drew:", card, "New hand:", updatedPlayerCards);

      // Check if player busts
      if (isBust(updatedPlayerCards)) {
        console.log("Player busts!");
        await handleGameEnd(updatedPlayerCards);
      }
    } catch (err: any) {
      console.error("Error hitting:", err);
      setError(`Failed to draw card: ${err.message || "Unknown error"}`);
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
    if (gameStatus !== "playerTurn" || playerCards.length > 2) {
      console.warn(
        "Double down called in invalid state or with more than 2 cards"
      );
      return;
    }

    // Check if the hand value is eligible for doubling (9, 10, or 11)
    const handValue = calculateHandValue(playerCards);
    if (![9, 10, 11].includes(handValue)) {
      setError(
        "According to standard rules, you can only double down on 9, 10, or 11"
      );
      return;
    }

    if (currentBet * 2 > balance) {
      setError("Insufficient funds to double down");
      return;
    }

    setIsLoading(true);
    setLoadingStage("doubleDown");
    setCurrentBet(currentBet * 2);

    try {
      console.log("Player doubles down");
      const card = await getNextCard();

      if (!card || !card.rank || !card.suit) {
        throw new Error("Invalid card received from API");
      }

      const updatedPlayerCards = [...playerCards, card];
      setPlayerCards(updatedPlayerCards);

      console.log("Player drew:", card, "New hand:", updatedPlayerCards);

      // Player automatically stands after doubling down
      console.log("Double down complete, moving to dealer turn");
      setGameStatus("dealerTurn");
      setIsLoading(false);
      setLoadingStage("idle");

      // Use requestAnimationFrame to ensure the UI updates before dealer plays
      console.log("Scheduling dealer play with requestAnimationFrame");
      requestAnimationFrame(() => {
        console.log("Starting dealer play from double down action");
        dealerPlay()
          .then(() => console.log("Dealer play completed from double down"))
          .catch((err) => {
            console.error("Error in dealerPlay from doubleDown:", err);
            setError(
              `Error during dealer's turn: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            );
            setGameStatus("complete");
          });
      });
    } catch (err: any) {
      console.error("Error doubling down:", err);
      setError(`Failed to double down: ${err.message || "Unknown error"}`);
      setIsLoading(false);
      setLoadingStage("idle");
    }
  };

  // Dealer's turn to play
  const dealerPlay = async () => {
    // Instead of exiting, just log a warning if not in the right state
    // This allows the function to continue even if state updates haven't fully applied
    if (gameStatus !== "dealerTurn") {
      console.warn(
        "dealerPlay called when not in dealer turn state - continuing anyway"
      );
    }

    console.log("DEALER PLAY STARTED");
    setIsLoading(true);
    setLoadingStage("dealerPlay");

    // Explicitly set the game status to dealerTurn again to ensure it's in the right state
    setGameStatus("dealerTurn");

    try {
      // First, let's get all dealer's cards upfront for a single hand
      // Instead of getting cards one by one with separate API calls
      let currentDealerCards = [...dealerCards];
      let currentScore = calculateHandValue(currentDealerCards);
      console.log("Initial dealer score:", currentScore);

      // If we already have 17+, no need to draw more cards
      if (currentScore >= 17) {
        // Check for soft 17 to determine if dealer should still hit
        if (shouldDealerHit(currentDealerCards)) {
          console.log(
            "Dealer has soft 17, will hit according to standard rules"
          );
        } else {
          console.log(
            "Dealer already has 17 or more, standing with:",
            currentScore
          );
          console.log("Dealer stands with hard 17 or higher");
        }
      }

      // The dealer needs to draw cards to reach at least 17 or stand on hard 17+
      console.log("Checking if dealer needs to draw more cards");

      // Safety limit - dealer can draw at most 5 more cards (very unlikely to need more)
      const maxCardsToAdd = 5;
      let cardsAdded = 0;

      // Keep drawing cards until dealer should stand based on rules
      while (
        shouldDealerHit(currentDealerCards) &&
        cardsAdded < maxCardsToAdd
      ) {
        try {
          console.log(`Dealer drawing card #${cardsAdded + 1}...`);
          const nextCard = await getNextCard();

          if (!nextCard || !nextCard.rank || !nextCard.suit) {
            console.error("Invalid card received:", nextCard);
            throw new Error("Failed to get valid card for dealer");
          }

          // Add the card to dealer's hand
          currentDealerCards = [...currentDealerCards, nextCard];
          currentScore = calculateHandValue(currentDealerCards);
          cardsAdded++;

          // Update UI immediately after each card
          setDealerCards(currentDealerCards);
          console.log(
            `Dealer drew: ${nextCard.rank} of ${nextCard.suit}, new score: ${currentScore}`
          );

          // Short pause between cards for animation
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (cardError) {
          console.error("Error getting card for dealer:", cardError);
          // Break the loop on error instead of failing completely
          break;
        }
      }

      console.log(
        `Dealer finished drawing with ${cardsAdded} new cards, final score: ${currentScore}`
      );

      // Set the final dealer cards state
      setDealerCards(currentDealerCards);

      // Always ensure we end the game
      console.log("Dealer play complete, ending game");
    } catch (error) {
      console.error("Error in dealer play:", error);
      setError(
        `Dealer play error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Regardless of what happened, ensure we end the game
      console.log("Dealer play finally block - ending game");
      setIsLoading(false);
      setLoadingStage("idle");

      // Use setTimeout to ensure state updates before proceeding
      setTimeout(() => {
        try {
          // Instead of determining winner directly, use handleGameEnd for consistency
          console.log("Dealer play complete, ending game via handleGameEnd");
          handleGameEnd();
        } catch (finalError) {
          console.error("Error in dealer play final handling:", finalError);
          setError("Error finalizing game");
          setGameStatus("complete");
        }
      }, 300);
    }
  };

  // Handle the end of the game and determine the winner
  const handleGameEnd = async (updatedPlayerCards?: Card[]) => {
    try {
      console.log("Handling game end...");

      // Use the updated player cards if provided, otherwise use state
      const currentPlayerCards = updatedPlayerCards || playerCards;

      // Add extra debugging
      console.log("Final cards at game end:", {
        playerCards: currentPlayerCards.map((c) => `${c.rank} of ${c.suit}`),
        dealerCards: dealerCards.map((c) => `${c.rank} of ${c.suit}`),
        playerScore: calculateHandValue(currentPlayerCards),
        dealerScore: calculateHandValue(dealerCards),
      });

      // Determine the winner
      const winResult = determineWinner(currentPlayerCards, dealerCards);
      console.log("Game result determined:", winResult);

      // Update state
      setResult(winResult);
      setGameStatus("complete");

      console.log("Game ended with result:", winResult);

      // Update balance based on result
      if (winResult === "player") {
        // Use the new calculatePayout function for correct payout calculation
        const payoutAmount = calculatePayout(
          currentBet,
          isBlackjack(currentPlayerCards)
        );
        const payoutDescription = isBlackjack(currentPlayerCards)
          ? "with blackjack (3:2)"
          : "regular win (1:1)";
        console.log(`Player won ${payoutDescription}! Payout: ${payoutAmount}`);
        setBalance((prev) => prev + payoutAmount);
      } else if (winResult === "push") {
        console.log("Push (tie) - bet returned");
        setBalance((prev) => prev + currentBet);
      } else {
        console.log("Dealer won - player loses bet");
      }
      // No need to update balance for dealer win as bet was already deducted
    } catch (err) {
      console.error("Error in handleGameEnd:", err);
      // Make sure we still set the game as complete even if there's an error
      setGameStatus("complete");
    }
  };

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
  };

  // Initialize game on first load
  useEffect(() => {
    if (typeof window !== "undefined" && gameStatus === "idle" && !isLoading) {
      console.log("Auto-starting initial game");
      startNewGame(10).catch((err) => {
        console.error("Failed to auto-start game:", err);
      });
    }
  }, []);

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
    startNewGame,
    hit,
    stand,
    setBet,
    doubleDown,
    dismissError,
    hasBlackjack: isBlackjack(playerCards) || isBlackjack(dealerCards),
  };

  return (
    <BlackjackContext.Provider value={value}>
      {children}
    </BlackjackContext.Provider>
  );
};

export default BlackjackContext;
