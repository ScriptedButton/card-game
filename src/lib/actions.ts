"use server";

import { signIn, signOut } from "@/app/auth";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function googleSignIn() {
  return signIn("google", { callbackUrl: "/game" });
}

export async function userSignOut() {
  return signOut({ redirectTo: "/" });
}

/**
 * Update the leaderboard with game results
 */
export async function updateLeaderboard(data: {
  playerName: string;
  score: number;
  highestWin: number;
  result: string;
  currentBet: number;
  payout: number;
  playerCards: string[];
  dealerCards: string[];
}) {
  try {
    console.log("Server action: Updating leaderboard");
    const session = await auth();

    // Guest users don't update the leaderboard
    if (!session?.user?.email) {
      console.log("No authenticated user email, skipping leaderboard update");
      return { success: false, error: "Not authenticated" };
    }

    const userEmail = session.user.email;
    console.log(`Looking up user by email: ${userEmail}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.error(`No user found with email ${userEmail}`);
      return {
        success: false,
        error: "User not found in database",
      };
    }

    const userId = user.id;
    console.log(`Found user with ID: ${userId}, updating leaderboard`);

    console.log("Updating leaderboard with data:", {
      balance: data.score,
      highestWin: data.highestWin,
      result: data.result,
    });

    // Update or create game stats for the user
    const updatedStats = await prisma.gameStats.upsert({
      where: {
        userId: userId,
      },
      create: {
        userId: userId,
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
                where: { userId: userId },
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
          userId: userId,
          result: data.result,
          bet: data.currentBet || 0,
          payout: data.payout || 0,
          playerCards: data.playerCards || [],
          dealerCards: data.dealerCards || [],
        },
      });
      console.log("Game history created");
    }

    // Revalidate the path to update the UI
    revalidatePath("/game");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error updating leaderboard:", error);

    // Detailed error logging
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2003") {
        console.error(
          "Foreign key constraint error - user likely doesn't exist in database"
        );
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Define return types for our functions
type BalanceResponse = {
  success: boolean;
  balance: number;
  highestWin?: number;
  gamesPlayed?: number;
  error?: string;
};

/**
 * Get user balance from the database
 */
export async function getUserBalance(
  userId?: string
): Promise<BalanceResponse> {
  try {
    console.log("Server action: Getting user balance");
    const session = await auth();

    // For explicitly provided userId or email
    if (userId) {
      console.log(`Using provided identifier: ${userId}`);

      // Determine if we're dealing with an email or ID
      let actualUserId = userId;

      // If it looks like an email, look up the user by email first
      if (userId.includes("@")) {
        console.log(`Looking up user by email: ${userId}`);
        const user = await prisma.user.findUnique({
          where: { email: userId },
        });

        if (user) {
          actualUserId = user.id;
          console.log(`Found user with ID: ${actualUserId}`);
        } else {
          console.log(`No user found with email: ${userId}`);
          return {
            success: false,
            error: "User not found",
            balance: 1000, // Default balance even on error
          };
        }
      }

      // Now get the user stats with the actual user ID
      const userStats = await prisma.gameStats.findUnique({
        where: { userId: actualUserId },
      });

      if (userStats) {
        return {
          success: true,
          balance: userStats.balance,
          highestWin: userStats.highestWin,
          gamesPlayed: userStats.gamesPlayed,
        };
      } else {
        console.log(`No game stats found for user ID: ${actualUserId}`);
        return {
          success: true,
          balance: 1000, // Default balance
          highestWin: 0,
          gamesPlayed: 0,
        };
      }
    }

    // Use session user if available and no userId provided
    if (session?.user) {
      const sessionUserId = session.user.id;
      console.log(`Using session user ID: ${sessionUserId}`);
      const userStats = await prisma.gameStats.findUnique({
        where: { userId: sessionUserId },
      });

      if (userStats) {
        return {
          success: true,
          balance: userStats.balance,
          highestWin: userStats.highestWin,
          gamesPlayed: userStats.gamesPlayed,
        };
      } else {
        // No stats yet, return default
        return {
          success: true,
          balance: 1000, // Default balance
          highestWin: 0,
          gamesPlayed: 0,
        };
      }
    }

    // Guest user or no session, return default balance
    return {
      success: true,
      balance: 1000,
      highestWin: 0,
      gamesPlayed: 0,
    };
  } catch (error) {
    console.error("Error getting user balance:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      balance: 1000, // Default balance even on error
    };
  }
}

/**
 * Update user balance in the database
 */
export async function updateUserBalance(
  userId: string,
  balance: number
): Promise<BalanceResponse> {
  try {
    console.log(`Server action: Updating user balance for user ${userId}`);

    if (typeof balance !== "number") {
      return {
        success: false,
        error: "Balance must be a number",
        balance: 1000, // Default balance on error
      };
    }

    // Check for the user in the database - convert userId (which might be an email) to a database ID
    let dbUser;

    // Check if userId looks like an email
    if (userId.includes("@")) {
      // Find user by email
      dbUser = await prisma.user.findUnique({
        where: { email: userId },
      });
      console.log(`Looking up user by email: ${userId}`);
    } else {
      // Find user by ID
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      console.log(`Looking up user by ID: ${userId}`);
    }

    if (!dbUser) {
      console.error(
        `User with identifier ${userId} does not exist in the database`
      );
      return {
        success: false,
        error:
          "User not found in database. Cannot update balance for non-existent user.",
        balance: 1000, // Default balance on error
      };
    }

    const actualUserId = dbUser.id;
    console.log(`Found user in database with ID: ${actualUserId}`);

    // Now check if user already has GameStats
    const existingStats = await prisma.gameStats.findUnique({
      where: { userId: actualUserId },
    });

    let updatedStats;
    if (existingStats) {
      // Update existing stats
      updatedStats = await prisma.gameStats.update({
        where: { userId: actualUserId },
        data: { balance },
      });
    } else {
      // Create new stats
      console.log("No existing game stats found, creating new entry");
      try {
        updatedStats = await prisma.gameStats.create({
          data: {
            userId: actualUserId,
            balance,
            gamesPlayed: 0,
            highestWin: 0,
          },
        });
      } catch (createError) {
        console.error("Failed to create game stats:", createError);
        // Handle race condition
        if (
          createError &&
          typeof createError === "object" &&
          "code" in createError
        ) {
          if (createError.code === "P2002") {
            console.log(
              "Stats created by another process, fetching current stats"
            );
            const currentStats = await prisma.gameStats.findUnique({
              where: { userId: actualUserId },
            });

            if (currentStats) {
              updatedStats = await prisma.gameStats.update({
                where: { userId: actualUserId },
                data: { balance },
              });
            } else {
              throw new Error(
                "Failed to retrieve or update stats after creation attempt"
              );
            }
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      }
    }

    console.log("Balance updated successfully:", updatedStats.balance);

    // Revalidate the path to update the UI
    revalidatePath("/game");

    return {
      success: true,
      balance: updatedStats.balance,
      highestWin: updatedStats.highestWin,
      gamesPlayed: updatedStats.gamesPlayed,
    };
  } catch (error) {
    console.error("Error updating user balance:", error);

    // Detailed error logging
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2003") {
        console.error(
          "Foreign key constraint error - user likely doesn't exist in database"
        );
      } else if (error.code === "P2025") {
        console.error(
          "Record not found - the user or stats record doesn't exist"
        );
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      balance: 1000, // Default balance on error
      highestWin: 0,
      gamesPlayed: 0,
    };
  }
}

// Define the type for a leaderboard entry returned from prisma
type GameStatsWithUser = Awaited<
  ReturnType<typeof prisma.gameStats.findFirst>
> & {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

/**
 * Get leaderboard data
 */
export async function getLeaderboard() {
  try {
    console.log("Server action: Getting leaderboard data");

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
            email: true,
            image: true,
          },
        },
      },
    });

    console.log(`Found ${leaderboardData.length} leaderboard entries`);

    // Transform the data to match the expected format
    const formattedData = leaderboardData.map((entry: GameStatsWithUser) => ({
      playerName:
        entry.user?.name || entry.user?.email?.split("@")[0] || "Anonymous",
      score: entry.balance, // Use balance as the main score
      gamesPlayed: entry.gamesPlayed,
      highestWin: entry.highestWin,
      timestamp: entry.updatedAt.getTime(),
      image: entry.user?.image,
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: [],
    };
  }
}
