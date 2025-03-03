import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://qrandom.io/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { resultId: string } }
) {
  try {
    const resultId = params.resultId;
    const apiUrl = `${API_BASE_URL}/random/deck/${resultId}/all`;

    console.log("Fetching from API:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Error from qrandom.io API:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: `Failed to fetch all cards: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/deck/[resultId]/all route:", error);
    return NextResponse.json(
      { error: "Failed to fetch all cards" },
      { status: 500 }
    );
  }
}
