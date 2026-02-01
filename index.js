import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// ================= CONFIG =================
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

// ================= FETCH NEW TOKEN =================
async function fetchNewTokens() {
  try {
    const res = await axios.get(MORALIS_PUMPFUN_API, {
      headers: { "X-API-Key": MORALIS_API_KEY },
      timeout: 10000,
    });

    if (!res.data?.result?.length) return [];

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

// ================= GENERATE TWEET =================
function generateAirdropTweet(token) {
  const openers = [
    "Drop your $SOL wallets! 🚀",
    "Win free $SOL tokens! 🪂",
    "Giving away $SOL tokens! 💸",
    "Airdrop time for Solana fans!",
    "Who wants free $SOL? Comment wallet!"
  ];
  const hashtags = ["#Solana #Airdrop", "#Solana #Giveaway", "#Airdrop #SOL", "#SOL #Giveaway"];

  let tweet = `${openers[Math.floor(Math.random()*openers.length)]}\n` +
              `Name: ${token.name}\n` +
              `Symbol: ${token.symbol}\n` +
              `CA: ${token.mint}\n` +
              `${hashtags[Math.floor(Math.random()*hashtags.length)]}`;

  return tweet.length > 280 ? tweet.slice(0, 277) + "..." : tweet;
}

// ================= POST TWEET WITH RATE LIMIT CHECK =================
async function postTokenTweet() {
  try {
    console.log("🔎 Fetching new token...");
    const tokens = await fetchNewTokens();
    if (!tokens.length) return console.log("⚠️ No new tokens found.");

    const token = tokens[0];
    const tweetText = generateAirdropTweet(token);

    // Attempt to post tweet
    const { data } = await twitterClient.v2.tweet(tweetText);
    console.log(`[${new Date().toISOString()}] ✅ Tweeted (${data.id}):\n${tweetText}`);
  } catch (err) {
    // Handle 429 (rate limit) separately
    if (err.code === 429) {
      console.warn("⚠️ Twitter rate limit reached. Skipping tweet until reset.");
    } else {
      console.error("❌ Tweet failed:", err);
    }
  }
}

// ================= CRON SCHEDULE =================
// Every 90 minutes → 16 tweets per 24h
cron.schedule("*/90 * * * *", postTokenTweet);

// ================= RUN ON START =================
postTokenTweet();
