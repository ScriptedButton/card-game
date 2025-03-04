import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

interface LeaderboardEntry {
  playerName: string;
  score: number;
  gamesPlayed: number;
  highestWin: number;
  timestamp: number;
  image?: string | null;
}

type GameStatsWithUser = Awaited<
  ReturnType<typeof prisma.gameStats.findFirst>
> & {
  user: {
    name: string | null;
    image: string | null;
  };
};

export async function GET() {
  try {
    console.log("Fetching leaderboard data...");

    // Get all game stats ordered by balance (current score) instead of highest win
    const leaderboardData = await prisma.gameStats.findMany({
      orderBy: {
        balance: "desc",
      },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    console.log(`Found ${leaderboardData.length} leaderboard entries`);

    // Transform the data to match the expected format
    const formattedData = leaderboardData.map(
      (entry: GameStatsWithUser): LeaderboardEntry => ({
        playerName: entry.user?.name || "Anonymous",
        score: entry.balance, // Use balance as the main score
        gamesPlayed: entry.gamesPlayed,
        highestWin: entry.highestWin,
        timestamp: entry.updatedAt.getTime(),
        image: entry.user?.image,
      })
    );

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    console.log(
      "Updating leaderboard. Session user:",
      session?.user?.id ? "Authenticated" : "Not authenticated"
    );

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    console.log("Received data for leaderboard update:", {
      userId: session.user.id,
      balance: data.score,
      highestWin: data.highestWin,
    });

    // Update or create game stats for the user
    const updatedStats = await prisma.gameStats.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        gamesPlayed: 1,
        highestWin: data.highestWin || 0,
        balance: data.score || 1000, // Set initial balance from data or default
      },
      update: {
        gamesPlayed: {
          increment: 1,
        },
        highestWin: {
          set: Math.max(
            data.highestWin || 0,
            // Use an explicit subquery to get the current value from the database
            (
              await prisma.gameStats.findUnique({
                where: { userId: session.user.id },
                select: { highestWin: true },
              })
            )?.highestWin || 0
          ),
        },
        // Always update the balance to the current value
        balance: data.score,
        // Update totalWins if it's a win
        ...(data.result === "win" ? { totalWins: { increment: 1 } } : {}),
        // Update totalLosses if it's a loss
        ...(data.result === "loss" ? { totalLosses: { increment: 1 } } : {}),
      },
    });

    console.log("Stats updated:", updatedStats);

    // Create game history entry
    if (data.result) {
      await prisma.gameHistory.create({
        data: {
          userId: session.user.id,
          result: data.result,
          bet: data.currentBet || 0,
          payout: data.payout || 0,
          playerCards: data.playerCards || [],
          dealerCards: data.dealerCards || [],
        },
      });
      console.log("Game history created");
    }

    // Get updated leaderboard
    const leaderboardData = await prisma.gameStats.findMany({
      orderBy: {
        balance: "desc", // Order by balance descending
      },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    const formattedData = leaderboardData.map(
      (entry: GameStatsWithUser): LeaderboardEntry => ({
        playerName: entry.user?.name || "Anonymous",
        score: entry.balance, // Use balance instead of highestWin
        gamesPlayed: entry.gamesPlayed,
        highestWin: entry.highestWin,
        timestamp: entry.updatedAt.getTime(),
        image: entry.user?.image,
      })
    );

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Failed to update leaderboard:", error);
    return NextResponse.json(
      {
        error: "Failed to update leaderboard data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
