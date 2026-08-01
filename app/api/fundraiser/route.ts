import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const legacyFundraiserContributions: Record<string, number> = {
  "T-Shirt": 300,
  "Dry-Fit": 300,
  Crewneck: 500,
  Hoodie: 700,
};
const validContributionAmounts = new Set(Object.values(legacyFundraiserContributions));

type SquareLineItem = { note?: string; quantity?: string };
type SquareOrder = { line_items?: SquareLineItem[] };
type SquareOrderSearch = { orders?: SquareOrder[]; cursor?: string };

function fundraiserCentsFromNote(note: string) {
  const recorded = note.match(/(?:^|\|\s*)FUNDRAISER_CONTRIBUTION_CENTS=(\d+)(?:\s*\||$)/);
  if (recorded) {
    const cents = Number(recorded[1]);
    return validContributionAmounts.has(cents) ? cents : 0;
  }

  const legacyGarment = note.match(/(?:^|\|\s*)Garment:\s*(T-Shirt|Dry-Fit|Crewneck|Hoodie)(?:\s*\||$)/);
  return legacyGarment ? legacyFundraiserContributions[legacyGarment[1]] : 0;
}

export async function GET() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  if (!token || !locationId) return NextResponse.json({ raised: 0 });
  try {
    let cents = 0;
    let cursor: string | undefined;
    const seenCursors = new Set<string>();

    do {
      const response = await fetch("https://connect.squareup.com/v2/orders/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Square-Version": "2026-07-15",
        },
        body: JSON.stringify({
          location_ids: [locationId],
          query: { filter: { state_filter: { states: ["COMPLETED"] } }, sort: { sort_field: "CLOSED_AT", sort_order: "DESC" } },
          limit: 500,
          ...(cursor ? { cursor } : {}),
        }),
        cache: "no-store",
      });
      if (!response.ok) return NextResponse.json({ raised: 0 });

      const data = await response.json() as SquareOrderSearch;
      cents += (data.orders || []).reduce((orderSum, order) =>
        orderSum + (order.line_items || []).reduce((lineSum, line) => {
          const quantity = Math.max(0, Number.parseInt(String(line.quantity || "1"), 10) || 0);
          return lineSum + fundraiserCentsFromNote(String(line.note || "")) * quantity;
        }, 0), 0);

      const nextCursor = data.cursor?.trim();
      cursor = nextCursor && !seenCursors.has(nextCursor) ? nextCursor : undefined;
      if (cursor) seenCursors.add(cursor);
    } while (cursor);

    return NextResponse.json({ raised: cents / 100 });
  } catch {
    return NextResponse.json({ raised: 0 });
  }
}
