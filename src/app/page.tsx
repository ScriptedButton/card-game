import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/HomepageClientComponents";
import ServerGoogleButton from "@/components/ServerGoogleButton";
import ServerSignOutButton from "@/components/ServerSignOutButton";
import GuestPlayButton from "@/components/GuestPlayButton";
import { auth } from "@/app/auth";

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const isLoggedIn = !!user;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center game-table p-4 relative overflow-hidden">
      {/* Client-side only animations */}
      <AnimatedBackground />

      {/* Table edge */}
      <div className="table-edge"></div>

      {/* Auth status - Positioned in top-right corner */}
      {isLoggedIn && (
        <div className="absolute top-4 right-4 z-50">
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 sm:p-3 rounded-lg border border-white/20 shadow-xl shadow-black/30">
            <div className="flex-1 hidden sm:block">
              <p className="text-white/70 text-xs">Signed in as</p>
              <p className="text-white font-semibold">
                {user?.name || "Player"}
              </p>
            </div>
            <div className="block sm:hidden">
              <p className="text-white/90 text-xs font-medium">
                {user?.name?.split(" ")[0] || "Player"}
              </p>
            </div>
            <ServerSignOutButton />
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col items-center z-10 opacity-100">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-2 text-center">
          <span className="text-yellow-400">Black</span>jack 21
        </h1>

        <p className="text-white/80 mb-12 text-xl md:text-2xl text-center max-w-2xl">
          Test your luck with cards powered by quantum randomness
        </p>

        <section className="w-full mb-16">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            How to Play
          </h2>

          <p className="text-xl text-white/80 text-center mb-12">
            Classic blackjack rules with a premium experience
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Get Cards",
                description:
                  "Each player starts with two cards. The dealer gets one face-up and one face-down.",
                icon: "♠",
                delay: 1.1,
              },
              {
                title: "Hit or Stand",
                description:
                  'Choose to "Hit" to get another card or "Stand" to keep your current hand. Try to get as close to 21 without going over.',
                icon: "♥",
                delay: 1.3,
              },
              {
                title: "Card Values",
                description:
                  "Number cards are worth their face value. Face cards (Jack, Queen, King) are worth 10. Aces can be worth 1 or 11, whichever is better for your hand.",
                icon: "♦",
                delay: 1.5,
              },
              {
                title: "Win Condition",
                description:
                  "Beat the dealer by having a higher total without exceeding 21, or by the dealer busting. Blackjack (an Ace with a 10-point card) pays 3:2.",
                icon: "♣",
                delay: 1.7,
              },
            ].map((card, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-xl border border-white/10 shadow-xl flex flex-col items-center text-white relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-200"
              >
                {/* Card background pattern */}
                <div className="absolute inset-0 opacity-10 pattern-background"></div>

                {/* Hover highlight effect */}
                <div className="absolute inset-0 bg-white/0 transition-colors hover:bg-white/5" />

                <div
                  className={`text-5xl mb-4 ${
                    card.icon === "♥" || card.icon === "♦"
                      ? "text-red-500"
                      : "text-white"
                  }`}
                >
                  {card.icon}
                </div>

                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>

                <p className="text-sm text-center mb-6 text-white/80">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-3xl mx-auto">
          {isLoggedIn && (
            <div className="w-full sm:w-auto">
              <Link href="/game" passHref legacyBehavior>
                <a className="relative z-50 block w-full">
                  <Button className="premium-button bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold px-8 py-6 text-lg shadow-lg shadow-yellow-900/20 w-full">
                    Play Blackjack
                  </Button>
                </a>
              </Link>
            </div>
          )}

          {!isLoggedIn && (
            <>
              <GuestPlayButton />
              <div className="text-center my-2 sm:my-0 sm:mx-2 text-white/50">
                or
              </div>
              <ServerGoogleButton />
            </>
          )}

          <div className="w-full sm:w-auto">
            <Link href="/about" passHref legacyBehavior>
              <a className="relative z-50 block w-full">
                <Button
                  variant="outline"
                  className="premium-button border-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-bold px-8 py-6 text-lg w-full"
                >
                  About This Game
                </Button>
              </a>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center text-white/50 text-sm">
          <p>A premium blackjack experience. Play responsibly.</p>
        </div>
      </div>
    </main>
  );
}
