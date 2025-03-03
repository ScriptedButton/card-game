import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center game-table p-4">
      <div className="w-full max-w-5xl flex flex-col items-center">
        <h1 className="text-5xl font-bold text-white mb-2">Blackjack 21</h1>
        <p className="text-white/80 mb-8">
          Test your luck with cards powered by qrandom.io API
        </p>

        <section className="w-full mb-16">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            How to Play
          </h2>
          <p className="text-xl text-white/80 text-center mb-8">
            Classic blackjack rules with a twist
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-green-900 p-6 rounded-xl border-4 border-white/20 flex flex-col items-center text-white">
              <h3 className="text-2xl font-bold mb-4">Get Cards</h3>
              <p className="text-sm text-center mb-6">
                Each player starts with two cards. The dealer gets one face-up
                and one face-down.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-green-900 p-6 rounded-xl border-4 border-white/20 flex flex-col items-center text-white">
              <h3 className="text-2xl font-bold mb-4">Hit or Stand</h3>
              <p className="text-sm text-center mb-6">
                Choose to "Hit" to get another card or "Stand" to keep your
                current hand. Try to get as close to 21 without going over.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-green-900 p-6 rounded-xl border-4 border-white/20 flex flex-col items-center text-white">
              <h3 className="text-2xl font-bold mb-4">Card Values</h3>
              <p className="text-sm text-center mb-6">
                Number cards are worth their face value. Face cards (Jack,
                Queen, King) are worth 10. Aces can be worth 1 or 11, whichever
                is better for your hand.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-green-900 p-6 rounded-xl border-4 border-white/20 flex flex-col items-center text-white">
              <h3 className="text-2xl font-bold mb-4">Win Condition</h3>
              <p className="text-sm text-center mb-6">
                Beat the dealer by having a higher total without exceeding 21,
                or by the dealer busting. Blackjack (an Ace with a 10-point
                card) pays 3:2.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/game">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-6 text-lg">
              Play Blackjack
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="outline"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-bold px-8 py-6 text-lg"
            >
              About This Game
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
