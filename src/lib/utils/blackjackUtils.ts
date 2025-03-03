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

  // Add debugging for card value calculation
  console.log(`Calculating value for card: ${card.rank} of ${card.suit}`);

  if (rank === "ace") {
    const value = aceHigh ? 11 : 1;
    console.log(`Ace valued as ${value}`);
    return value;
  }

  if (["king", "queen", "jack"].includes(rank)) {
    console.log(`Face card (${rank}) valued as 10`);
    return 10;
  }

  // Parse numeric ranks and validate
  const numericValue = parseInt(rank, 10);
  if (isNaN(numericValue)) {
    console.error(`Invalid card rank: ${rank}, defaulting to 0`);
    return 0;
  }

  console.log(`Numeric card (${rank}) valued as ${numericValue}`);
  return numericValue;
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
 * Check if a hand is a blackjack (an ace and a 10-value card as the initial two cards)
 * @param cards - Array of cards in the hand
 * @returns True if the hand is a blackjack, false otherwise
 */
export function isBlackjack(cards: Card[]): boolean {
  // A blackjack must be exactly 2 cards
  if (!cards || !Array.isArray(cards) || cards.length !== 2) {
    return false;
  }

  // Make sure both cards are valid
  if (!cards[0] || !cards[1] || !cards[0].rank || !cards[1].rank) {
    return false;
  }

  // Must have exactly one Ace and one 10-value card (10, J, Q, K)
  const hasAce = cards.some(
    (card) => card && card.rank && card.rank.toLowerCase() === "ace"
  );
  const hasTenCard = cards.some(
    (card) =>
      card &&
      card.rank &&
      ["10", "jack", "queen", "king"].includes(card.rank.toLowerCase())
  );

  // The value must be exactly 21
  const handValue = calculateHandValue(cards);

  return hasAce && hasTenCard && handValue === 21;
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
  // Add debug logging
  console.log("determineWinner called with:", {
    playerCards: playerCards.map((c) => `${c.rank} of ${c.suit}`),
    dealerCards: dealerCards.map((c) => `${c.rank} of ${c.suit}`),
  });

  // Handle empty arrays
  if (
    !playerCards ||
    !dealerCards ||
    !playerCards.length ||
    !dealerCards.length
  ) {
    console.warn("determineWinner: Empty card arrays, returning push");
    return "push";
  }

  // Add detailed card-by-card value calculation
  console.log("CARD-BY-CARD VALUE CALCULATION:");
  console.log("Player cards:");
  playerCards.forEach((card, index) => {
    const value = getCardValue(card);
    console.log(`  Card ${index + 1}: ${card.rank} of ${card.suit} = ${value}`);
  });
  console.log("Dealer cards:");
  dealerCards.forEach((card, index) => {
    const value = getCardValue(card);
    console.log(`  Card ${index + 1}: ${card.rank} of ${card.suit} = ${value}`);
  });

  const playerValue = calculateHandValue(playerCards);
  const dealerValue = calculateHandValue(dealerCards);
  const playerHasBlackjack = isBlackjack(playerCards);
  const dealerHasBlackjack = isBlackjack(dealerCards);

  console.log("DETAILED HAND ANALYSIS:", {
    playerCards: playerCards.length,
    dealerCards: dealerCards.length,
    playerValue,
    dealerValue,
    playerHasBlackjack,
    dealerHasBlackjack,
    isEqual: playerValue === dealerValue,
    dealerHigher: dealerValue > playerValue,
    playerHigher: playerValue > dealerValue,
  });

  // Check for blackjack
  if (playerHasBlackjack && dealerHasBlackjack) {
    console.log("Both have blackjack - PUSH");
    return "push"; // Both have blackjack, it's a tie
  }

  if (playerHasBlackjack) {
    console.log("Player has blackjack - PLAYER WINS");
    return "player"; // Player has blackjack, player wins
  }

  if (dealerHasBlackjack) {
    console.log("Dealer has blackjack - DEALER WINS");
    return "dealer"; // Dealer has blackjack, dealer wins
  }

  // Check for busts
  if (isBust(playerCards)) {
    console.log("Player busted - DEALER WINS");
    return "dealer"; // Player busted, dealer wins
  }

  if (isBust(dealerCards)) {
    console.log("Dealer busted - PLAYER WINS");
    return "player"; // Dealer busted, player wins
  }

  // Check for equal scores first - this is a push
  if (playerValue === dealerValue) {
    console.log(`PUSH DETECTED: Equal values (${playerValue}) - TIE GAME`);
    return "push"; // Equal values, it's a tie
  }

  // Compare hand values
  if (playerValue > dealerValue) {
    console.log(
      `Player value (${playerValue}) > Dealer value (${dealerValue}) - PLAYER WINS`
    );
    return "player"; // Player has higher value, player wins
  }

  if (dealerValue > playerValue) {
    console.log(
      `Dealer value (${dealerValue}) > Player value (${playerValue}) - DEALER WINS`
    );
    return "dealer"; // Dealer has higher value, dealer wins
  }

  // This should never happen, but added as a fallback
  console.log("Unexpected case in determineWinner - defaulting to push");
  return "push";
}

/**
 * Determine if the dealer should hit based on standard rules
 * (dealer hits on 16 or lower, stands on 17 or higher)
 * @param dealerCards - Array of dealer's cards
 * @param hitOnSoft17 - Whether the dealer should hit on soft 17 (true follows most casino standards)
 * @returns True if the dealer should hit, false otherwise
 */
export function shouldDealerHit(
  dealerCards: Card[],
  hitOnSoft17: boolean = true
): boolean {
  if (!dealerCards || !Array.isArray(dealerCards) || dealerCards.length === 0) {
    return false;
  }

  const dealerValue = calculateHandValue(dealerCards);

  // Always hit if below 17
  if (dealerValue < 17) {
    return true;
  }

  // Check for soft 17 (Ace counted as 11 + cards totaling 6)
  if (hitOnSoft17 && dealerValue === 17) {
    // A hand is "soft" if it contains an Ace counted as 11
    const hasAce = dealerCards.some(
      (card) => card && card.rank && card.rank.toLowerCase() === "ace"
    );

    // Check if the hand would still be valid if we count one Ace as 1 instead of 11
    if (hasAce) {
      // Calculate hand value with one Ace counted as 1 instead of 11
      const alternateValue = dealerValue - 10;

      // If the alternate value is 7, that means we have a soft 17
      return alternateValue === 7;
    }
  }

  return false;
}

/**
 * Calculate the correct payout amount for a winning hand
 * @param bet - The original bet amount
 * @param isPlayerBlackjack - Whether the player has a blackjack
 * @returns The total amount to add to the player's balance (including original bet)
 */
export function calculatePayout(
  bet: number,
  isPlayerBlackjack: boolean
): number {
  // Handle negative bets as 0
  if (bet <= 0) {
    return 0;
  }

  // For blackjack (3:2 payout)
  if (isPlayerBlackjack) {
    // Player gets their bet back + 1.5 times their bet as winnings
    return bet + Math.floor(bet * 1.5);
  }

  // For regular win (1:1 payout)
  // Player gets their bet back + their bet as winnings
  return bet * 2;
}
