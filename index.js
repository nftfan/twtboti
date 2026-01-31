import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Twitter client
const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

const THEMES = [
  "Surprising crypto fact",
  "Debunk a common crypto myth",
  "Actionable trading or investing tip",
  "Insightful Bitcoin or Ethereum statistic",
  "Major recent crypto news headline",
  "Motivational quote from a famous crypto figure",
  "Quick explainer of a key crypto concept",
];

async function getHighValueCryptoTweet() {
  // --- THE CORRECT GEMINI PRO ENDPOINT ---
  const endpoint = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const today = new Date().toISOString().substring(0,10); // YYYY-MM-DD

  const prompt = `Today is ${today}. Write a unique, concise tweet for the crypto community (theme: ${theme}). 
Mention something not often discussed. Make it actionable, insightful, and practical—something that can make readers smarter or richer. 
Under 230 characters. Add 1-2 currently popular crypto hashtags. Do NOT repeat advice or state the obvious. Be original and high-value.`;

  try {
    const res = await axios.post(
      `${endpoint}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          { parts: [{ text: prompt }] }
        ]
      }
    );
    const candidates = res.data.candidates;
    const text = (candidates[0]?.content?.parts[0]?.text || "").trim();
    return text;
  } catch (error) {
    console.error("Gemini error:", error?.response?.data || error.message);

    // Fallback: only return a randomized comment to avoid Twitter duplicate errors
    return "Crypto is changing the world! " + Math.floor(Math.random() * 100000) + " #Crypto";
  }
}

async function postCryptoTweet() {
  try {
    const tweetText = await getHighValueCryptoTweet();
    if (!tweetText) {
      console.error("No tweet text generated, skipping tweet.");
      return;
    }
    const { data } = await client.v2.tweet(tweetText);
    console.log(`[${new Date().toISOString()}] Tweeted: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Tweet failed:', error);
  }
}

// Tweet every 2 hours
cron.schedule('0 */2 * * *', postCryptoTweet);

postCryptoTweet(); // Also at launch
