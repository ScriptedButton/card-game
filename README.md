# Blackjack 21 - Card Game

A modern implementation of the classic Blackjack card game using the qrandom.io API for truly random card shuffling.

## Features

- Classic Blackjack gameplay
- Real card shuffling using the qrandom.io quantum random number generator API
- Modern UI with card flip animations
- Full game state management
- Betting system with balance tracking
- Mobile-responsive design

## Technology Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **API**: qrandom.io for card shuffling

## Game Rules

- Each player starts with two cards. The dealer gets one face-up and one face-down card.
- Number cards (2-10) are worth their face value. Face cards (Jack, Queen, King) are worth 10 points.
- Aces can be worth either 1 or 11 points, whichever is better for your hand.
- Players can "Hit" to draw additional cards or "Stand" to keep their current hand.
- If a player's hand exceeds 21 points, they "bust" and lose the round.
- After the player stands, the dealer reveals their face-down card and must hit until their hand totals 17 or more points.
- If the dealer busts, the player wins. Otherwise, the higher point total wins.
- A "Blackjack" (an Ace with a 10-point card) pays 3:2 on the player's bet.
- If both the player and dealer have the same point total, it's a "push" (tie) and the bet is returned.

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

This project uses the qrandom.io API to get truly random shuffled decks of cards. The main endpoints are:

- `GET /api/random/deck` - Shuffle a deck of cards
- `GET /api/random/deck/:resultId/show` - Get a specific card from the deck
- `GET /api/random/deck/:resultId/all` - Get all cards from the shuffled deck

## Deployment

The application can be deployed with the following steps:

1. Build the application with `npm run build`
2. Start the production server with `npm start`

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [qrandom.io API Documentation](https://qrandom.io/documentation)

## License

This project is open source and available under the MIT License.
