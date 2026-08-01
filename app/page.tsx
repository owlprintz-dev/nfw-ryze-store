"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Apparel = {
  id: string;
  name: string;
  image: string;
  description?: string;
  personalization?: boolean;
  prices?: Record<string, number>;
  defaultGarment?: string;
  images: Partial<Record<string, string>>;
  colors?: { name: string; image: string; images: Partial<Record<string, string>> }[];
};

type Accessory = {
  id: string;
  name: string;
  price: number;
  image: string;
  customizable?: boolean;
  upload?: boolean;
  badge?: string;
};

const apparel: Apparel[] = [
  { id: "lime-team", name: "Lime Team", image: "/products/model-lime.png", images: { "T-Shirt": "/products/lime-shirt.png", "Dry-Fit": "/products/lime-shirt.png", Crewneck: "/products/lime-crewneck.png", Hoodie: "/products/lime-hoodie.png" } },
  { id: "classic-gray", name: "Classic Gray Ryze", image: "/products/model-gray.png", defaultGarment: "Hoodie", images: { "T-Shirt": "/products/gray-shirt.png", "Dry-Fit": "/products/gray-dryfit.png", Crewneck: "/products/gray-dryfit.png", Hoodie: "/products/gray-hoodie.png" } },
  { id: "keep-ryzing", name: "Keep Ryz-ing", image: "/products/keep-ryzing-display.png", images: { "T-Shirt": "/products/ryzing-shirt.png", "Dry-Fit": "/products/ryzing-dryfit.png", Crewneck: "/products/ryzing-crewneck.png", Hoodie: "/products/ryzing-hoodie.png" } },
  { id: "grind-pink", name: "Ryze & Grind Pink", image: "/products/grind-pink-crewneck.png", defaultGarment: "Crewneck", images: { "T-Shirt": "/products/grind-pink-shirt.png", "Dry-Fit": "/products/grind-pink-shirt.png", Crewneck: "/products/grind-pink-crewneck.png", Hoodie: "/products/grind-pink-hoodie.png" } },
  { id: "ryze-club", name: "The Ryze Club", image: "/products/club-hoodie.png", defaultGarment: "Hoodie", images: { "T-Shirt": "/products/club-shirt.png", "Dry-Fit": "/products/club-shirt.png", Crewneck: "/products/club-crewneck.png", Hoodie: "/products/club-hoodie.png" } },
  { id: "every-point", name: "Every Point", image: "/products/every-crewneck.png", defaultGarment: "Crewneck", images: { "T-Shirt": "/products/every-shirt.png", "Dry-Fit": "/products/every-shirt.png", Crewneck: "/products/every-crewneck.png", Hoodie: "/products/every-hoodie.png" } },
  { id: "grind-lime", name: "Ryze & Grind Lime", image: "/products/grind-lime-hoodie.png", defaultGarment: "Hoodie", images: { "T-Shirt": "/products/grind-lime-shirt.png", "Dry-Fit": "/products/grind-lime-shirt.png", Crewneck: "/products/grind-lime-crewneck.png", Hoodie: "/products/grind-lime-hoodie.png" } },
  { id: "graffiti", name: "Let’s Go Ryze Graffiti", image: "/products/graffiti-crewneck.png", defaultGarment: "Crewneck", images: { "T-Shirt": "/products/graffiti-shirt.png", "Dry-Fit": "/products/graffiti-shirt.png", Crewneck: "/products/graffiti-crewneck.png", Hoodie: "/products/graffiti-hoodie.png" } },
  { id: "starburst", name: "Ryze Starburst", image: "/products/starburst-hoodie.png", defaultGarment: "Hoodie", images: { "T-Shirt": "/products/starburst-shirt.png", "Dry-Fit": "/products/starburst-shirt.png", Crewneck: "/products/starburst-crewneck.png", Hoodie: "/products/starburst-hoodie.png" } },
  { id: "retro", name: "Retro We Ryze", image: "/products/retro-hoodie.png", defaultGarment: "Hoodie", images: { "T-Shirt": "/products/retro-dryfit.png", "Dry-Fit": "/products/retro-dryfit.png", Crewneck: "/products/retro-crewneck.png", Hoodie: "/products/retro-hoodie.png" } },
  { id: "electric", name: "Electric Ryze", image: "/products/electric-shirt.png", images: { "T-Shirt": "/products/electric-shirt.png", "Dry-Fit": "/products/electric-shirt.png", Crewneck: "/products/electric-crewneck.png", Hoodie: "/products/electric-hoodie.png" } },
  { id: "parent", name: "Proud Ryze Parent", image: "/products/parent-hoodie.png", defaultGarment: "Hoodie", images: { "T-Shirt": "/products/parent-shirt.png", "Dry-Fit": "/products/parent-shirt.png", Crewneck: "/products/parent-crewneck.png", Hoodie: "/products/parent-hoodie.png" } },
  { id: "color-rush", name: "Color Rush", image: "/products/model-color-rush.png", images: { "T-Shirt": "/products/color-shirt.png", "Dry-Fit": "/products/color-shirt.png", Crewneck: "/products/color-crewneck.png", Hoodie: "/products/color-hoodie.png" } },
  { id: "sunrise", name: "Sunrise Pink", image: "/products/sunrise-hoodie.png", defaultGarment: "Hoodie", images: { "T-Shirt": "/products/sunrise-shirt.png", "Dry-Fit": "/products/sunrise-shirt.png", Crewneck: "/products/sunrise-crewneck.png", Hoodie: "/products/sunrise-hoodie.png" } },
  { id: "bold", name: "Bold Ryze Splash", image: "/products/bold-crewneck.png", defaultGarment: "Crewneck", images: { "T-Shirt": "/products/bold-shirt.png", "Dry-Fit": "/products/bold-shirt.png", Crewneck: "/products/bold-crewneck.png", Hoodie: "/products/bold-hoodie.png" } },
  { id: "shine", name: "Ryze & Shine", image: "/products/shine-hoodie.png", defaultGarment: "Hoodie", images: { "T-Shirt": "/products/shine-shirt.png", "Dry-Fit": "/products/shine-shirt.png", Crewneck: "/products/shine-crewneck.png", Hoodie: "/products/shine-hoodie.png" } },
  {
    id: "earned", name: "Earned, Not Given", image: "/products/model-earned-navy.png",
    images: { "T-Shirt": "/products/earned-green-shirt.png" },
    colors: [
      { name: "Lime", image: "/products/earned-green-shirt.png", images: { "T-Shirt": "/products/earned-green-shirt.png", "Dry-Fit": "/products/earned-green-shirt.png", Crewneck: "/products/earned-green-crewneck.png", Hoodie: "/products/earned-green-hoodie.png" } },
      { name: "Navy", image: "/products/earned-navy-shirt.png", images: { "T-Shirt": "/products/earned-navy-shirt.png", "Dry-Fit": "/products/earned-navy-shirt.png", Crewneck: "/products/earned-navy-crewneck.png", Hoodie: "/products/earned-navy-hoodie.png" } },
    ],
  },
  { id: "letsgo", name: "Let’s Go Ryze Classic", image: "/products/letsgo-shirt.png", defaultGarment: "T-Shirt", images: { "T-Shirt": "/products/letsgo-shirt.png", "Dry-Fit": "/products/letsgo-shirt.png", Crewneck: "/products/letsgo-crewneck.png", Hoodie: "/products/letsgo-hoodie.png" } },
  { id: "nfw-classic", name: "NFW Ryze Classic", image: "/products/classic-crewneck.png", defaultGarment: "Crewneck", images: { "T-Shirt": "/products/classic-shirt.png", "Dry-Fit": "/products/classic-shirt.png", Crewneck: "/products/classic-crewneck.png", Hoodie: "/products/classic-hoodie.png" } },
];

