"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

// Client-side only component for animations
function AnimatedBackground() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Don't render on server

  return (
    <>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-32 h-32 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                i % 4 === 0
                  ? "radial-gradient(circle, rgba(230,198,86,0.3) 0%, rgba(230,198,86,0) 70%)"
                  : i % 4 === 1
                  ? "radial-gradient(circle, rgba(225,225,225,0.2) 0%, rgba(225,225,225,0) 70%)"
                  : i % 4 === 2
                  ? "radial-gradient(circle, rgba(169,27,13,0.2) 0%, rgba(169,27,13,0) 70%)"
                  : "radial-gradient(circle, rgba(21,128,61,0.3) 0%, rgba(21,128,61,0) 70%)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 180}deg) scale(${
                0.5 + Math.random() * 1.5
              })`,
            }}
          />
        ))}
      </div>

      {/* Card symbols floating in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {["♠", "♥", "♦", "♣"].map((symbol, i) =>
          Array.from({ length: 3 }).map((_, j) => (
            <div
              key={`${symbol}-${j}`}
              className={`absolute text-4xl ${
                symbol === "♥" || symbol === "♦"
                  ? "text-red-500/20"
                  : "text-white/20"
              } font-bold`}
              style={{
                left: `${i * 25 + Math.random() * 10}%`,
                top: `${j * 30 + 10}%`,
                transform: `rotate(${Math.random() * 180 - 90}deg)`,
                animation: `floatDownward ${15 + Math.random() * 20}s linear ${
                  i * 2 + j * 5
                }s infinite`,
              }}
            >
              {symbol}
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center game-table p-4 relative overflow-hidden">
      {/* Client-side only animations */}
      <AnimatedBackground />

      {/* Table edge */}
      <div className="table-edge"></div>

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

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/game" passHref legacyBehavior>
            <a className="relative z-50">
              <Button className="premium-button bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold px-8 py-6 text-lg shadow-lg shadow-yellow-900/20">
                Play Blackjack
              </Button>
            </a>
          </Link>
          <Link href="/about" passHref legacyBehavior>
            <a className="relative z-50">
              <Button
                variant="outline"
                className="premium-button border-2 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-bold px-8 py-6 text-lg"
              >
                About This Game
              </Button>
            </a>
          </Link>
        </div>

        <div className="mt-16 text-center text-white/50 text-sm">
          <p>A premium blackjack experience. Play responsibly.</p>
        </div>
      </div>
    </main>
  );
}
