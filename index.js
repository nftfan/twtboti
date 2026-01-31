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

// Fetch a tweet from Gemini API
async function getBitcoinTweetFromGemini() {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  try {
    const res = await axios.post(
      `${endpoint}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: "Write a short, unique, tweetable comment about Bitcoin. Keep it under 230 characters. Can be fun, insightful or educational. Add 1-2 relevant hashtags." }
            ]
          }
        ]
      }
    );
    const candidates = res.data.candidates;
    // Gemini might return multiple candidates, pick the first and extract text
    const text = (candidates[0].content.parts[0].text || "").trim();
    return text;
  } catch (error) {
    console.error("Gemini error:", error?.response?.data || error.message);
    return "Bitcoin is revolutionizing the future of money! #Bitcoin";
  }
}

// Post a tweet
async function postBitcoinTweet() {
  try {
    const tweetText = await getBitcoinTweetFromGemini();
    const { data } = await client.v2.tweet(tweetText);
    console.log(`[${new Date().toISOString()}] Tweeted: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Tweet failed:', error);
  }
}

// Cron job: Every 2 hours at minute 0
cron.schedule('0 */2 * * *', postBitcoinTweet);

// At launch, send the first tweet
postBitcoinTweet();
