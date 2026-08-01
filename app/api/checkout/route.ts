import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SQUARE_VERSION = "2026-07-15";
const PERSONALIZED_TUMBLER_NAME = "NFW Ryze Personalized Tumbler";
const PERSONALIZED_TUMBLER_COLORS = new Set(["Navy", "White"]);
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
type SupabaseApparel = { prices: Record<string, number>; personalization: boolean };
type SupabaseProducts = { apparel: Map<string, SupabaseApparel>; personalizedTumblerIds: Set<string> };

function clean(value?: string, max = 180) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}

function priceItem(item: OrderItem, supabaseProducts: SupabaseProducts) {
  if (!item.productId) throw new Error("Invalid item.");
  if (apparelIds.has(item.productId)) {
    const base = item.garment ? garmentPrices[item.garment] : undefined;
    if (!base) throw new Error("Invalid apparel option.");
    return base + (item.customized ? 800 : 0);
  }
  const databaseProduct = supabaseProducts.apparel.get(item.productId);
  if (databaseProduct) {
    const base = item.garment ? databaseProduct.prices[item.garment] : undefined;
    if (!base || (item.customized && !databaseProduct.personalization)) {
      throw new Error("Invalid apparel option.");
    }
    return base + (item.customized ? 800 : 0);
  }
  if (supabaseProducts.personalizedTumblerIds.has(item.productId)) {
    if (!item.color || !PERSONALIZED_TUMBLER_COLORS.has(item.color) || item.garment || item.size) {
      throw new Error("Invalid tumbler option.");
    }
    if (item.customized && (!clean(item.playerName) || !clean(item.playerNumber))) {
      throw new Error("Tumbler personalization is incomplete.");
    }
    return 2500 + (item.customized ? 500 : 0);
  }
  const base = accessoryPrices[item.productId];
  if (!base) throw new Error("Invalid store item.");
  return base + (item.productId.startsWith("bag-") && item.customized ? 500 : 0);
}

async function getSupabaseProducts(): Promise<SupabaseProducts> {
  const products: SupabaseProducts = { apparel: new Map(), personalizedTumblerIds: new Set() };
  const usedIds = new Set([...apparelIds, ...Object.keys(accessoryPrices)]);
  const { data, error } = await supabase
    .from("products")
    .select("id,name,price,category,active,personalization,tshirt_price,dryfit_price,crewneck_price,hoodie_price")
    .eq("active", true);
  if (error || !data) return products;

  data.forEach((row) => {
    const id = String(row.id ?? "").trim();
    if (!id || usedIds.has(id)) return;
    const category = String(row.category || "").toLowerCase();
    if (category === "personalized" && String(row.name || "").trim() === PERSONALIZED_TUMBLER_NAME) {
      products.personalizedTumblerIds.add(id);
      usedIds.add(id);
      return;
    }
    if (category !== "apparel") return;

    const fallbackPrice = Number(row.price);
    const cents = (value: unknown, fallback: number) => {
      const amount = Number(value);
      const dollars = Number.isFinite(amount) && amount > 0
        ? amount
        : Number.isFinite(fallbackPrice) && fallbackPrice > 0 ? fallbackPrice : fallback;
      return Math.round(dollars * 100);
    };
    products.apparel.set(id, {
      personalization: row.personalization !== false,
      prices: {
        "T-Shirt": cents(row.tshirt_price, 25),
        "Dry-Fit": cents(row.dryfit_price, 30),
        Crewneck: cents(row.crewneck_price, 40),
        Hoodie: cents(row.hoodie_price, 50),
      },
    });
    usedIds.add(id);
  });

  return products;
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
    const supabaseProducts = await getSupabaseProducts();

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
            variation_name: clean(item.garment) || clean(item.color) || "Standard",
            quantity: "1",
            base_price_money: { amount: priceItem(item, supabaseProducts), currency: "USD" },
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
