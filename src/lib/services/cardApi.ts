// Card API Service for qrandom.io
// This service provides functions to interact with the qrandom.io API for shuffled card decks

// Types for API response
export interface Card {
  suit: string;
  rank: string;
}

export interface DeckResponse {
  timestamp: string;
  signature: string;
  deck: {
    cards: Card[];
    decks: number;
  };
  message: string;
  elapsedTime: number;
  id: string;
  resultType: string;
}

// Base URL for our internal API proxy
const API_BASE_URL = "/api";

// Store card information in memory to avoid repeated API calls
const deckStorage: { [key: string]: Card[] } = {};

/**
 * Get a shuffled deck of cards
 * @param decks - Number of decks to shuffle (default: 1)
 * @param cards - Number of cards to return initially (default: all)
 * @returns Promise with the shuffled deck response
 */
export async function getShuffledDeck(
  decks: number = 1,
  cards?: number
): Promise<DeckResponse> {
  let url = `${API_BASE_URL}/deck?decks=${decks}`;

  if (cards) {
    url += `&cards=${cards}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch shuffled deck: ${response.statusText}`);
  }

  const data = await response.json();

  // Store all cards in memory
  if (data && data.id && data.deck && data.deck.cards) {
    deckStorage[data.id] = data.deck.cards;
  }

  return data;
}

/**
 * Get a specific card from a shuffled deck by index
 * @param resultId - The ID of the shuffled deck result
 * @param index - The index of the card to retrieve
 * @returns Promise with the card
 */
export async function getCardAt(
  resultId: string,
  index: number
): Promise<Card> {
  // If we already have the deck in memory and the index is valid, return the card
  if (deckStorage[resultId] && index < deckStorage[resultId].length) {
    return deckStorage[resultId][index];
  }

  const url = `${API_BASE_URL}/deck/${resultId}/show?at=${index}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch card: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all cards from a shuffled deck
 * @param resultId - The ID of the shuffled deck result
 * @returns Promise with all cards
 */
export async function getAllCards(resultId: string): Promise<Card[]> {
  // If we have the deck in memory, return it
  if (deckStorage[resultId]) {
    return deckStorage[resultId];
  }

  const url = `${API_BASE_URL}/deck/${resultId}/all`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch all cards: ${response.statusText}`);
  }

  const data = await response.json();

  // Store cards in memory
  if (Array.isArray(data)) {
    deckStorage[resultId] = data;
  }

  return data;
}