const accessories: Accessory[] = [
  { id: "bag-pink", name: "Pink Bag Tag", price: 12, image: "/products/bag-pink.png", customizable: true },
  { id: "bag-navy", name: "Navy Bag Tag", price: 12, image: "/products/bag-navy.png", customizable: true },
  { id: "bag-green", name: "Green Bag Tag", price: 12, image: "/products/bag-green.png", customizable: true },
  { id: "keychain", name: "#RyzeFamily Keychain", price: 8, image: "/products/keychain.png" },
  { id: "tumbler-pink", name: "Pink Personalized Tumbler", price: 25, image: "/products/tumbler-pink.png", customizable: true },
  { id: "tumbler-steel", name: "Steel Personalized Tumbler", price: 25, image: "/products/tumbler-steel.png", customizable: true },
  { id: "sticker-player", name: "Player Name & Number Sticker", price: 6, image: "/products/sticker-player.png", customizable: true },
  { id: "sticker-logo", name: "NFW Ryze Volleyball Sticker", price: 5, image: "/products/sticker-logo.png" },
  { id: "parent-package", name: "Ryze Parent Package", price: 89.99, image: "/products/parent-package.png", customizable: true, badge: "$120 value" },
  { id: "custom-fan", name: "Biggest Fan Custom Shirt", price: 45, image: "/products/custom-fan.png", upload: true, customizable: true, badge: "Upload your athlete" },
  { id: "custom-mom", name: "Volleyball Mom Custom Shirt", price: 45, image: "/products/custom-mom.png", upload: true, customizable: true, badge: "Upload your athlete" },
];

