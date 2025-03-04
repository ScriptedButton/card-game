"use server";

import { auth } from "@/app/auth";
import ClientGamePage from "./ClientGamePage";
import ServerGoogleButton from "@/components/ServerGoogleButton";
import GuestNamePrompt from "@/components/GuestNamePrompt";
import { BlackjackProvider } from "@/lib/context/BlackjackContext";

export default async function GamePage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string; name?: string }>;
}) {
  const session = await auth();
  const user = session?.user;
  console.log("User:", user);
  const { guest, name } = await searchParams;
  const isGuest = guest === "true";

  // Guest access - prompt for name if no name is provided
  if (isGuest && !user && !name) {
    return <GuestNamePrompt />;
  }

  // Require login if not a guest and not logged in
  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black flex items-center justify-center p-4">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to play</h1>
          <ServerGoogleButton />
        </div>
      </div>
    );
  }

  // For guest with a name in the URL, or for logged-in users
  let playerName = "Guest";

  if (user) {
    // Use the user's name from their Google account
    playerName = user.name || "Player";
  } else if (name) {
    // Use the name provided by the guest
    playerName = decodeURIComponent(name);
  }

  // Render the game with appropriate context providers
  return (
    <div>
      <BlackjackProvider
        userId={isGuest || !user?.email ? undefined : user.email}
        isGuest={isGuest}
      >
        <ClientGamePage
          userId={isGuest || !user?.email ? undefined : user.email}
          isGuest={isGuest}
          initialPlayerName={playerName}
        />
      </BlackjackProvider>
    </div>
  );
}
