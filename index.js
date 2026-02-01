import 'dotenv/config';
import cron from 'node-cron';
import axios from 'axios';
import fs from 'fs';
import { TwitterApi } from 'twitter-api-v2';

// ================= BASIC CONFIG =================
const AGENT_NAME = "NFTFANS AGENT";
const MEMORY_FILE = "./agent_memory.json";

// ================= HARD-CODED API KEYS =================
const GEMINI_API_KEY =
  "AIzaSyDjzV4pg4wMAnSm6jPwid3JsDEV4ifJnV0";

const CRYPTOPANIC_API_KEY =
  "a4442c98eddc4236d2131f51d32ae86c07698bb1";

// ================= GEMINI ENDPOINT (WORKING) =================
const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// ================= TWITTER CLIENT =================
const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ================= MEMORY =================
function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveMemory(tweet) {
  const memory = loadMemory();
  memory.unshift(tweet);
  fs.writeFileSync(
    MEMORY_FILE,
    JSON.stringify(memory.slice(0, 5), null, 2)
  );
}

// ================= MARKET SENTIMENT =================
async function getBtcBias() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "bitcoin",
          vs_currencies: "usd",
          include_24hr_change: "true",
        },
        timeout: 10000,
      }
    );

    const change = res.data.bitcoin.usd_24h_change;
    if (change > 1) return "strongly bullish";
    if (change > 0) return "bullish";
    if (change < -1) return "strongly bearish";
    return "bearish";
  } catch {
    return "neutral";
  }
}

// ================= TREND CONTEXT =================
async function getTrendContext() {
  try {
    const res = await axios.get(
      "https://cryptopanic.com/api/developer/v2/posts/",
      {
        params: {
          auth_token: CRYPTOPANIC_API_KEY,
          public: true,
        },
        timeout: 10000,
      }
    );

    return res.data.results
      .slice(0, 5)
      .map(p => p.title)
      .join(" | ");
  } catch {
    return "Bitcoin, AI agents, Solana, memecoins";
  }
}

// ================= GEMINI AI =================
async function generateAiTweet() {
  const memory = loadMemory().join("\n");
  const btcBias = await getBtcBias();
  const trends = await getTrendContext();

  const prompt = `
You are ${AGENT_NAME}, a high-signal crypto AI agent on X.

Market bias: ${btcBias}
Trending topics: ${trends}

Recent tweets (avoid repetition):
${memory || "None"}

Rules:
- ONE tweet only
- Max 240 characters
- Alpha, insider tone
- No cringe hype
- Max 2 emojis
- Optional soft NFTFAN mention

Examples:
"Smart money already positioned. Charts just caught up."
"AI agents trade faster than human narratives."

Write the tweet.
`;

  try {
    const res = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      { timeout: 15000 }
    );

    const tweet =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!tweet) throw new Error("Empty Gemini response");

    return tweet.length > 280 ? tweet.slice(0, 277) + "..." : tweet;
  } catch (err) {
    console.error("❌ Gemini error:", err.message);
    return null;
  }
}

// ================= POST TWEET =================
async function postAiTweet() {
  try {
    console.log("🤖 NFTFANS AGENT thinking...");
    const tweet = await generateAiTweet();
    if (!tweet) return;

    const { data } = await twitterClient.v2.tweet(tweet);
    saveMemory(tweet);

    console.log(
      `[${new Date().toISOString()}] ✅ Tweeted (${data.id}):\n${tweet}`
    );
  } catch (err) {
    console.error("❌ Tweet failed:", err.message);
  }
}

// ================= CRON =================
// Every 2 hours
cron.schedule("0 */2 * * *", postAiTweet);

// ================= START =================
postAiTweet();
