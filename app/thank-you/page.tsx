export default function ThankYouPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#071126", color: "white", fontFamily: "Arial, sans-serif" }}>
      <section style={{ width: "min(620px, 100%)", background: "white", color: "#071126", padding: 36, borderRadius: 18, textAlign: "center" }}>
        <p style={{ color: "#f6007a", fontWeight: 800, letterSpacing: 2 }}>NFW RYZE VOLLEYBALL</p>
        <h1 style={{ fontSize: 42, margin: "12px 0" }}>Thank you!</h1>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>Square has processed your checkout. Keep your Square receipt for your records. Owl Printz will use the order details submitted with your purchase to prepare your items.</p>
        <a href="/" style={{ display: "inline-block", marginTop: 20, padding: "14px 22px", borderRadius: 10, background: "#f6007a", color: "white", fontWeight: 800, textDecoration: "none" }}>Return to the store</a>
      </section>
    </main>
  );
}
