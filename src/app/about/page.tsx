"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center game-table p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" passHref legacyBehavior>
            <a className="relative z-50">
              <Button
                variant="outline"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
              >
                Back to Home
              </Button>
            </a>
          </Link>
          <h1 className="text-4xl font-bold text-white text-center">
            About The Game
          </h1>
          <div className="w-[100px]"></div> {/* Empty div for flex alignment */}
        </div>

        <Card className="bg-green-900/70 border-green-800 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Blackjack 21</h2>
          <p className="text-white/90 mb-6">
            This card game is a digital implementation of the classic casino
            game Blackjack, also known as 21. The goal is simple: beat the
            dealer without going over 21.
          </p>

          <h3 className="text-xl font-bold text-white mb-2">Game Rules</h3>
          <ul className="list-disc pl-6 text-white/90 mb-6 space-y-2">
            <li>
              Each player starts with two cards. The dealer gets one face-up and
              one face-down card.
            </li>
            <li>
              Number cards (2-10) are worth their face value. Face cards (Jack,
              Queen, King) are worth 10 points. Aces can be worth either 1 or 11
              points, whichever is better for your hand.
            </li>
            <li>
              Players can &quot;Hit&quot; to draw additional cards or
              &quot;Stand&quot; to keep their current hand.
            </li>
            <li>
              If a player&apos;s hand exceeds 21 points, they &quot;bust&quot;
              and lose the round.
            </li>
            <li>
              After the player stands, the dealer reveals their face-down card
              and must hit until their hand totals 17 or more points.
            </li>
            <li>
              If the dealer busts, the player wins. Otherwise, the higher point
              total wins.
            </li>
            <li>
              A &quot;Blackjack&quot; (an Ace with a 10, Jack, Queen, or King)
              pays 3:2 on the player&apos;s bet.
            </li>
            <li>
              If both the player and dealer have the same point total, it&apos;s
              a &quot;push&quot; (tie) and the bet is returned.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-white mb-2">
            About the Technology
          </h3>
          <p className="text-white/90 mb-4">This game is built using:</p>
          <ul className="list-disc pl-6 text-white/90 mb-6 space-y-2">
            <li>Next.js 15 - React framework for the frontend</li>
            <li>TypeScript - For type-safe JavaScript</li>
            <li>Tailwind CSS - For styling</li>
            <li>Shadcn UI - For UI components</li>
            <li>qrandom.io API - For truly random card shuffling</li>
          </ul>
        </Card>

        <Card className="bg-green-900/70 border-green-800 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            About the qrandom.io API
          </h2>
          <p className="text-white/90 mb-6">
            This game uses the qrandom.io API to get truly random shuffled decks
            of cards. The API provides quantum-generated randomness, ensuring
            fair and unpredictable gameplay.
          </p>

          <h3 className="text-xl font-bold text-white mb-2">
            API Endpoints Used
          </h3>
          <div className="bg-green-950/80 p-4 rounded mb-6 font-mono text-sm text-white/90">
            <p className="mb-2">GET /api/random/deck</p>
            <p className="pl-4 text-yellow-300">Shuffle a deck of cards</p>

            <p className="mt-4 mb-2">GET /api/random/deck/:resultId/show</p>
            <p className="pl-4 text-yellow-300">
              Get a specific card from the deck
            </p>

            <p className="mt-4 mb-2">GET /api/random/deck/:resultId/all</p>
            <p className="pl-4 text-yellow-300">
              Get all cards from the shuffled deck
            </p>
          </div>

          <div className="flex justify-center">
            <Link href="/game" passHref legacyBehavior>
              <a className="relative z-50">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4">
                  Play Now
                </Button>
              </a>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
