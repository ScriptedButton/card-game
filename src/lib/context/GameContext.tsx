"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Card,
  DeckResponse,
  getShuffledDeck,
  getAllCards,
} from "@/lib/services/cardApi";

interface GameContextType {
  loading: boolean;
  error: string | null;
  deckResponse: DeckResponse | null;
  allCards: Card[];
  fetchNewDeck: (decks?: number, cards?: number) => Promise<void>;
  fetchAllCards: () => Promise<void>;
  resultId: string | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deckResponse, setDeckResponse] = useState<DeckResponse | null>(null);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [resultId, setResultId] = useState<string | null>(null);

  const fetchNewDeck = async (decks = 1, cards?: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getShuffledDeck(decks, cards);
      setDeckResponse(response);
      setResultId(response.id);
      // Initialize with the cards from the response
      setAllCards(response.deck.cards);
    } catch (err) {
      setError("Failed to fetch shuffled deck. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCards = async () => {
    if (!resultId) {
      setError("No deck available. Please shuffle cards first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cards = await getAllCards(resultId);
      setAllCards(cards);
    } catch (err) {
      setError("Failed to fetch all cards. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Value object containing all the context values
  const value = {
    loading,
    error,
    deckResponse,
    allCards,
    fetchNewDeck,
    fetchAllCards,
    resultId,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export default GameContext;
