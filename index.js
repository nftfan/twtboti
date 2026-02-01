import cron from "node-cron";
import fs from "fs";
import axios from "axios";
import { TwitterApi } from "twitter-api-v2";
import 'dotenv/config'; // load .env

// ================= CONFIG =================
const AGENT_NAME = "NFTFANS AGENT";
const MEMORY_FILE = "./agent_memory.json";

// ================= TWITTER =================
const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ================= LOAD / SAVE MEMORY =================
function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
}

function saveMemory(tweet) {
  const mem = loadMemory();
  mem.unshift(tweet);
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(mem.slice(0, 5), null, 2));
}

// ================= BTC MARKET BIAS =================
async function getBtcBias() {
  try {
    const r = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "bitcoin",
          vs_currencies: "usd",
          include_24hr_change: true,
        },
      }
    );
    const change = r.data.bitcoin.usd_24h_change;
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
      { params: { auth_token: process.env.CRYPTOPANIC_API_KEY, public: true } }
    );
    return res.data.results.slice(0, 5).map(p => p.title).join(" | ");
  } catch {
    return "Bitcoin, AI agents, Solana, memecoins";
  }
}

// ================= GENERATE AI TWEET =================
async function generateAiTweet() {
  const memory = loadMemory().join("\n");
  const bias = await getBtcBias();
  const trends = await getTrendContext();

  const prompt = `
You are ${AGENT_NAME}, a crypto AI agent on X.

Market: ${bias}
Trends: ${trends}

Avoid repeating previous tweets:
${memory || "None"}

Rules:
- ONE tweet
- Max 240 characters
- Alpha, insider tone
- No hype spam
- Max 2 emojis
- Optional subtle NFTFAN mention

Write the tweet.
`;

  try {
    const res = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [
          { parts: [{ text: prompt }] }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY
        },
        timeout: 15000
      }
    );

    return res.data.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    if (err.response?.data?.status === "RESOURCE_EXHAUSTED") {
      console.warn("⚠️ Gemini quota exceeded. Wait before retrying.");
    } else {
      console.error("❌ Gemini error:", err.response?.data || err.message);
    }
    return null;
  }
}

// ================= POST TWEET =================
async function postAiTweet() {
  try {
    console.log("🤖 NFTFANS AGENT generating...");
    const tweet = await generateAiTweet();
    if (!tweet) return;

    const { data } = await twitterClient.v2.tweet(tweet);
    saveMemory(tweet);

    console.log(`[${new Date().toISOString()}] ✅ Tweeted (${data.id}):\n${tweet}`);
  } catch (err) {
    console.error("❌ Tweet error:", err.message);
  }
}

// ================= CRON =================
// Post every 2 hours
cron.schedule("0 */2 * * *", postAiTweet);

// ================= INITIAL RUN =================
postAiTweet();
