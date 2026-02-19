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

// ================= AIRDROP/GIVEAWAY TWEET GENERATOR =================
function generateAirdropTweet(token) {
  const openers = [
    "Drop your $SOL wallets! 🚀",
    "Win free $SOL tokens! 🪂",
    "Giving away $SOL tokens! 💸",
    "Airdrop time for Solana fans!",
    "Who wants free $SOL? Comment wallet!"
  ];
  const hashtagSets = [
    "#Solana #Airdrop",
    "#Solana #Giveaway",
    "#Airdrop #SOL",
    "#SOL #Giveaway"
  ];
  const intro = openers[Math.floor(Math.random() * openers.length)];
  const hashtags = hashtagSets[Math.floor(Math.random() * hashtagSets.length)];

  // Twitter’s max safe tweet length
  let tweet = (
    `${intro}\n` +
    `Name: ${token.name}\n` +
    `Symbol: ${token.symbol}\n` +
    `CA: ${token.mint}\n` +
    `${hashtags}`
  );
  if (tweet.length > 280) tweet = tweet.slice(0, 277) + "...";
  return tweet;
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
    const tweetText = generateAirdropTweet(token);

    const { data } = await twitterClient.v2.tweet(tweetText);

    console.log(
      `[${new Date().toISOString()}] ✅ Tweeted (${data.id}):\n${tweetText}`
    );
  } catch (err) {
    console.error("❌ Tweet failed:", err);
  }
}

// ================= CRON (EVERY 2 HOURS) =================
cron.schedule("0 */12 * * *", postTokenTweet);

// ================= RUN ON START =================
postTokenTweet();
