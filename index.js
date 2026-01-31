import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// ================= CONFIG =================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

const MORALIS_PUMPFUN_API =
  "https://solana-gateway.moralis.io/token/mainnet/exchange/pumpfun/new?limit=1";

// ================= TWITTER CLIENT =================
const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ================= FETCH ONE NEW TOKEN =================
async function fetchNewTokens() {
  try {
    const res = await axios.get(MORALIS_PUMPFUN_API, {
      headers: {
        "X-API-Key": MORALIS_API_KEY,
      },
      timeout: 10000,
    });

    if (!res.data?.result?.length) {
      throw new Error("No tokens returned");
    }

    return res.data.result.map((t) => ({
      name: t.name || "Unknown",
      symbol: t.symbol || "",
      mint: t.tokenAddress,
    }));
  } catch (err) {
    console.error("❌ Token fetch error:", err.message);
    return [];
  }
}

// ================= CUSTOM TWEET GENERATOR =================
function generateCustomTweet(token) {
  // Pick one of these messages at random or alternate
  const phrases = [
    `Is this the token you're looking for?`,
    `Shill it!`,
    `Discover the latest Solana deployment.`,
  ];
  const intro = phrases[Math.floor(Math.random() * phrases.length)];
  return (
    `${intro}\n` +
    `Name: ${token.name}\n` +
    `Symbol: ${token.symbol}\n` +
    `CA: ${token.mint}\n` +
    `#Solana`
  ).slice(0, 230); // Clamp to Twitter's limit
}

// ================= POST TWEET =================
async function postTokenTweet() {
  try {
    console.log("🔎 Fetching new token...");
    const tokens = await fetchNewTokens();

    if (tokens.length === 0) {
      console.log("⚠️ No tokens found. Skipping tweet.");
      return;
    }

    const token = tokens[0];
    const tweetText = generateCustomTweet(token);

    const { data } = await twitterClient.v2.tweet(tweetText);

    console.log(
      `[${new Date().toISOString()}] ✅ Tweeted (${data.id}):\n${tweetText}`
    );
  } catch (err) {
    console.error("❌ Tweet failed:", err);
  }
}

// ================= CRON (EVERY 2 HOURS) =================
cron.schedule("0 */2 * * *", postTokenTweet);

// ================= RUN ON START =================
postTokenTweet();
