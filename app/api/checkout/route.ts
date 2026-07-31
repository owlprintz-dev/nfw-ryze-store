import { NextResponse } from "next/server";

const SQUARE_VERSION = "2026-07-15";
const garmentPrices: Record<string, number> = { "T-Shirt": 2500, "Dry-Fit": 3000, Crewneck: 4000, Hoodie: 5000 };
const apparelIds = new Set([
  "lime-team", "classic-gray", "keep-ryzing", "grind-pink", "ryze-club", "every-point",
  "grind-lime", "graffiti", "starburst", "retro", "electric", "parent", "color-rush",
  "sunrise", "bold", "shine", "earned", "letsgo", "nfw-classic",
]);
const accessoryPrices: Record<string, number> = {
  "bag-pink": 1200, "bag-navy": 1200, "bag-green": 1200, keychain: 800,
  "tumbler-pink": 2500, "tumbler-steel": 2500, "sticker-player": 600,
  "sticker-logo": 500, "parent-package": 8999, "custom-fan": 4500, "custom-mom": 4500,
};

type Customer = { name?: string; email?: string; phone?: string };
type OrderItem = {
  productId?: string; garment?: string; customized?: boolean; name?: string; detail?: string;
  size?: string; color?: string; playerName?: string; playerNumber?: string; fileName?: string;
};

function clean(value?: string, max = 180) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}

function priceItem(item: OrderItem) {
  if (!item.productId) throw new Error("Invalid item.");
  if (apparelIds.has(item.productId)) {
    const base = item.garment ? garmentPrices[item.garment] : undefined;
    if (!base) throw new Error("Invalid apparel option.");
    return base + (item.customized ? 800 : 0);
  }
  const base = accessoryPrices[item.productId];
  if (!base) throw new Error("Invalid store item.");
  return base + (item.productId.startsWith("bag-") && item.customized ? 500 : 0);
}

function itemNote(item: OrderItem) {
  return [
    item.garment && `Garment: ${clean(item.garment)}`,
    item.size && `Size: ${clean(item.size)}`,
    item.color && `Color: ${clean(item.color)}`,
    item.customized ? "Customized: Yes" : "Customized: No",
    item.playerName && `Player: ${clean(item.playerName)}`,
    item.playerNumber && `Number: ${clean(item.playerNumber)}`,
    item.fileName && `Upload: ${clean(item.fileName)}`,
    item.detail && `Selections: ${clean(item.detail, 300)}`,
  ].filter(Boolean).join(" | ").slice(0, 500);
}

export async function POST(request: Request) {
  try {
    const token = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    if (!token || !locationId) {
      return NextResponse.json({ error: "Square checkout is not configured." }, { status: 503 });
    }

    const body = await request.json() as { items?: OrderItem[]; customer?: Customer };
    const customer = body.customer || {};
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
      return NextResponse.json({ error: "Your order is incomplete." }, { status: 400 });
    }
    if (!clean(customer.name) || !clean(customer.email) || !clean(customer.phone)) {
      return NextResponse.json({ error: "Please enter your name, email, and phone number." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const response = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": SQUARE_VERSION,
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        description: `NFW Ryze order for ${clean(customer.name)}`,
        order: {
          location_id: locationId,
          reference_id: `NFW-${Date.now()}`,
          line_items: body.items.map((item) => ({
            name: clean(item.name) || clean(item.productId) || "NFW Ryze item",
            variation_name: clean(item.garment) || "Standard",
            quantity: "1",
            base_price_money: { amount: priceItem(item), currency: "USD" },
            note: itemNote(item),
          })),
          taxes: [{ name: "Texas Sales Tax", percentage: "8.25", scope: "ORDER" }],
        },
        checkout_options: {
          redirect_url: `${origin}/thank-you`,
          merchant_support_email: "owlprintz@gmail.com",
          ask_for_shipping_address: false,
          allow_tipping: false,
        },
        pre_populated_data: { buyer_email: clean(customer.email) },
        payment_note: `NFW Ryze order for ${clean(customer.name)} · ${clean(customer.phone)}`,
      }),
    });

    const result = await response.json();
    const paymentLink = result.payment_link;
    if (!response.ok || !paymentLink?.url) {
      return NextResponse.json(
        { error: result?.errors?.[0]?.detail || "Square could not create the secure checkout page." },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json({ checkoutUrl: paymentLink.url, orderId: paymentLink.order_id, paymentLinkId: paymentLink.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Square checkout could not be started." },
      { status: 400 },
    );
  }
}
