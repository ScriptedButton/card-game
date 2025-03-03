import { Card } from "../services/cardApi";

/**
 * Get the color for a card suit
 * @param suit - The card suit
 * @returns The CSS color class for the suit
 */
export function getSuitColor(suit: string): string {
  switch (suit.toLowerCase()) {
    case "hearts":
    case "diamonds":
      return "text-red-600";
    case "clubs":
    case "spades":
    default:
      return "text-black";
  }
}

/**
 * Get the Unicode symbol for a card suit
 * @param suit - The card suit
 * @returns The Unicode symbol for the suit
 */
export function getSuitSymbol(suit: string): string {
  switch (suit.toLowerCase()) {
    case "hearts":
      return "♥";
    case "diamonds":
      return "♦";
    case "clubs":
      return "♣";
    case "spades":
    default:
      return "♠";
  }
}

/**
 * Get the display value for a card rank
 * @param rank - The card rank
 * @returns The display value for the rank
 */
export function getCardDisplay(rank: string): string {
  switch (rank.toLowerCase()) {
    case "ace":
      return "A";
    case "king":
      return "K";
    case "queen":
      return "Q";
    case "jack":
      return "J";
    default:
      return rank;
  }
}

/**
 * Get the card image URL for a specific card
 * @param card - The card object
 * @returns The URL to the card image
 */
export function getCardImageUrl(card: Card): string {
  // This is a placeholder - in a real app, you'd use actual card images
  // You could use a card deck image library or generate SVGs
  return `/card-images/${card.rank}_of_${card.suit}.png`;
}

/**
 * Format a card into a display name
 * @param card - The card object
 * @returns Formatted card name (e.g., "Ace of Spades")
 */
export function formatCardName(card: Card): string {
  const rankFormatted = card.rank.charAt(0).toUpperCase() + card.rank.slice(1);
  const suitFormatted = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
  return `${rankFormatted} of ${suitFormatted}`;
}
