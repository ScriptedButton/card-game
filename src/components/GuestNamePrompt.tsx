"use client";

import PlayerNameInput from "@/components/PlayerNameInput";
import ServerGoogleButton from "@/components/ServerGoogleButton";
import { useRouter } from "next/navigation";

export default function GuestNamePrompt() {
  const router = useRouter();

  const handleNameSubmit = (name: string) => {
    router.push(`/game?guest=true&name=${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center p-4">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome, Guest Player</h1>
        <div className="max-w-md mx-auto">
          <PlayerNameInput onSubmit={handleNameSubmit} initialValue="" />
        </div>
        <div className="mt-8 text-white/60 text-sm">
          <p>Playing as a guest. Your progress won&apos;t be saved.</p>
          <p className="mt-2">Want to save your progress?</p>
          <div className="mt-4">
            <ServerGoogleButton />
          </div>
        </div>
      </div>
    </div>
  );
}
