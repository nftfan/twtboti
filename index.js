import 'dotenv/config';
import cron from 'node-cron';
import axios from 'axios';
import fs from 'fs';
import { TwitterApi } from 'twitter-api-v2';

// ================= CONFIG =================
const AGENT_NAME = "NFTFANS AGENT";
const MEMORY_FILE = "./agent_memory.json";

// Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Twitter
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

// ================= MARKET SENTIMENT =================
async function getBtcBias() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
    );
    const change = res.data.bitcoin.usd_24h_change;
    return change > 0 ? "bullish" : "bearish";
  } catch {
    return "neutral";
  }
}

// ================= TREND SNIFFER =================
async function getTrendingKeywords() {
  try {
    const res = await axios.get(
      "https://cryptopanic.com/api/developer/v2/posts/?auth_token=a4442c98eddc4236d2131f51d32ae86c07698bb1&public=true"
    );
    const titles = res.data.results.slice(0, 5).map(p => p.title).join(" ");
    return titles;
  } catch {
    return "Bitcoin AI Solana memecoins";
  }
}

// ================= GEMINI =================
async function generateAiTweet() {
  const memory = loadMemory().join("\n");
  const btcBias = await getBtcBias();
  const trends = await getTrendingKeywords();

  const prompt = `
You are ${AGENT_NAME}, a dominant crypto AI agent on X.

Market bias: ${btcBias}
Trending context: ${trends}

Recent tweets (avoid repetition):
${memory || "None"}

Rules:
- Max 240 characters
- Alpha, insider tone
- Zero fluff
- Max 2 emojis
- No begging, no hype spam
- Occasionally mention NFTFAN naturally (optional)

Examples:
"Smart money moved first. Charts just confirmed it."
"AI agents don't ask permission. They execute."

Write ONE tweet now.
`;

  const res = await axios.post(GEMINI_API_URL, {
    contents: [{ parts: [{ text: prompt }] }]
  });

  const tweet =
    res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  return tweet?.length > 280 ? tweet.slice(0, 277) + "..." : tweet;
}

// ================= POST =================
async function postAiTweet() {
  try {
    console.log("🤖 NFTFANS AGENT executing...");
    const tweet = await generateAiTweet();
    if (!tweet) return;

    const { data } = await twitterClient.v2.tweet(tweet);
    saveMemory(tweet);

    console.log(`✅ Tweeted (${data.id}):\n${tweet}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// ================= CRON =================
// Every 2 hours (perfect for growth)
cron.schedule("0 */2 * * *", postAiTweet);

// ================= START =================
postAiTweet();