const garmentPrices: Record<string, number> = { "T-Shirt": 25, "Dry-Fit": 30, Crewneck: 40, Hoodie: 50 };
const fundraiserContributions: Record<string, number> = { "T-Shirt": 3, "Dry-Fit": 3, Crewneck: 5, Hoodie: 7 };
const garmentNames = Object.keys(garmentPrices);
const placeholderImage = "/products/classic-shirt.png";
const personalizedTumblerName = "NFW Ryze Personalized Tumbler";
const personalizedTumblerColors = ["Navy", "White"];
const localProductImage = (fileName: string) => `/products/${encodeURIComponent(fileName)}`;
const logoAndFamilyImages: Record<string, Partial<Record<string, string>>> = {
  "logo tee- white": {
    "T-Shirt": localProductImage("Logo tee white.png"),
    "Dry-Fit": localProductImage("Logo tee white.png"),
    Crewneck: localProductImage("logo crewneck white.png"),
    Hoodie: localProductImage("logo hoodie white.png"),
  },
  "logo tee- navy": {
    "T-Shirt": localProductImage("Logo tee navy.png"),
    "Dry-Fit": localProductImage("Logo tee navy.png"),
    Crewneck: localProductImage("logo crewneck navy.png"),
    Hoodie: localProductImage("Logo hoodie navy.png"),
  },
  "logo tee - hot pink": {
    "T-Shirt": localProductImage("Logo Tee Pink.png"),
    "Dry-Fit": localProductImage("Logo Tee Pink.png"),
    Crewneck: localProductImage("logo crewneck pink.png"),
    Hoodie: localProductImage("Logo Hoodie Pink.png"),
  },
  "logo tee- lime green": {
    "T-Shirt": localProductImage("Logo tee Green.png"),
    "Dry-Fit": localProductImage("Logo tee Green.png"),
    Crewneck: localProductImage("logo crewneck green.png"),
    Hoodie: localProductImage("Logo hoodie Green.png"),
  },
  "#ryzefamily": {
    "T-Shirt": localProductImage("#ryzefamily navy shirt.png"),
    "Dry-Fit": localProductImage("#ryzefamily navy shirt.png"),
    Crewneck: localProductImage("#ryzefamily crew.png"),
    Hoodie: localProductImage("#ryzefamily hoodie.png"),
  },
};

function getMappedProductImages(productName: string) {
  const normalizedName = productName.trim().toLowerCase();
  return logoAndFamilyImages[normalizedName]
    || (normalizedName.startsWith("#ryzefamily") ? logoAndFamilyImages["#ryzefamily"] : undefined);
}

