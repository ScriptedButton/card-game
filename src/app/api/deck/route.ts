import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://qrandom.io/api";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const decks = searchParams.get("decks") || "1";
    const cards = searchParams.get("cards");

    // Construct the API URL
    let apiUrl = `${API_BASE_URL}/random/deck?decks=${decks}`;
    if (cards) {
      apiUrl += `&cards=${cards}`;
    }

    console.log("Fetching from API:", apiUrl);

    // Make the request to the external API
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache: 'no-store' to avoid caching in the browser
      cache: "no-store",
    });

    // Check if the request was successful
    if (!response.ok) {
      console.error(
        "Error from qrandom.io API:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: `Failed to fetch shuffled deck: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Return the data from the external API
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/deck route:", error);
    return NextResponse.json(
      { error: "Failed to fetch shuffled deck" },
      { status: 500 }
    );
  }
}
