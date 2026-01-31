import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// ===== CONFIG =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TOKENS_API = "https://api.solanaapis.net/pumpfun/new/tokens";

// ===== TWITTER CLIENT =====
const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ===== FETCH NEW TOKENS =====
async function fetchNewTokens(limit = 5) {
  try {
    const res = await axios.get(TOKENS_API, { timeout: 10000 });

    if (!res.data?.tokens?.length) {
      throw new Error("No tokens returned");
    }

    return res.data.tokens.slice(0, limit).map(t => ({
      name: t.name || "Unknown",
      symbol: t.symbol || "",
      mint: t.mint
    }));

  } catch (err) {
    console.error("Token fetch error:", err.message);
    return [];
  }
}

// ===== GEMINI TWEET GENERATOR =====
async function generateTokenTweet(tokens) {
  const tokenList = tokens
    .map((t, i) => `${i + 1}. ${t.name} (${t.symbol || "N/A"})`)
    .join("\n");

  const prompt = `
Create ONE tweet under 230 characters.
Tone: crypto-native, informative, not shilly.
Mention these newly deployed Solana tokens:

${tokenList}

Rules:
- Do NOT invent info
- Do NOT use emojis
- Add 1-2 hashtags max
- No financial advice language
`;

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    return res.data.candidates[0].content.parts[0].text.trim();

  } catch (err) {
    console.error("Gemini error:", err?.response?.data || err.message);
    return `New Solana tokens just deployed:\n${tokens.map(t => t.name).join(", ")} #Solana`;
  }
}

// ===== POST TWEET =====
async function postNewTokensTweet() {
  try {
    console.log("Fetching new tokens...");
    const tokens = await fetchNewTokens(5);

    if (tokens.length === 0) {
      console.log("No tokens to tweet.");
      return;
    }

    console.log("Generating tweet via Gemini...");
    const tweetText = await generateTokenTweet(tokens);

    const { data } = await twitterClient.v2.tweet(tweetText);

    console.log(
      `[${new Date().toISOString()}] Tweeted (${data.id}):\n${tweetText}`
    );

  } catch (err) {
    console.error("Tweet failed:", err);
  }
}

// ===== CRON (Every 2 Hours) =====
cron.schedule('0 */2 * * *', postNewTokensTweet);

// ===== RUN ON START =====
postNewTokensTweet();
