import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// ================= CONFIG =================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

const MORALIS_PUMPFUN_API =
  "https://solana-gateway.moralis.io/token/mainnet/exchange/pumpfun/new?limit=5";

// ================= TWITTER CLIENT =================
const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ================= FETCH NEW TOKENS =================
async function fetchNewTokens() {
  try {
    const res = await axios.get(MORALIS_PUMPFUN_API, {
      headers: {
        "X-API-Key": MORALIS_API_KEY
      },
      timeout: 10000
    });

    if (!res.data?.result?.length) {
      throw new Error("No tokens returned");
    }

    return res.data.result.map(t => ({
      name: t.name || "Unknown",
      symbol: t.symbol || "",
      mint: t.tokenAddress
    }));

  } catch (err) {
    console.error("❌ Token fetch error:", err.message);
    return [];
  }
}

// ================= GEMINI TWEET GENERATOR =================
async function generateTweet(tokens) {
  const tokenLines = tokens
    .map((t, i) => `${i + 1}. ${t.name} (${t.symbol || "N/A"})`)
    .join("\n");

  const prompt = `
Create ONE tweet under 230 characters.

Context:
These are newly deployed Solana tokens detected on-chain.

Tokens:
${tokenLines}

Rules:
- Neutral, informative tone
- No hype, no emojis
- No financial advice
- 1–2 hashtags max
`;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    let text = res.data.candidates[0].content.parts[0].text.trim();

    // Safety clamp for Twitter
    if (text.length > 230) {
      text = text.slice(0, 227) + "...";
    }

    return text;

  } catch (err) {
    console.error("❌ Gemini error:", err?.response?.data || err.message);
    return `New Solana tokens detected: ${tokens.map(t => t.name).join(", ")} #Solana`;
  }
}

// ================= POST TWEET =================
async function postTokenTweet() {
  try {
    console.log("🔎 Fetching new tokens...");
    const tokens = await fetchNewTokens();

    if (tokens.length === 0) {
      console.log("⚠️ No tokens found. Skipping tweet.");
      return;
    }

    console.log("🧠 Generating tweet via Gemini...");
    const tweetText = await generateTweet(tokens);

    const { data } = await twitterClient.v2.tweet(tweetText);

    console.log(
      `[${new Date().toISOString()}] ✅ Tweeted (${data.id}):\n${tweetText}`
    );

  } catch (err) {
    console.error("❌ Tweet failed:", err);
  }
}

// ================= CRON (EVERY 2 HOURS) =================
cron.schedule('0 */2 * * *', postTokenTweet);

// ================= RUN ON START =================
postTokenTweet();
