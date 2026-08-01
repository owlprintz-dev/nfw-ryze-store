import { NextResponse } from "next/server";

const TAX_RATE = 0.0825;
const SQUARE_VERSION = "2026-07-15";
const garmentPrices: Record<string, number> = { "T-Shirt": 2500, "Dry-Fit": 3000, Crewneck: 4000, Hoodie: 5000 };
const fundraiserContributions: Record<string, number> = { "T-Shirt": 300, "Dry-Fit": 300, Crewneck: 500, Hoodie: 700 };
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

function fundraiserContribution(item: OrderItem) {
  if (!item.productId || !apparelIds.has(item.productId)) return 0;
  return item.garment ? fundraiserContributions[item.garment] || 0 : 0;
}

function itemNote(item: OrderItem) {
  const fundraiserCents = fundraiserContribution(item);
  return [
    fundraiserCents > 0 ? `FUNDRAISER_CONTRIBUTION_CENTS=${fundraiserCents}` : "STORE_ITEM",
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character] || character));
}

async function sendEmails(
  orderId: string, customer: Customer, items: OrderItem[], subtotal: number, tax: number, total: number,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from || !customer.email) return false;
  const rows = items.map((item) => `<li><strong>${escapeHtml(clean(item.name) || clean(item.productId) || "Item")}</strong> — ${escapeHtml(itemNote(item))} — $${(priceItem(item) / 100).toFixed(2)}</li>`).join("");
  const html = `<h2>NFW Ryze order ${escapeHtml(orderId)}</h2><p><strong>Customer:</strong> ${escapeHtml(clean(customer.name))}<br><strong>Email:</strong> ${escapeHtml(clean(customer.email))}<br><strong>Phone:</strong> ${escapeHtml(clean(customer.phone))}</p><ul>${rows}</ul><p>Subtotal: $${(subtotal / 100).toFixed(2)}<br>Tax: $${(tax / 100).toFixed(2)}<br><strong>Total: $${(total / 100).toFixed(2)}</strong></p>`;
  const send = (to: string, subject: string) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: "owlprintz@gmail.com", subject, html }),
  });
  const [merchant, customerConfirmation] = await Promise.all([
    send("owlprintz@gmail.com", `New NFW Ryze order ${orderId}`),
    send(clean(customer.email), `Your NFW Ryze order ${orderId}`),
  ]);
  return merchant.ok && customerConfirmation.ok;
}

export async function POST(request: Request) {
  try {
    const token = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    if (!token || !locationId) return NextResponse.json({ error: "Square checkout is not configured." }, { status: 503 });

    const body = await request.json() as { sourceId?: string; items?: OrderItem[]; customer?: Customer };
    const customer = body.customer || {};
    if (!body.sourceId || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
      return NextResponse.json({ error: "Your order is incomplete." }, { status: 400 });
    }
    if (!clean(customer.name) || !clean(customer.email) || !clean(customer.phone)) {
      return NextResponse.json({ error: "Please enter your name, email, and phone number." }, { status: 400 });
    }

    const subtotal = body.items.reduce((sum, item) => sum + priceItem(item), 0);
    const tax = Math.round(subtotal * TAX_RATE);
    const amount = subtotal + tax;
    const fundraiserCredit = body.items.reduce((sum, item) => sum + fundraiserContribution(item), 0);
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Square-Version": SQUARE_VERSION };

    const orderResponse = await fetch("https://connect.squareup.com/v2/orders", {
      method: "POST",
      headers,
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
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
      }),
    });
    const orderResult = await orderResponse.json();
    if (!orderResponse.ok || !orderResult.order?.id) {
      return NextResponse.json({ error: orderResult?.errors?.[0]?.detail || "The itemized order could not be saved." }, { status: orderResponse.status || 400 });
    }
    const orderId = orderResult.order.id as string;

    const squareResponse = await fetch("https://connect.squareup.com/v2/payments", {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_id: body.sourceId,
        idempotency_key: crypto.randomUUID(),
        amount_money: { amount, currency: "USD" },
        location_id: locationId,
        order_id: orderId,
        autocomplete: true,
        buyer_email_address: clean(customer.email),
        note: `NFW Ryze order ${orderId} for ${clean(customer.name)} · ${clean(customer.phone)}`,
      }),
    });
    const result = await squareResponse.json();
    if (!squareResponse.ok) {
      return NextResponse.json({ error: result?.errors?.[0]?.detail || "Square declined the payment. Please try another card." }, { status: squareResponse.status });
    }

    let emailSent = false;
    try { emailSent = await sendEmails(orderId, customer, body.items, subtotal, tax, amount); } catch { /* payment and saved order remain valid */ }
    return NextResponse.json({
      paymentId: result.payment?.id, receiptNumber: result.payment?.receipt_number,
      orderId, amount, tax, fundraiserCredit, emailSent,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment could not be completed." }, { status: 400 });
  }
}