const sizes = ["YS", "YM", "YL", "YXL", "AS", "AM", "AL", "AXL", "2XL", "3XL"];
const apparelDisplayOrder = [
  "lime-team", "grind-pink", "classic-gray", "keep-ryzing", "color-rush",
  "ryze-club", "grind-lime", "retro", "every-point", "starburst",
  "bold", "electric", "sunrise", "shine", "parent", "nfw-classic",
  "earned", "graffiti", "letsgo",
];

type CartLine = {
  key: string;
  productId: string;
  garment?: string;
  customized: boolean;
  name: string;
  detail: string;
  price: number;
  size?: string;
  color?: string;
  playerName?: string;
  playerNumber?: string;
  fileName?: string;
  file?: File;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Apparel | Accessory | null>(null);
  const [garment, setGarment] = useState("T-Shirt");
  const [size, setSize] = useState("AM");
  const [color, setColor] = useState("Lime");
  const [customize, setCustomize] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [fileName, setFileName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fundraiserRaised, setFundraiserRaised] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paying, setPaying] = useState(false);
  const [supabaseApparel, setSupabaseApparel] = useState<Apparel[]>([]);
  const [supabaseAccessories, setSupabaseAccessories] = useState<Accessory[]>([]);

  const allAccessories = useMemo(() => {
    const products = new Map(accessories.map((product) => [product.id, product]));
    const usedIds = new Set([...products.keys(), ...apparel.map((product) => product.id)]);
    supabaseAccessories.forEach((product) => {
      if (!usedIds.has(product.id)) {
        products.set(product.id, product);
        usedIds.add(product.id);
      }
    });
    return [...products.values()];
  }, [supabaseAccessories]);

  const allApparel = useMemo(() => {
    const products = new Map(apparel.map((product) => [product.id, product]));
    const usedIds = new Set([...products.keys(), ...allAccessories.map((product) => product.id)]);
    supabaseApparel.forEach((product) => {
      if (!usedIds.has(product.id)) {
        products.set(product.id, product);
        usedIds.add(product.id);
      }
    });
    return [...products.values()];
  }, [allAccessories, supabaseApparel]);

  const shownProducts = useMemo(() => {
    const term = query.toLowerCase();
    const clothes = allApparel
      .filter((p) => p.name.toLowerCase().includes(term))
      .sort((a, b) => {
        const aOrder = apparelDisplayOrder.indexOf(a.id);
        const bOrder = apparelDisplayOrder.indexOf(b.id);
        return (aOrder < 0 ? Number.MAX_SAFE_INTEGER : aOrder) - (bOrder < 0 ? Number.MAX_SAFE_INTEGER : bOrder);
      });
    const extras = allAccessories.filter((p) => p.name.toLowerCase().includes(term));
    return [...clothes, ...extras];
  }, [allAccessories, allApparel, query]);
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const cartFundraiserContribution = cart.reduce((sum, item) => sum + (item.garment ? fundraiserContributions[item.garment] || 0 : 0), 0);
  const tax = Math.round(total * 0.0825 * 100) / 100;
  const grandTotal = total + tax;
  const isApparel = selected && "images" in selected;
  const activeApparel = isApparel ? selected as Apparel : null;
  const activeAccessory = selected && "price" in selected ? selected as Accessory : null;
  const isBagTag = Boolean(activeAccessory?.id.startsWith("bag-"));
  const isPersonalizedTumbler = activeAccessory?.name === personalizedTumblerName;
  const needsDetails = customize || Boolean(activeAccessory?.customizable && !isBagTag);
  const colorSet = activeApparel?.colors?.find((c) => c.name === color);
  const modalImage = activeApparel ? (colorSet?.images[garment] || activeApparel.images[garment] || colorSet?.image || activeApparel.image) : activeAccessory?.image;
  const activeGarmentPrices = activeApparel?.prices || garmentPrices;
  const basePrice = activeApparel ? activeGarmentPrices[garment] : activeAccessory?.price || 0;
  const customPrice = customize ? (isBagTag || isPersonalizedTumbler ? 5 : activeApparel ? 8 : 0) : 0;


  useEffect(() => {
    fetch("/api/fundraiser")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setFundraiserRaised(Number(data.raised) || 0))
      .catch(() => setFundraiserRaised(0));
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("products")
      .select("id,name,description,price,category,image,personalization,tshirt_price,dryfit_price,crewneck_price,hoodie_price")
      .eq("active", true)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;

        const products = data
          .filter((row) => String(row.category || "").toLowerCase() === "apparel")
          .map((row): Apparel | null => {
            const id = String(row.id ?? "").trim();
            const name = String(row.name ?? "").trim();
            if (!id || !name) return null;

            const fallbackPrice = Number(row.price);
            const price = (value: unknown, fallback: number) => {
              const amount = Number(value);
              return Number.isFinite(amount) && amount >= 0
                ? amount
                : Number.isFinite(fallbackPrice) && fallbackPrice >= 0 ? fallbackPrice : fallback;
            };
            const imageValue = String(row.image ?? "").trim();
            const fallbackImage = imageValue.startsWith("/") || /^https?:\/\//i.test(imageValue) ? imageValue : placeholderImage;
            const mappedImages = getMappedProductImages(name);
            const image = mappedImages?.["T-Shirt"] || fallbackImage;

            return {
              id,
              name,
              description: String(row.description ?? "").trim() || undefined,
              image,
              personalization: row.personalization !== false,
              prices: {
                "T-Shirt": price(row.tshirt_price, garmentPrices["T-Shirt"]),
                "Dry-Fit": price(row.dryfit_price, garmentPrices["Dry-Fit"]),
                Crewneck: price(row.crewneck_price, garmentPrices.Crewneck),
                Hoodie: price(row.hoodie_price, garmentPrices.Hoodie),
              },
              images: mappedImages || Object.fromEntries(garmentNames.map((garmentName) => [garmentName, image])),
            };
          })
          .filter((product): product is Apparel => product !== null);

        setSupabaseApparel(products);
        setSupabaseAccessories(data
          .filter((row) => String(row.category || "").toLowerCase() === "personalized" && String(row.name || "").trim() === personalizedTumblerName)
          .map((row): Accessory | null => {
            const id = String(row.id ?? "").trim();
            if (!id) return null;
            return { id, name: personalizedTumblerName, price: 25, image: "/products/tumblers.png" };
          })
          .filter((product): product is Accessory => product !== null));
      });

    return () => { cancelled = true; };
  }, []);

  function openProduct(product: Apparel | Accessory) {
    setSelected(product);
    setGarment("images" in product ? product.defaultGarment || "T-Shirt" : "T-Shirt");
    setSize("AM");
    setColor(product.name === personalizedTumblerName ? personalizedTumblerColors[0] : product && "colors" in product && product.colors ? product.colors[0].name : "Lime");
    setCustomize(Boolean("upload" in product && product.upload));
    setPlayerName("");
    setPlayerNumber("");
    setFileName("");
    setPhotoFile(null);
  }

  function addToCart() {
    if (!selected) return;
    if (needsDetails && (!playerName.trim() || !playerNumber.trim())) return;
    if (activeAccessory?.upload && !fileName) return;
    const details = [
      activeApparel ? garment : "",
      activeApparel ? size : "",
      activeApparel?.colors || isPersonalizedTumbler ? color : "",
      playerName ? `${playerName} #${playerNumber}` : "",
      fileName ? `Photo: ${fileName}` : "",
    ].filter(Boolean).join(" · ");
    setCart((items) => [...items, {
      key: `${selected.id}-${Date.now()}`,
      productId: selected.id,
      garment: activeApparel ? garment : undefined,
      customized: customize,
      name: selected.name,
      detail: details,
      price: basePrice + customPrice,
      size: activeApparel ? size : undefined,
      color: activeApparel?.colors || isPersonalizedTumbler ? color : undefined,
      playerName: playerName.trim() || undefined,
      playerNumber: playerNumber.trim() || undefined,
      fileName: fileName || undefined,
      file: photoFile || undefined,
    }]);
    setSelected(null);
    setCartOpen(true);
  }

  async function startHostedCheckout() {
    if (paying) return;
    setPaying(true);
    setPaymentStatus("");
    try {
      if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
        throw new Error("Please enter your name, email, and phone number.");
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: customerName.trim(),
            email: customerEmail.trim(),
            phone: customerPhone.trim(),
          },
          items: cart.map((item) => ({
            productId: item.productId,
            garment: item.garment,
            customized: item.customized,
            name: item.name,
            detail: item.detail,
            size: item.size,
            color: item.color,
            playerName: item.playerName,
            playerNumber: item.playerNumber,
            fileName: item.fileName,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error || "Square checkout could not be started.");
      }

      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        const formData = new FormData();
        formData.set("form-name", "nfw-ryze-orders");
        formData.set("order_id", result.orderId || "");
        formData.set("square_payment_id", "Hosted checkout pending");
        formData.set("customer_name", customerName.trim());
        formData.set("customer_email", customerEmail.trim());
        formData.set("customer_phone", customerPhone.trim());
        formData.set("subtotal", total.toFixed(2));
        formData.set("tax", tax.toFixed(2));
        formData.set("total", grandTotal.toFixed(2));
        formData.set(
          "order_summary",
          cart.map((item) => `${item.name}: ${item.detail} — $${item.price.toFixed(2)}`).join("\n"),
        );
        cart.filter((item) => item.file).slice(0, 5).forEach((item, index) => {
          formData.set(`athlete_photo_${index + 1}`, item.file as File);
        });
        try { await fetch("/order.html", { method: "POST", body: formData }); } catch { /* Square checkout can still continue */ }
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setPaymentStatus(error instanceof Error ? error.message : "Square checkout could not be started.");
      setPaying(false);
    }
  }

  return (
    <main>
      <div className="announcement">Official NFW Ryze Volleyball Club store · 2026–2027</div>
      <header className="nav">
        <a className="brand" href="#top" aria-label="NFW Ryze Volleyball Club home"><span>NFW</span> RYZE <small>VOLLEYBALL CLUB</small></a>
        <nav><a href="#fundraiser">Fundraiser</a><a href="#shop">Shop</a><a href="#custom">Custom</a><a href="#details">Details</a></nav>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${cart.length} items`}>Bag <b>{cart.length}</b></button>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">NFW RYZE VOLLEYBALL CLUB · HASLET, TEXAS</p>
          <h1>Every point.<br />Every play.<br /><em>We Ryze.</em></h1>
          <p>Official team gear made for athletes, families, coaches, and the loudest fans in the gym.</p>
          <div className="hero-actions"><a className="primary" href="#shop">Shop the collection</a><a className="secondary" href="#custom">Create a custom shirt</a></div>
          <div className="hero-notes"><span>{allApparel.length} apparel designs</span><span>Player personalization</span><span>Team delivery</span></div>
        </div>
        <div className="hero-art">
          <img src="/products/tatym-earned.png" alt="NFW Ryze Volleyball Club athlete wearing Earned Not Given apparel" />
        </div>
      </section>

      <section id="fundraiser" className="fundraiser" aria-labelledby="fundraiser-heading">
        <div>
          <p className="eyebrow">SUPPORT THE 2026–2027 SEASON</p>
          <h2 id="fundraiser-heading">Help our athletes Ryze.</h2>
          <p>Every confirmed store order supports the NFW Ryze volleyball program.</p>
        </div>
        <div className="fundraiser-counter">
          <span className="counter-label">TOTAL RAISED</span>
          <div className="counter-head"><strong>${fundraiserRaised.toLocaleString()}</strong></div>
          <div className="counter-foot"><b>Thank you, Ryze Family!</b><span>{cart.length > 0 ? `Your bag contributes $${cartFundraiserContribution.toFixed(2)} when purchased` : "Every apparel order supports our athletes"}</span></div>
        </div>
      </section>

      <section id="shop" className="shop">
        <div className="section-heading">
          <div><p className="eyebrow">THE TEAM SHOP</p><h2>Find your Ryze.</h2></div>
          <label className="search"><span>Search</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search designs" /></label>
        </div>
        <p className="all-merch-note">Apparel, accessories, custom designs, and packages—all together.</p>

        <div className="product-grid">
          {shownProducts.map((product) => "images" in product ? (
              <article className="product-card" key={product.id}>
                <button className="product-image" onClick={() => openProduct(product)}><img src={product.image} alt={product.name} onError={(event) => { event.currentTarget.src = placeholderImage; }} /></button>
                <div className="product-info"><div><p className="mini">4 GARMENT OPTIONS</p><h3>{product.name}</h3>{product.description && <p>{product.description}</p>}<p>From ${Math.min(...Object.values(product.prices || garmentPrices)).toFixed(2)} · Add player name & number +$8</p></div><button onClick={() => openProduct(product)}>Choose options</button></div>
              </article>
            ) : (
              <article className={`product-card accessory ${product.id.startsWith("bag-") ? "bag-tag-card" : ""}`} key={product.id}>
                <button className="product-image" onClick={() => openProduct(product)}><img src={product.image} alt={product.name} /></button>
                <div className="product-info"><div>{product.badge && <p className="mini">{product.badge}</p>}<h3>{product.name}</h3><p>${product.price.toFixed(2)}{product.customizable ? " · Personalized" : ""}</p></div><button onClick={() => openProduct(product)}>View options</button></div>
              </article>
          ))}
        </div>
      </section>

      <section id="custom" className="custom-banner">
        <div><p className="eyebrow">MADE FOR YOUR ATHLETE</p><h2>Your photo. Their name. Their number.</h2><p>Upload your favorite athlete photo and we’ll create a one-of-a-kind front-and-back design.</p><button className="primary" onClick={() => openProduct(accessories.find((p) => p.id === "custom-fan")!)}>Start a custom shirt · $45</button></div>
        <img src="/products/custom-fan.png" alt="Biggest Fan custom shirt example" />
      </section>

      <section id="details" className="details">
        <div><span>01</span><h3>Choose your design</h3><p>Pick from {allApparel.length} team looks, fan gear, accessories, and custom products.</p></div>
        <div><span>02</span><h3>Make it yours</h3><p>Add a player name and number to apparel for $8 or bag tags for $5.</p></div>
        <div><span>03</span><h3>Delivered together</h3><p>Orders are prepared and delivered together to the Ryze Volleyball Club.</p></div>
      </section>

      <footer>
        <div className="brand"><span>NFW</span> RYZE <small>VOLLEYBALL CLUB</small></div>
        <div className="footer-contact">
          <strong>Questions or special requests?</strong>
          <p>
            Text <a href="tel:+18176275943">817-627-5943</a> or email{" "}
            <a href="mailto:owlprintz@gmail.com">owlprintz@gmail.com</a>.
          </p>
        </div>
        <p>Haslet, Texas · 2026–2027</p>
      </footer>

      {selected && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
        <section className="modal" role="dialog" aria-modal="true" aria-label={`Customize ${selected.name}`}>
          <button className="close" onClick={() => setSelected(null)} aria-label="Close">×</button>
          <div className="modal-image"><img src={modalImage} alt={selected.name} onError={(event) => { event.currentTarget.src = placeholderImage; }} /></div>
          <div className="modal-content">
            <p className="eyebrow">{activeApparel ? "TEAM APPAREL" : "RYZE ACCESSORIES"}</p>
            <h2>{selected.name}</h2>
            <p className="modal-price">${(basePrice + customPrice).toFixed(2)}</p>
            {activeApparel && <>
              <fieldset><legend>Garment</legend><div className="option-row">{garmentNames.map((g) => <button type="button" className={garment === g ? "selected" : ""} onClick={() => setGarment(g)} key={g}>{g}<small>${activeGarmentPrices[g].toFixed(2)}</small></button>)}</div></fieldset>
              <label>Size<select value={size} onChange={(e) => setSize(e.target.value)}>{sizes.map((s) => <option key={s}>{s}</option>)}</select></label>
              {activeApparel.colors && <fieldset><legend>Color</legend><div className="option-row">{activeApparel.colors.map((c) => <button type="button" className={color === c.name ? "selected" : ""} onClick={() => setColor(c.name)} key={c.name}>{c.name}</button>)}</div></fieldset>}
              {activeApparel.personalization !== false && <label className="check"><input type="checkbox" checked={customize} onChange={(e) => setCustomize(e.target.checked)} /> Add player name & number to back (+$8)</label>}
            </>}
            {isPersonalizedTumbler && <>
              <fieldset><legend>Color</legend><div className="option-row">{personalizedTumblerColors.map((choice) => <button type="button" className={color === choice ? "selected" : ""} onClick={() => setColor(choice)} key={choice}>{choice}</button>)}</div></fieldset>
              <label className="check"><input type="checkbox" checked={customize} onChange={(e) => {
                setCustomize(e.target.checked);
                if (!e.target.checked) {
                  setPlayerName("");
                  setPlayerNumber("");
                }
              }} /> Add player name & number (+$5)</label>
            </>}
            {isBagTag && <label className="check"><input type="checkbox" checked={customize} onChange={(e) => setCustomize(e.target.checked)} /> Add player name & number (+$5)</label>}
            {activeAccessory?.customizable && !activeAccessory.upload && !isBagTag && <p className="note">Personalization is included in this item.</p>}
            {needsDetails && <div className="two-fields"><label>Player name<input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Tatyum" /></label><label>Player number<input value={playerNumber} onChange={(e) => setPlayerNumber(e.target.value)} placeholder="6" inputMode="numeric" /></label></div>}
            {activeAccessory?.upload && <label className="upload">Athlete photo<input type="file" accept="image/*" onChange={(e) => {
              const chosen = e.target.files?.[0] || null;
              setPhotoFile(chosen);
              setFileName(chosen?.name || "");
            }} /><span>{fileName || "Choose a clear, full-body photo"}</span></label>}
            {(needsDetails && (!playerName || !playerNumber)) && <p className="validation">Enter the player name and number to continue.</p>}
            {activeAccessory?.upload && !fileName && <p className="validation">Upload an athlete photo to continue.</p>}
            <button className="add" onClick={addToCart}>Add to bag · ${(basePrice + customPrice).toFixed(2)}</button>
          </div>
        </section>
      </div>}

      {cartOpen && <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}>
        <aside className="drawer">
          <div className="drawer-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Team bag</h2></div><button onClick={() => setCartOpen(false)}>×</button></div>
          {cart.length === 0 ? <div className="empty"><p>Your bag is ready for some Ryze.</p><button className="primary" onClick={() => setCartOpen(false)}>Keep shopping</button></div> :
            <>
              <div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.key}><div><h3>{item.name}</h3><p>{item.detail}</p></div><div><b>${item.price.toFixed(2)}</b><button onClick={() => setCart((items) => items.filter((i) => i.key !== item.key))}>Remove</button></div></div>)}</div>
              <div className="order-totals">
                <div><span>Subtotal</span><strong>${total.toFixed(2)}</strong></div>
                <div><span>Texas sales tax (8.25%)</span><strong>${tax.toFixed(2)}</strong></div>
                <div className="cart-total"><span>Total</span><strong>${grandTotal.toFixed(2)}</strong></div>
              </div>
              {!checkoutOpen ? <button className="checkout" onClick={() => setCheckoutOpen(true)}>Continue to secure checkout</button> :
                <div className="payment-panel">
                  <p className="payment-title">Secure Square checkout</p>
                  <div className="checkout-fields">
                    <label><span>Full name</span><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoComplete="name" /></label>
                    <label><span>Email</span><input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} autoComplete="email" /></label>
                    <label><span>Phone</span><input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} autoComplete="tel" /></label>
                  </div>
                  <p className="note">You will finish payment on Square’s secure checkout page.</p>
                  <button className="checkout" disabled={paying} onClick={startHostedCheckout}>{paying ? "Opening Square…" : `Continue to Square · $${grandTotal.toFixed(2)}`}</button>
                </div>}
              {paymentStatus && <p className={paymentStatus.startsWith("Payment approved") ? "payment-status success" : "payment-status"}>{paymentStatus}</p>}
              <p className="checkout-note">Payment processed securely on Square · Team delivery</p>
            </>}
        </aside>
      </div>}
    </main>
  );
}
