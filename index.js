import cron from "node-cron";
import fs from "fs";
import axios from "axios";
import { TwitterApi } from "twitter-api-v2";

// ================= CONFIG =================
const AGENT_NAME = "NFTFANS AGENT";
const MEMORY_FILE = "./agent_memory.json";

// ================= API KEYS =================
const GEMINI_API_KEY = "AIzaSyDjzV4pg4wMAnSm6jPwid3JsDEV4ifJnV0";
const CRYPTOPANIC_API_KEY = "a4442c98eddc4236d2131f51d32ae86c07698bb1";

// ✅ STABLE GEMINI MODEL THAT WORKS FOR ALL KEYS
const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// ================= TWITTER CLIENT =================
const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ================= MEMORY =================
function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
}

function saveMemory(tweet) {
  const mem = loadMemory();
  mem.unshift(tweet);
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(mem.slice(0, 5), null, 2));
}

// ================= BTC SENTIMENT =================
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
    return r.data.bitcoin.usd_24h_change >= 0 ? "bullish" : "bearish";
  } catch {
    return "neutral";
  }
}

// ================= TREND CONTEXT =================
async function getTrendContext() {
  try {
    const r = await axios.get(
      "https://cryptopanic.com/api/developer/v2/posts/",
      { params: { auth_token: CRYPTOPANIC_API_KEY, public: true } }
    );
    return r.data.results.slice(0, 5).map(p => p.title).join(" | ");
  } catch {
    return "Bitcoin, AI agents, Solana, memecoins";
  }
}

// ================= GEMINI AI TWEET =================
async function generateAiTweet() {
  const memory = loadMemory().join("\n");
  const bias = await getBtcBias();
  const trends = await getTrendContext();

  const prompt = `
You are ${AGENT_NAME}, a crypto-native AI agent on X.

Market: ${bias}
Trends: ${trends}

Avoid repeating:
${memory || "None"}

Rules:
- One tweet
- Max 240 characters
- Alpha, insider tone
- No hype spam
- Max 2 emojis
- Optional subtle NFTFAN mention

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

    return res.data.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    console.error("❌ Gemini error:", err.response?.data || err.message);
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

    console.log(`✅ Tweeted (${data.id}):\n${tweet}`);
  } catch (err) {
    console.error("❌ Tweet error:", err.message);
  }
}

// ================= CRON =================
// Every 2 hours
cron.schedule("0 */2 * * *", postAiTweet);

// ================= START =================
postAiTweet();
