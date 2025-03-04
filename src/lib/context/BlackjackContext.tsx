"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
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
  const [, setRetryCount] = useState<number>(0);
  const [hasBlackjack, setHasBlackjack] = useState<boolean>(false);

  // API state
  const [resultId, setResultId] = useState<string | null>(null);
  const [drawnCardIndex, setDrawnCardIndex] = useState<number>(0);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);

  // Derived state
  const playerScore = calculateHandValue(playerCards || []);
  const dealerScore = calculateHandValue(dealerCards || []);

  // Get a card from the deck - completely rewritten for reliability
  const getNextCard = async (retries = 2): Promise<Card> => {
    // First, ensure we have a valid deck ID
    if (!resultId) {
      console.log("No deck available, creating one...");
      const response = await getShuffledDeck(1);

      if (!response || !response.id) {
        throw new Error("Failed to create a new deck");
      }

      console.log("Created new deck with ID:", response.id);
      setResultId(response.id);
      setAvailableCards(response.deck.cards);
      setDrawnCardIndex(0);

      if (response.deck.cards.length > 0) {
        const firstCard = response.deck.cards[0];
        setDrawnCardIndex(1); // Move to the next card
        return firstCard;
      } else {
        throw new Error("New deck created but no cards available");
      }
    }

    // If we have a deck ID but no cards or we've used all cards
    if (!availableCards.length || drawnCardIndex >= availableCards.length) {
      try {
        console.log("Fetching all cards for deck ID:", resultId);
        const allCards = await getAllCards(resultId);

        if (!allCards || !Array.isArray(allCards) || allCards.length === 0) {
          // If getAllCards fails, create a new deck as fallback
          console.log("No cards available from getAllCards, creating new deck");
          const newDeckResponse = await getShuffledDeck(1);

          if (!newDeckResponse || !newDeckResponse.id) {
            throw new Error(
              "Failed to create a new deck after card fetch failure"
            );
          }

          setResultId(newDeckResponse.id);
          setAvailableCards(newDeckResponse.deck.cards);
          setDrawnCardIndex(0);

          if (newDeckResponse.deck.cards.length > 0) {
            const firstCard = newDeckResponse.deck.cards[0];
            setDrawnCardIndex(1);
            return firstCard;
          } else {
            throw new Error("New deck created but no cards available");
          }
        }

        setAvailableCards(allCards);
        setDrawnCardIndex(0);

        const nextCard = allCards[0];
        setDrawnCardIndex(1);
        return nextCard;
      } catch (error) {
        console.error("Error getting cards:", error);

        if (retries > 0) {
          console.log(`Retrying card fetch, attempts remaining: ${retries}`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          return getNextCard(retries - 1);
        }

        throw new Error(
          `Failed to get cards: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    // Normal case - we have a deck and cards available
    const card = availableCards[drawnCardIndex];

    if (!card || !card.rank || !card.suit) {
      console.error("Invalid card at index", drawnCardIndex, ":", card);

      if (retries > 0 && drawnCardIndex + 1 < availableCards.length) {
        console.log(
          `Skipping invalid card, trying next one. Attempts remaining: ${retries}`
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
      setRetryCount(0);

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
      setError,
      setIsLoading,
      setLoadingStage,
      setResult,
      setGameStatus,
      setCurrentBet,
      setRetryCount,
      setResultId,
      setAvailableCards,
      setDrawnCardIndex,
      setPlayerCards,
      setDealerCards,
      setHasBlackjack,
      setBalance,
    ]
  );

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
    } catch (err: unknown) {
      console.error("Error hitting:", err);
      setError(
        `Failed to draw card: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
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

    // Double the current bet
    const additionalBet = currentBet;
    setCurrentBet(currentBet * 2);

    // Deduct the additional bet from the balance
    setBalance((prev) => prev - additionalBet);
    console.log(
      `Additional bet of $${additionalBet} deducted for double down, new balance: ${
        balance - additionalBet
      }`
    );

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
    } catch (err: unknown) {
      console.error("Error doubling down:", err);
      setError(
        `Failed to double down: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
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
      const finalPlayerScore = calculateHandValue(currentPlayerCards);
      const finalDealerScore = calculateHandValue(dealerCards);

      // Check for duplicate cards which could cause calculation issues
      const allCards = [...currentPlayerCards, ...dealerCards];
      const cardSignatures = allCards.map(
        (card) => `${card.rank} of ${card.suit}`
      );
      const uniqueCardSignatures = new Set(cardSignatures);

      if (cardSignatures.length !== uniqueCardSignatures.size) {
        console.error(
          "DUPLICATE CARDS DETECTED! This could cause scoring issues."
        );
        console.error("Card list:", cardSignatures);

        // Find duplicates
        const counts: Record<string, number> = {};
        const duplicates: string[] = [];

        cardSignatures.forEach((sig) => {
          counts[sig] = (counts[sig] || 0) + 1;
          if (counts[sig] > 1 && !duplicates.includes(sig)) {
            duplicates.push(sig);
          }
        });

        console.error("Duplicate cards:", duplicates);
      }

      console.log("Final cards at game end:", {
        playerCards: currentPlayerCards.map((c) => `${c.rank} of ${c.suit}`),
        dealerCards: dealerCards.map((c) => `${c.rank} of ${c.suit}`),
        playerScore: finalPlayerScore,
        dealerScore: finalDealerScore,
      });

      // Determine the winner
      const winResult = determineWinner(currentPlayerCards, dealerCards);
      console.log("Game result determined:", winResult);

      // Trust the determineWinner function's result and don't override it
      // The determineWinner function has been fixed to properly handle all cases
      setResult(winResult);

      // Add additional validation to catch potential issues
      // This is a safety check that will trigger an error if something is still wrong
      if (
        finalPlayerScore < finalDealerScore &&
        finalDealerScore <= 21 &&
        winResult === "player" &&
        !isBlackjack(currentPlayerCards)
      ) {
        console.error(
          "CRITICAL BUG: Game showing player win when dealer has higher score and hasn't busted!",
          {
            playerScore: finalPlayerScore,
            dealerScore: finalDealerScore,
            result: winResult,
            playerCards: currentPlayerCards,
            dealerCards: dealerCards,
          }
        );
        setError(
          "CRITICAL BUG: Game showing player win when dealer has higher score!"
        );
      }

      // Mark the game as complete
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
        // Player gets their original bet back plus winnings
        setBalance((prev) => prev + payoutAmount);
      } else if (winResult === "push") {
        console.log(`Push (tie) - bet returned. Original bet: ${currentBet}`);
        // Return the original bet to the player on push
        // (bet was already deducted at game start, so we're just giving it back)
        setBalance((prev) => {
          const newBalance = prev + currentBet;
          console.log(
            `Balance updated for push: ${prev} + ${currentBet} = ${newBalance}`
          );
          return newBalance;
        });
      } else {
        // Dealer wins
        console.log(`Dealer won - player loses bet of ${currentBet}`);
        // No balance update needed since the bet was already deducted when the game started
        // The player's bet is forfeited to the house
      }
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

  // Initialize game on first load
  useEffect(() => {
    if (gameStatus === "idle" && !isLoading) {
      startNewGame();
    }
  }, [gameStatus, isLoading, startNewGame]);

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
