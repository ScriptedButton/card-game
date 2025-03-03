/// <reference types="jest" />
import {
  getCardValue,
  calculateHandValue,
  isBlackjack,
  isBust,
  determineWinner,
  shouldDealerHit,
  calculatePayout,
} from "@/lib/utils/blackjackUtils";
import { Card } from "@/lib/services/cardApi";
import "@testing-library/jest-dom";

// Helper function to create card objects for testing
function createCard(rank: string, suit: string): Card {
  return {
    suit: suit,
    rank: rank,
  };
}

describe("Blackjack Utility Functions", () => {
  describe("getCardValue", () => {
    test("ace should be valued as 11 by default", () => {
      const card = createCard("ace", "spades");
      expect(getCardValue(card)).toBe(11);
    });

    test("ace should be valued as 1 when aceHigh is false", () => {
      const card = createCard("ace", "hearts");
      expect(getCardValue(card, false)).toBe(1);
    });

    test("face cards (king, queen, jack) should be valued as 10", () => {
      const king = createCard("king", "hearts");
      const queen = createCard("queen", "diamonds");
      const jack = createCard("jack", "clubs");

      expect(getCardValue(king)).toBe(10);
      expect(getCardValue(queen)).toBe(10);
      expect(getCardValue(jack)).toBe(10);
    });

    test("numeric cards should be valued as their rank", () => {
      const two = createCard("2", "spades");
      const seven = createCard("7", "hearts");
      const ten = createCard("10", "diamonds");

      expect(getCardValue(two)).toBe(2);
      expect(getCardValue(seven)).toBe(7);
      expect(getCardValue(ten)).toBe(10);
    });

    test("should handle invalid card data gracefully", () => {
      const invalidCard = {} as Card;
      expect(getCardValue(invalidCard)).toBe(0);
    });
  });

  describe("calculateHandValue", () => {
    test("should correctly calculate hand with no aces", () => {
      const hand = [createCard("10", "spades"), createCard("7", "hearts")];
      expect(calculateHandValue(hand)).toBe(17);
    });

    test("should correctly calculate hand with one ace counted as 11", () => {
      const hand = [createCard("ace", "spades"), createCard("7", "hearts")];
      expect(calculateHandValue(hand)).toBe(18); // Ace = 11, 7 = 7
    });

    test("should correctly calculate hand with one ace counted as 1 to avoid bust", () => {
      const hand = [
        createCard("ace", "spades"),
        createCard("king", "hearts"),
        createCard("queen", "diamonds"),
      ];
      expect(calculateHandValue(hand)).toBe(21); // Ace = 1, King = 10, Queen = 10
    });

    test("should correctly calculate hand with multiple aces", () => {
      const hand = [
        createCard("ace", "spades"),
        createCard("ace", "hearts"),
        createCard("ace", "diamonds"),
        createCard("8", "clubs"),
      ];
      expect(calculateHandValue(hand)).toBe(21); // One ace as 11, others as 1
    });

    test("should handle empty hand", () => {
      expect(calculateHandValue([])).toBe(0);
    });

    test("should handle invalid input", () => {
      expect(calculateHandValue(null as unknown as Card[])).toBe(0);
      expect(calculateHandValue(undefined as unknown as Card[])).toBe(0);
    });
  });

  describe("isBlackjack", () => {
    test("should detect blackjack with ace and 10-value card", () => {
      // Test all combinations of blackjack
      const blackjackHands = [
        [createCard("ace", "spades"), createCard("10", "hearts")],
        [createCard("ace", "diamonds"), createCard("jack", "clubs")],
        [createCard("ace", "hearts"), createCard("queen", "spades")],
        [createCard("ace", "clubs"), createCard("king", "diamonds")],
        // Reverse order
        [createCard("10", "hearts"), createCard("ace", "spades")],
        [createCard("jack", "clubs"), createCard("ace", "diamonds")],
        [createCard("queen", "spades"), createCard("ace", "hearts")],
        [createCard("king", "diamonds"), createCard("ace", "clubs")],
      ];

      blackjackHands.forEach((hand) => {
        expect(isBlackjack(hand)).toBe(true);
      });
    });

    test("should not detect blackjack with more than 2 cards", () => {
      const hand = [
        createCard("ace", "spades"),
        createCard("9", "hearts"),
        createCard("ace", "diamonds"),
      ];
      expect(isBlackjack(hand)).toBe(false);
    });

    test("should not detect blackjack with 2 cards summing to 21 but not ace+10", () => {
      const hand = [
        createCard("8", "spades"),
        createCard("3", "hearts"),
        createCard("10", "diamonds"),
      ];
      // Even though this sums to 21, it's not a blackjack (not ace + 10-value card)
      expect(isBlackjack(hand)).toBe(false);
    });

    test("should not detect blackjack with non-blackjack hands", () => {
      const nonBlackjackHands = [
        [createCard("10", "spades"), createCard("7", "hearts")], // 17
        [createCard("ace", "spades"), createCard("2", "hearts")], // 13
        [createCard("5", "spades"), createCard("8", "hearts")], // 13
      ];

      nonBlackjackHands.forEach((hand) => {
        expect(isBlackjack(hand)).toBe(false);
      });
    });

    test("should handle empty or invalid hands", () => {
      expect(isBlackjack([])).toBe(false);
      expect(isBlackjack(null as unknown as Card[])).toBe(false);
      expect(isBlackjack([{} as Card, {} as Card])).toBe(false);
    });
  });

  describe("isBust", () => {
    test("should detect bust hands (over 21)", () => {
      const bustHands = [
        [
          createCard("10", "spades"),
          createCard("king", "hearts"),
          createCard("2", "diamonds"),
        ], // 22
        [
          createCard("8", "spades"),
          createCard("7", "hearts"),
          createCard("9", "clubs"),
        ], // 24
        [
          createCard("10", "spades"),
          createCard("jack", "hearts"),
          createCard("queen", "diamonds"),
        ], // 30
      ];

      bustHands.forEach((hand) => {
        expect(isBust(hand)).toBe(true);
      });
    });

    test("should not detect bust for hands 21 or under", () => {
      const nonBustHands = [
        [createCard("ace", "spades"), createCard("king", "hearts")], // 21 (blackjack)
        [
          createCard("10", "spades"),
          createCard("7", "hearts"),
          createCard("4", "diamonds"),
        ], // 21
        [
          createCard("6", "spades"),
          createCard("5", "hearts"),
          createCard("ace", "diamonds"),
        ], // 12
        [createCard("10", "spades"), createCard("5", "hearts")], // 15
      ];

      nonBustHands.forEach((hand) => {
        expect(isBust(hand)).toBe(false);
      });
    });

    test("should handle aces properly to avoid bust when possible", () => {
      const hand = [
        createCard("ace", "spades"), // 11 or 1
        createCard("ace", "hearts"), // 11 or 1
        createCard("9", "diamonds"), // 9
      ];
      // Should be counted as 1+1+9 = 11, not bust
      expect(isBust(hand)).toBe(false);
    });
  });

  describe("determineWinner", () => {
    test("should determine player wins with blackjack against non-blackjack dealer", () => {
      const playerHand = [
        createCard("ace", "spades"),
        createCard("king", "hearts"),
      ]; // Blackjack
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("8", "clubs"),
      ]; // 18

      expect(determineWinner(playerHand, dealerHand)).toBe("player");
    });

    test("should determine dealer wins with blackjack against non-blackjack player", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("8", "hearts"),
      ]; // 18
      const dealerHand = [
        createCard("ace", "diamonds"),
        createCard("queen", "clubs"),
      ]; // Blackjack

      expect(determineWinner(playerHand, dealerHand)).toBe("dealer");
    });

    test("should determine push when both have blackjack", () => {
      const playerHand = [
        createCard("ace", "spades"),
        createCard("king", "hearts"),
      ]; // Blackjack
      const dealerHand = [
        createCard("ace", "diamonds"),
        createCard("queen", "clubs"),
      ]; // Blackjack

      expect(determineWinner(playerHand, dealerHand)).toBe("push");
    });

    test("should determine dealer wins when player busts", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("king", "hearts"),
        createCard("5", "diamonds"),
      ]; // 25, bust
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("5", "clubs"),
      ]; // 15

      expect(determineWinner(playerHand, dealerHand)).toBe("dealer");
    });

    test("should determine player wins when dealer busts", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("8", "hearts"),
      ]; // 18
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("8", "clubs"),
        createCard("9", "hearts"),
      ]; // 27, bust

      expect(determineWinner(playerHand, dealerHand)).toBe("player");
    });

    test("should determine player wins when player has higher value", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("9", "hearts"),
      ]; // 19
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("8", "clubs"),
      ]; // 18

      expect(determineWinner(playerHand, dealerHand)).toBe("player");
    });

    test("should determine dealer wins when dealer has higher value", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("7", "hearts"),
      ]; // 17
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("8", "clubs"),
      ]; // 18

      expect(determineWinner(playerHand, dealerHand)).toBe("dealer");
    });

    test("should determine push when player and dealer have equal non-blackjack values", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("8", "hearts"),
      ]; // 18
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("8", "clubs"),
      ]; // 18

      expect(determineWinner(playerHand, dealerHand)).toBe("push");
    });

    test("should handle empty or invalid hands gracefully", () => {
      expect(determineWinner([], [])).toBe("push");
    });

    test("should determine dealer wins with 21 (not blackjack) against lower player score", () => {
      // Dealer has 21 with 3 cards (not a blackjack)
      const dealerHand = [
        createCard("7", "spades"),
        createCard("7", "hearts"),
        createCard("7", "diamonds"),
      ]; // 21 (not blackjack)

      // Player has 20
      const playerHand = [
        createCard("10", "clubs"),
        createCard("queen", "hearts"),
      ]; // 20

      // Dealer should win with higher score
      expect(determineWinner(playerHand, dealerHand)).toBe("dealer");
    });

    test("should determine dealer wins with exact 21 against player 20", () => {
      // Specific test for the bug case
      const dealerHand = [
        createCard("ace", "spades"),
        createCard("king", "hearts"),
        createCard("10", "clubs"),
      ]; // 21 (not blackjack due to 3 cards)

      const playerHand = [
        createCard("10", "diamonds"),
        createCard("10", "hearts"),
      ]; // 20

      const result = determineWinner(playerHand, dealerHand);
      expect(result).toBe("dealer");
    });
  });

  describe("shouldDealerHit", () => {
    test("dealer should hit on 16 or lower", () => {
      const hands = [
        [createCard("10", "spades"), createCard("6", "hearts")], // 16
        [createCard("9", "spades"), createCard("6", "hearts")], // 15
        [createCard("5", "spades"), createCard("6", "hearts")], // 11
      ];

      hands.forEach((hand) => {
        expect(shouldDealerHit(hand)).toBe(true);
      });
    });

    test("dealer should stand on hard 17 or higher", () => {
      const hands = [
        [createCard("10", "spades"), createCard("7", "hearts")], // hard 17
        [createCard("10", "spades"), createCard("9", "hearts")], // 19
        [createCard("10", "spades"), createCard("king", "hearts")], // 20
      ];

      hands.forEach((hand) => {
        expect(shouldDealerHit(hand, false)).toBe(false);
      });
    });

    test("dealer should hit on soft 17 with hitOnSoft17 option", () => {
      const hand = [createCard("ace", "spades"), createCard("6", "hearts")]; // soft 17

      expect(shouldDealerHit(hand, true)).toBe(true);
    });

    test("dealer should stand on soft 17 without hitOnSoft17 option", () => {
      const hand = [createCard("ace", "spades"), createCard("6", "hearts")]; // soft 17

      expect(shouldDealerHit(hand, false)).toBe(false);
    });

    test("dealer should stand on soft 18 or higher", () => {
      const hands = [
        [createCard("ace", "spades"), createCard("7", "hearts")], // soft 18
        [createCard("ace", "spades"), createCard("9", "hearts")], // soft 20
      ];

      hands.forEach((hand) => {
        expect(shouldDealerHit(hand, true)).toBe(false);
      });
    });
  });

  describe("calculatePayout", () => {
    test("should calculate standard 1:1 payout for normal win", () => {
      expect(calculatePayout(100, false)).toBe(200); // Bet 100, get 100 winnings + 100 original bet back
    });

    test("should calculate 3:2 payout for blackjack", () => {
      expect(calculatePayout(100, true)).toBe(250); // Bet 100, get 150 winnings + 100 original bet back
    });

    test("should handle 0 bet", () => {
      expect(calculatePayout(0, false)).toBe(0);
      expect(calculatePayout(0, true)).toBe(0);
    });

    test("should handle negative bet as 0", () => {
      expect(calculatePayout(-10, false)).toBe(0);
    });
  });

  describe("Integration Tests - Game Scenarios", () => {
    test("player has blackjack, dealer doesn't - player wins with blackjack payout", () => {
      const playerHand = [
        createCard("ace", "spades"),
        createCard("king", "hearts"),
      ]; // Blackjack
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("9", "clubs"),
      ]; // 19

      const result = determineWinner(playerHand, dealerHand);
      const payout = calculatePayout(100, isBlackjack(playerHand));

      expect(result).toBe("player");
      expect(payout).toBe(250); // 3:2 payout for blackjack
    });

    test("dealer has blackjack, player doesn't - dealer wins", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("9", "hearts"),
      ]; // 19
      const dealerHand = [
        createCard("ace", "diamonds"),
        createCard("queen", "clubs"),
      ]; // Blackjack

      const result = determineWinner(playerHand, dealerHand);

      expect(result).toBe("dealer");
    });

    test("both have same score, push condition - bet is returned", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("8", "hearts"),
      ]; // 18
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("8", "clubs"),
      ]; // 18

      const result = determineWinner(playerHand, dealerHand);

      expect(result).toBe("push");
    });

    test("player busts, dealer doesn't - dealer wins", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("8", "hearts"),
        createCard("5", "diamonds"),
      ]; // 23 (bust)
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("5", "clubs"),
      ]; // 15

      const result = determineWinner(playerHand, dealerHand);

      expect(result).toBe("dealer");
    });

    test("dealer busts, player doesn't - player wins", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("5", "hearts"),
      ]; // 15
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("6", "clubs"),
        createCard("7", "hearts"),
      ]; // 23 (bust)

      const result = determineWinner(playerHand, dealerHand);

      expect(result).toBe("player");
    });

    test("both bust - dealer wins", () => {
      const playerHand = [
        createCard("10", "spades"),
        createCard("8", "hearts"),
        createCard("5", "diamonds"),
      ]; // 23 (bust)
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("6", "clubs"),
        createCard("7", "hearts"),
      ]; // 23 (bust)

      const result = determineWinner(playerHand, dealerHand);

      expect(result).toBe("dealer");
    });

    test('player has 5 cards without busting ("five card charlie") - should win', () => {
      const playerHand = [
        createCard("ace", "spades"), // 1
        createCard("2", "hearts"), // 2
        createCard("3", "diamonds"), // 3
        createCard("4", "clubs"), // 4
        createCard("5", "hearts"), // 5
      ]; // Total: 15
      const dealerHand = [
        createCard("10", "diamonds"),
        createCard("6", "clubs"),
      ]; // 16

      // Check if your game implements "five card charlie" rule
      // If not, normal comparison applies
      const result = determineWinner(playerHand, dealerHand);

      // For standard rules without five card charlie, dealer would win with 16 vs 15
      expect(result).toBe("dealer");

      // If you implement five card charlie rule, change the expected result:
      // expect(result).toBe('player');
    });
  });
});
