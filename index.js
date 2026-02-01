import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// ====================== CONFIG ======================
const CRYPTOPANIC_API_KEY = "a4442c98eddc4236d2131f51d32ae86c07698bb1";
const CRYPTOPANIC_API = `https://cryptopanic.com/api/developer/v2/posts/?auth_token=${CRYPTOPANIC_API_KEY}&public=true&kind=news&filter=important&regions=en&size=1`;

// ================== TWITTER CLIENT ==================
const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ========== FETCH LATEST CRYPTOPANIC HEADLINE ==========
async function fetchLatestCryptoHeadline() {
  try {
    const res = await axios.get(CRYPTOPANIC_API, { timeout: 10000 });
    const posts = res.data?.results || [];
    if (!posts.length) {
      throw new Error("No news returned");
    }
    const post = posts[0];
    const title = post.title || "Crypto News";
    const url = post.url || "https://cryptopanic.com";
    let tweet = `📰 ${title}\n${url}\n#CryptoNews #Bitcoin #Blockchain`;
    if (tweet.length > 280) tweet = tweet.slice(0, 277) + "...";
    return tweet;
  } catch (err) {
    console.error("❌ News fetch error:", err.message);
    return null;
  }
}

// ===================== POST TWEET =====================
async function postCryptoHeadlineTweet() {
  try {
    console.log("🔎 Fetching latest crypto news...");
    const tweetText = await fetchLatestCryptoHeadline();

    if (!tweetText) {
      console.log("⚠️ No crypto news found. Skipping tweet.");
      return;
    }

    const { data } = await twitterClient.v2.tweet(tweetText);

    console.log(
      `[${new Date().toISOString()}] ✅ Tweeted (${data.id}):\n${tweetText}`
    );
  } catch (err) {
    console.error("❌ Tweet failed:", err);
  }
}

// =========== CRON (EVERY 2 HOURS) ===========
cron.schedule("0 */2 * * *", postCryptoHeadlineTweet);

// =========== INITIAL RUN =========== 
postCryptoHeadlineTweet();
