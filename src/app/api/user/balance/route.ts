import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// Get user balance
export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session?.user?.id;

    console.log("Fetching balance for user:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user's game stats
    const userStats = await prisma.gameStats.findUnique({
      where: { userId: userId },
    });

    console.log("Found user stats:", userStats ? "Yes" : "No");

    // If no stats found, create a default entry with 1000 balance
    if (!userStats) {
      console.log("Creating new user stats with default balance");
      const newStats = await prisma.gameStats.create({
        data: {
          userId: userId,
          balance: 1000,
          gamesPlayed: 0,
          highestWin: 0,
        },
      });

      return NextResponse.json({
        balance: newStats.balance,
        highestWin: newStats.highestWin,
        gamesPlayed: newStats.gamesPlayed,
      });
    }

    // Return user's balance and stats
    console.log("Returning user balance:", userStats.balance);
    return NextResponse.json({
      balance: userStats.balance,
      highestWin: userStats.highestWin,
      gamesPlayed: userStats.gamesPlayed,
    });
  } catch (error) {
    console.error("Failed to fetch user balance:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user balance",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Update user balance
export async function POST(request: Request) {
  try {
    const session = await auth();

    console.log(
      "Updating balance. Session user:",
      session?.user?.id ? "Authenticated" : "Not authenticated"
    );

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { balance } = data;

    console.log(
      "Updating balance for user:",
      session.user.id,
      "New balance:",
      balance
    );

    if (typeof balance !== "number") {
      return NextResponse.json(
        { error: "Balance must be a number" },
        { status: 400 }
      );
    }

    // Update user's balance
    const updatedStats = await prisma.gameStats.upsert({
      where: { userId: session.user.id },
      update: { balance },
      create: {
        userId: session.user.id,
        balance,
        gamesPlayed: 0,
        highestWin: 0,
      },
    });

    console.log("Balance updated successfully:", updatedStats.balance);

    return NextResponse.json({
      balance: updatedStats.balance,
      highestWin: updatedStats.highestWin,
      gamesPlayed: updatedStats.gamesPlayed,
    });
  } catch (error) {
    console.error("Failed to update user balance:", error);
    return NextResponse.json(
      {
        error: "Failed to update user balance",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
