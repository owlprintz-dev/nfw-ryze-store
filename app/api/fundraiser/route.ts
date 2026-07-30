import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
  if (!token || !locationId) return NextResponse.json({ raised: 0 });
  try {
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
      }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ raised: 0 });
    const data = await response.json();
    const cents = (data.orders || []).reduce((orderSum: number, order: any) =>
      orderSum + (order.line_items || []).reduce((lineSum: number, line: any) =>
        lineSum + (String(line.note || "").includes("FUNDRAISER_APPAREL") ? Number(line.gross_sales_money?.amount || line.base_price_money?.amount || 0) : 0), 0), 0);
    return NextResponse.json({ raised: cents / 100 });
  } catch {
    return NextResponse.json({ raised: 0 });
  }
}
