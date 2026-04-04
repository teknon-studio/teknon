export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const PRICES = {
    studio_monthly:  "price_1TEvpZRx0s8BAK67R01iIqWz",
    studio_annual:   "price_1TEvsORx0s8BAK67VPN8KCrV",
    master_monthly:  "price_1TEvteRx0s8BAK67xt9isV8w",
    master_annual:   "price_1TEvupRx0s8BAK67UhIwnaJR",
  };

  try {
    const { priceKey, email, successUrl, cancelUrl } = req.body;
    const priceId = PRICES[priceKey];
    if (!priceId) return res.status(400).json({ error: "Invalid price" });

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    // No trial — 3 free analyses handled in app before paywall
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("allow_promotion_codes", "true");
    if (email) params.append("customer_email", email);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VERCEL_ENV === "production" ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY_TEST}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await response.json();
    if (session.error) return res.status(400).json({ error: session.error.message });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
