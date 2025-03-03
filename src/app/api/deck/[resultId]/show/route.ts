import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://qrandom.io/api";

export async function GET(
  request: NextRequest,
  { params }: { params: { resultId: string } }
) {
  try {
    const resultId = params.resultId;
    const searchParams = request.nextUrl.searchParams;
    const at = searchParams.get("at");

    if (!at) {
      return NextResponse.json(
        { error: "Missing card index parameter" },
        { status: 400 }
      );
    }

    const apiUrl = `${API_BASE_URL}/random/deck/${resultId}/show?at=${at}`;

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
        { error: `Failed to fetch card: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/deck/[resultId]/show route:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}
