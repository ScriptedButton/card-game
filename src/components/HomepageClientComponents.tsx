"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

// Client-side only component for animations
export function AnimatedBackground() {
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

// Client component for Google Sign In button
export function GoogleSignInButton() {
  return (
    <Button
      onClick={() => signIn("google", { callbackUrl: "/game" })}
      className="premium-button bg-white hover:bg-gray-50 text-gray-700 font-medium px-8 py-6 text-lg flex items-center gap-3 shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
    >
      <div className="relative w-6 h-6">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      </div>
      Sign in with Google
    </Button>
  );
}
