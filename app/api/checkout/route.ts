import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SQUARE_VERSION = "2026-07-15";

const PERSONALIZED_TUMBLER_NAME =
  "NFW Ryze Personalized Tumbler";

const PERSONALIZED_TUMBLER_COLORS = new Set([
  "Navy",
  "White",
]);

const garmentPrices: Record<string, number> = {
  "T-Shirt": 2500,
  "Dry-Fit": 3000,
  Crewneck: 4000,
  Hoodie: 5000,
};

const fundraiserContributions: Record<string, number> = {
  "T-Shirt": 300,
  "Dry-Fit": 300,
  Crewneck: 500,
  Hoodie: 700,
};

const apparelIds = new Set([
  "lime-team",
  "classic-gray",
  "keep-ryzing",
  "grind-pink",
  "ryze-club",
  "every-point",
  "grind-lime",
  "graffiti",
  "starburst",
  "retro",
  "electric",
  "parent",
  "color-rush",
  "sunrise",
  "bold",
  "shine",
  "earned",
  "letsgo",
  "nfw-classic",
]);

const accessoryPrices: Record<string, number> = {
  "bag-pink": 1200,
  "bag-navy": 1200,
  "bag-green": 1200,
  keychain: 800,
  "tumbler-pink": 2500,
  "tumbler-steel": 2500,
  "sticker-player": 600,
  "sticker-logo": 500,
  "parent-package": 8999,
  "custom-fan": 4500,
  "custom-mom": 4500,
};

type Customer = {
  name?: string;
  email?: string;
  phone?: string;
};

type OrderItem = {
  productId?: string;
  garment?: string;
  customized?: boolean;
  name?: string;
  detail?: string;
  size?: string;
  color?: string;
  playerName?: string;
  playerNumber?: string;
  fileName?: string;
};

type SupabaseApparel = {
  prices: Record<string, number>;
  personalization: boolean;
};

type SupabaseProducts = {
  apparel: Map<string, SupabaseApparel>;
  personalizedTumblerIds: Set<string>;
};

type ProductRow = {
  id?: unknown;
  name?: unknown;
  price?: unknown;
  category?: unknown;
  active?: unknown;
  personalization?: unknown;
  tshirt_price?: unknown;
  dryfit_price?: unknown;
  crewneck_price?: unknown;
  hoodie_price?: unknown;
};

function clean(value?: string, max = 180): string {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

function createEmptyProductCollection(): SupabaseProducts {
  return {
    apparel: new Map<string, SupabaseApparel>(),
    personalizedTumblerIds: new Set<string>(),
  };
}

function priceItem(
  item: OrderItem,
  supabaseProducts: SupabaseProducts,
): number {
  if (!item.productId) {
    throw new Error("Invalid item.");
  }

  if (apparelIds.has(item.productId)) {
    const basePrice = item.garment
      ? garmentPrices[item.garment]
      : undefined;

    if (!basePrice) {
      throw new Error("Invalid apparel option.");
    }

    return basePrice + (item.customized ? 800 : 0);
  }

  const databaseProduct =
    supabaseProducts.apparel.get(item.productId);

  if (databaseProduct) {
    const basePrice = item.garment
      ? databaseProduct.prices[item.garment]
      : undefined;

    if (!basePrice) {
      throw new Error("Invalid apparel option.");
    }

    if (
      item.customized &&
      !databaseProduct.personalization
    ) {
      throw new Error(
        "Personalization is not available for this product.",
      );
    }

    return basePrice + (item.customized ? 800 : 0);
  }

  if (
    supabaseProducts.personalizedTumblerIds.has(
      item.productId,
    )
  ) {
    if (
      !item.color ||
      !PERSONALIZED_TUMBLER_COLORS.has(item.color) ||
      item.garment ||
      item.size
    ) {
      throw new Error("Invalid tumbler option.");
    }

    if (
      item.customized &&
      (!clean(item.playerName) ||
        !clean(item.playerNumber))
    ) {
      throw new Error(
        "Tumbler personalization is incomplete.",
      );
    }

    return 2500 + (item.customized ? 500 : 0);
  }

  const accessoryPrice =
    accessoryPrices[item.productId];

  if (!accessoryPrice) {
    throw new Error("Invalid store item.");
  }

  const bagPersonalization =
    item.productId.startsWith("bag-") &&
    item.customized
      ? 500
      : 0;

  return accessoryPrice + bagPersonalization;
}

function fundraiserContribution(
  item: OrderItem,
  supabaseProducts: SupabaseProducts,
): number {
  if (!item.productId || !item.garment) {
    return 0;
  }

  const isApparel =
    apparelIds.has(item.productId) ||
    supabaseProducts.apparel.has(item.productId);

  if (!isApparel) {
    return 0;
  }

  return fundraiserContributions[item.garment] || 0;
}

async function getSupabaseProducts(): Promise<SupabaseProducts> {
  const products = createEmptyProductCollection();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Supabase environment variables are missing.",
    );

    return products;
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
  );

  const usedIds = new Set([
    ...apparelIds,
    ...Object.keys(accessoryPrices),
  ]);

  const query = await supabase
    .from("products")
    .select(
      "id,name,price,category,active,personalization,tshirt_price,dryfit_price,crewneck_price,hoodie_price",
    )
    .eq("active", true);

  if (query.error) {
    console.error(
      "Could not load Supabase products:",
      query.error.message,
    );

    return products;
  }

  if (!Array.isArray(query.data)) {
    return products;
  }

  const rows =
    query.data as unknown as ProductRow[];

  for (const row of rows) {
    const id = String(row.id ?? "").trim();

    if (!id || usedIds.has(id)) {
      continue;
    }

    const name = String(row.name ?? "").trim();

    const category = String(
      row.category ?? "",
    )
      .trim()
      .toLowerCase();

    if (
      category === "personalized" &&
      name === PERSONALIZED_TUMBLER_NAME
    ) {
      products.personalizedTumblerIds.add(id);
      usedIds.add(id);
      continue;
    }

    if (category !== "apparel") {
      continue;
    }

    const fallbackPrice = Number(row.price);

    const convertToCents = (
      value: unknown,
      defaultDollars: number,
    ): number => {
      const amount = Number(value);

      if (Number.isFinite(amount) && amount > 0) {
        return Math.round(amount * 100);
      }

      if (
        Number.isFinite(fallbackPrice) &&
        fallbackPrice > 0
      ) {
        return Math.round(fallbackPrice * 100);
      }

      return Math.round(defaultDollars * 100);
    };

    products.apparel.set(id, {
      personalization:
        row.personalization !== false,
      prices: {
        "T-Shirt": convertToCents(
          row.tshirt_price,
          25,
        ),
        "Dry-Fit": convertToCents(
          row.dryfit_price,
          30,
        ),
        Crewneck: convertToCents(
          row.crewneck_price,
          40,
        ),
        Hoodie: convertToCents(
          row.hoodie_price,
          50,
        ),
      },
    });

    usedIds.add(id);
  }

  return products;
}

