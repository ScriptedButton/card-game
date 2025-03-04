import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "leaderboard.json");

// Ensure the data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load leaderboard data from file
async function loadLeaderboardData(): Promise<LeaderboardEntry[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(dataFilePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save leaderboard data to file
async function saveLeaderboardData(data: LeaderboardEntry[]) {
  await ensureDataDir();
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
}

interface LeaderboardEntry {
  playerName: string;
  score: number;
  gamesPlayed: number;
  highestWin: number;
  timestamp: number;
}

export async function GET() {
  const leaderboardData = await loadLeaderboardData();
  return NextResponse.json(leaderboardData);
}

export async function POST(request: Request) {
  try {
    const entry: LeaderboardEntry = await request.json();
    let leaderboardData = await loadLeaderboardData();

    // Validate the entry
    if (!entry.playerName || typeof entry.score !== "number") {
      return NextResponse.json(
        { error: "Invalid entry data" },
        { status: 400 }
      );
    }

    // Add timestamp
    entry.timestamp = Date.now();

    // Update existing entry or add new one
    const existingEntryIndex = leaderboardData.findIndex(
      (e: LeaderboardEntry) => e.playerName === entry.playerName
    );

    if (existingEntryIndex !== -1) {
      const existingEntry = leaderboardData[existingEntryIndex];
      leaderboardData[existingEntryIndex] = {
        ...entry,
        score: Math.max(existingEntry.score, entry.score),
        gamesPlayed: (existingEntry.gamesPlayed || 0) + 1,
        highestWin: Math.max(
          existingEntry.highestWin || 0,
          entry.highestWin || 0
        ),
      };
    } else {
      leaderboardData.push({
        ...entry,
        gamesPlayed: 1,
      });
    }

    // Sort by score in descending order
    leaderboardData.sort((a, b) => b.score - a.score);

    // Keep only top 100 entries
    leaderboardData = leaderboardData.slice(0, 100);

    // Save the updated data
    await saveLeaderboardData(leaderboardData);

    return NextResponse.json(leaderboardData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process leaderboard entry: ${errorMessage}` },
      { status: 500 }
    );
  }
}
