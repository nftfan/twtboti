import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// ======== CONFIGURATION ========
const CRYPTOPANIC_API_KEY = "a4442c98eddc4236d2131f51d32ae86c07698bb1";
const CRYPTOPANIC_API = `https://cryptopanic.com/api/developer/v2/posts/?auth_token=${CRYPTOPANIC_API_KEY}&public=true&kind=news&filter=important&regions=en`;

const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ======== GET LATEST CRYPTOPANIC HEADLINE (EXCLUDE cryptopanic.com) ========
async function fetchLatestCryptoHeadline() {
  try {
    const res = await axios.get(CRYPTOPANIC_API, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 x-hourly-bot"
      }
    });
    const posts = res.data?.results || [];
    // Find the first post whose url does NOT include 'cryptopanic.com'
    const post = posts.find(
      p => p.url && !p.url.toLowerCase().includes('cryptopanic.com')
    );
    if (!post) throw new Error("No suitable news returned");
    const title = post.title || "Crypto News";
    const url = post.url;

    let tweet = `NFTFAN NEWS: 📰 ${title}\n${url}\n#CryptoNews #Bitcoin #Blockchain`;
    if (tweet.length > 280) tweet = tweet.slice(0, 277) + "...";
    return tweet;
  } catch (err) {
    if (err.response) console.error("❌ News fetch error:", err.response.status, err.response.data);
    else console.error("❌ News fetch error:", err.message);
    return null;
  }
}

// ======== POST TWEET ========
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
    if (err.response) console.error("❌ Tweet failed:", err.response.status, err.response.data);
    else console.error("❌ Tweet failed:", err.message);
  }
}

// ======== CRON (EVERY 2 HOURS) ========
cron.schedule("0 */2 * * *", postCryptoHeadlineTweet);

// ======== INITIAL RUN ========
postCryptoHeadlineTweet();
