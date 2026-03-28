export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Find customer by email
    const searchRes = await fetch(
      `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'`,
      { headers: { "Authorization": `Bearer ${process.env.VERCEL_ENV === "production" ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY_TEST}`,} }
    );
    const searchData = await searchRes.json();
    if (!searchData.data?.length) return res.status(200).json({ active: false, tier: null });

    const customerId = searchData.data[0].id;

    // Get active subscriptions
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active`,
      { headers: { "Authorization": `Bearer ${process.env.VERCEL_ENV === "production" ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY_TEST}`,} }
    );
    const subData = await subRes.json();

    // Also check trialing
    const trialRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=trialing`,
      { headers: { "Authorization": `Bearer ${process.env.VERCEL_ENV === "production" ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY_TEST}`,} }
    );
    const trialData = await trialRes.json();

    const allSubs = [...(subData.data || []), ...(trialData.data || [])];
    if (!allSubs.length) return res.status(200).json({ active: false, tier: null });

    const MASTER_PRICES = ["price_1TEvteRx0s8BAK67xt9isV8w", "price_1TEvupRx0s8BAK67UhIwnaJR"];
    const sub = allSubs[0];
    const priceId = sub.items.data[0].price.id;
    const tier = MASTER_PRICES.includes(priceId) ? "master" : "studio";
    const trialing = sub.status === "trialing";

    return res.status(200).json({ active: true, tier, trialing });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