function itemNote(
  item: OrderItem,
  fundraiserCents: number,
): string {
  return [
    fundraiserCents > 0
      ? `FUNDRAISER_CONTRIBUTION_CENTS=${fundraiserCents}`
      : "",
    item.garment
      ? `Garment: ${clean(item.garment)}`
      : "",
    item.size
      ? `Size: ${clean(item.size)}`
      : "",
    item.color
      ? `Color: ${clean(item.color)}`
      : "",
    item.customized
      ? "Customized: Yes"
      : "Customized: No",
    item.playerName
      ? `Player: ${clean(item.playerName)}`
      : "",
    item.playerNumber
      ? `Number: ${clean(item.playerNumber)}`
      : "",
    item.fileName
      ? `Upload: ${clean(item.fileName)}`
      : "",
    item.detail
      ? `Selections: ${clean(item.detail, 300)}`
      : "",
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 500);
}

export async function POST(request: Request) {
  try {
    const squareAccessToken =
      process.env.SQUARE_ACCESS_TOKEN;

    const squareLocationId =
      process.env.SQUARE_LOCATION_ID ||
      process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

    if (
      !squareAccessToken ||
      !squareLocationId
    ) {
      return NextResponse.json(
        {
          error:
            "Square checkout is not configured.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      items?: OrderItem[];
      customer?: Customer;
    };

    const customer = body.customer || {};

    if (
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 50
    ) {
      return NextResponse.json(
        {
          error: "Your order is incomplete.",
        },
        { status: 400 },
      );
    }

    if (
      !clean(customer.name) ||
      !clean(customer.email) ||
      !clean(customer.phone)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter your name, email, and phone number.",
        },
        { status: 400 },
      );
    }

    const supabaseProducts =
      await getSupabaseProducts();

    const origin = new URL(request.url).origin;

    const squareResponse = await fetch(
      "https://connect.squareup.com/v2/online-checkout/payment-links",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${squareAccessToken}`,
          "Content-Type": "application/json",
          "Square-Version": SQUARE_VERSION,
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),

          description: `NFW Ryze order for ${clean(
            customer.name,
          )}`,

          order: {
            location_id: squareLocationId,

            reference_id: `NFW-${Date.now()}`,

            line_items: body.items.map((item) => {
              const fundraiserCents =
                fundraiserContribution(
                  item,
                  supabaseProducts,
                );

              return {
                name:
                  clean(item.name) ||
                  clean(item.productId) ||
                  "NFW Ryze item",

                variation_name:
                  clean(item.garment) ||
                  clean(item.color) ||
                  "Standard",

                quantity: "1",

                base_price_money: {
                  amount: priceItem(
                    item,
                    supabaseProducts,
                  ),
                  currency: "USD",
                },

                note: itemNote(
                  item,
                  fundraiserCents,
                ),
              };
            }),

            taxes: [
              {
                name: "Texas Sales Tax",
                percentage: "8.25",
                scope: "ORDER",
              },
            ],
          },

          checkout_options: {
            redirect_url: `${origin}/thank-you`,
            merchant_support_email:
              "owlprintz@gmail.com",
            ask_for_shipping_address: false,
            allow_tipping: false,
          },

          pre_populated_data: {
            buyer_email: clean(customer.email),
          },

          payment_note: `NFW Ryze order for ${clean(
            customer.name,
          )} · ${clean(customer.phone)}`,
        }),
      },
    );

    const squareResult =
      (await squareResponse.json()) as {
        payment_link?: {
          id?: string;
          order_id?: string;
          url?: string;
        };
        errors?: Array<{
          detail?: string;
        }>;
      };

    const paymentLink =
      squareResult.payment_link;

    if (
      !squareResponse.ok ||
      !paymentLink?.url
    ) {
      return NextResponse.json(
        {
          error:
            squareResult.errors?.[0]?.detail ||
            "Square could not create the secure checkout page.",
        },
        {
          status:
            squareResponse.status || 400,
        },
      );
    }

    return NextResponse.json({
      checkoutUrl: paymentLink.url,
      orderId: paymentLink.order_id,
      paymentLinkId: paymentLink.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Square checkout could not be started.",
      },
      { status: 400 },
    );
  }
}