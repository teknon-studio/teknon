import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body;
  if (!email || !email.trim()) return res.status(400).json({ error: "Email required" });

  const normalisedEmail = email.trim().toLowerCase();
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";

  const emailKey = `free-analysis:email:${normalisedEmail}`;
  const ipKey = `free-analysis:ip:${ip}`;

  try {
    const [emailUsed, ipUsed] = await Promise.all([
      redis.get(emailKey),
      redis.get(ipKey),
    ]);

    if (emailUsed || ipUsed) {
      return res.status(200).json({ allowed: false });
    }

    // 90 days in seconds — long enough to meaningfully deter reset attempts,
    // short enough that a shared IP (office, family) isn't punished forever.
    const NINETY_DAYS = 60 * 60 * 24 * 90;
    await Promise.all([
      redis.set(emailKey, "1", { ex: NINETY_DAYS }),
      redis.set(ipKey, "1", { ex: NINETY_DAYS }),
    ]);

    return res.status(200).json({ allowed: true });
  } catch (e) {
    console.error("Teknon: free-analysis check failed", e);
    // Fail open rather than blocking a genuine user if Redis has a hiccup —
    // but log it so you notice if this starts happening often.
    return res.status(200).json({ allowed: true });
  }
}
