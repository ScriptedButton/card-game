import { Card } from "../services/cardApi";

/**
 * Get the numeric value of a card for blackjack
 * @param card - The card object
 * @param aceHigh - Whether to count Ace as 11 (true) or 1 (false)
 * @returns The numeric value of the card
 */
export function getCardValue(card: Card, aceHigh: boolean = true): number {
  if (!card || !card.rank) return 0;

  const rank = card.rank.toLowerCase();

  if (rank === "ace") {
    return aceHigh ? 11 : 1;
  }

  if (["king", "queen", "jack"].includes(rank)) {
    return 10;
  }

  return parseInt(rank, 10);
}

/**
 * Calculate the total value of a hand for blackjack
 * This function automatically adjusts aces to avoid busting
 * @param cards - Array of cards in the hand
 * @returns The best possible hand value without busting if possible
 */
export function calculateHandValue(cards: Card[]): number {
  if (!cards || !Array.isArray(cards) || cards.length === 0) return 0;

  let total = 0;
  let aces = 0;

  // First pass: count non-aces and identify aces
  for (const card of cards) {
    if (!card || !card.rank) continue; // Skip undefined or invalid cards

    if (card.rank.toLowerCase() === "ace") {
      aces++;
    } else {
      total += getCardValue(card);
    }
  }

  // Second pass: handle aces with the best value
  for (let i = 0; i < aces; i++) {
    // If counting an ace as 11 would bust, count it as 1
    if (total + 11 > 21) {
      total += 1;
    } else {
      total += 11;
    }
  }

  return total;
}

/**
 * Check if a hand has busted (gone over 21)
 * @param cards - Array of cards in the hand
 * @returns True if the hand is over 21, false otherwise
 */
export function isBust(cards: Card[]): boolean {
  return calculateHandValue(cards) > 21;
}

/**
 * Check if a hand is a blackjack (an ace and a 10-value card)
 * @param cards - Array of cards in the hand
 * @returns True if the hand is a blackjack, false otherwise
 */
export function isBlackjack(cards: Card[]): boolean {
  if (!cards || !Array.isArray(cards) || cards.length !== 2) {
    return false;
  }

  // Make sure both cards are valid
  if (!cards[0] || !cards[1] || !cards[0].rank || !cards[1].rank) {
    return false;
  }

  const hasAce = cards.some(
    (card) => card && card.rank && card.rank.toLowerCase() === "ace"
  );
  const hasTenCard = cards.some(
    (card) =>
      card &&
      card.rank &&
      ["10", "jack", "queen", "king"].includes(card.rank.toLowerCase())
  );

  return hasAce && hasTenCard;
}

/**
 * Determine the winner of a blackjack game
 * @param playerCards - Array of player's cards
 * @param dealerCards - Array of dealer's cards
 * @returns 'player', 'dealer', or 'push' (tie)
 */
export function determineWinner(
  playerCards: Card[],
  dealerCards: Card[]
): "player" | "dealer" | "push" {
  // Handle empty arrays
  if (
    !playerCards ||
    !dealerCards ||
    !playerCards.length ||
    !dealerCards.length
  ) {
    return "push";
  }

  const playerValue = calculateHandValue(playerCards);
  const dealerValue = calculateHandValue(dealerCards);
  const playerHasBlackjack = isBlackjack(playerCards);
  const dealerHasBlackjack = isBlackjack(dealerCards);

  // Check for blackjack
  if (playerHasBlackjack && dealerHasBlackjack) {
    return "push"; // Both have blackjack, it's a tie
  }

  if (playerHasBlackjack) {
    return "player"; // Player has blackjack, player wins
  }

  if (dealerHasBlackjack) {
    return "dealer"; // Dealer has blackjack, dealer wins
  }

  // Check for busts
  if (isBust(playerCards)) {
    return "dealer"; // Player busted, dealer wins
  }

  if (isBust(dealerCards)) {
    return "player"; // Dealer busted, player wins
  }

  // Compare hand values
  if (playerValue > dealerValue) {
    return "player"; // Player has higher value, player wins
  }

  if (dealerValue > playerValue) {
    return "dealer"; // Dealer has higher value, dealer wins
  }

  return "push"; // Equal values, it's a tie
}

/**
 * Determine if the dealer should hit based on standard rules
 * (dealer hits on 16 or lower, stands on 17 or higher)
 * @param dealerCards - Array of dealer's cards
 * @returns True if the dealer should hit, false otherwise
 */
export function shouldDealerHit(dealerCards: Card[]): boolean {
  if (!dealerCards || !Array.isArray(dealerCards) || dealerCards.length === 0) {
    return false;
  }

  const dealerValue = calculateHandValue(dealerCards);
  return dealerValue < 17;
}
