import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

// ================= TWITTER CLIENT =================
const twitterClient = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// ================= CRYPTO CONTENT SOURCES =================

const NEWS_API = 'https://cryptopanic.com/api/v1/posts/?auth_token=' + process.env.CRYPTO_API_KEY + '&kind=news'; // requires a free CryptoPanic API key

const CRYPTO_TIPS = [
  "Never share your private keys. 🔒",
  "Not your keys, not your coins! #CryptoSafety",
  "Watch out for phishing sites, verify addresses! 🧐",
  "Always enable 2FA on exchanges and wallets.",
  "Diversify your portfolio to reduce risk. 💡",
  "HODL is not for every coin. DYOR! 🚀",
  "Don't invest more than you can afford to lose. 💰"
];

const CRYPTO_FUN_FACTS = [
  "Did you know? Bitcoin’s creator is still anonymous!",
  "Ethereum was crowdfunded in 2014.",
  "Dogecoin started as a joke but reached billions in market cap.",
  "Solana can process thousands of transactions per second!",
  "The first real bitcoin transaction bought two pizzas in 2010."
];

const CRYPTO_MEMES = [
  "When you check your wallet after a bull run... 🚀💰",
  "Crypto in 2023: Up. Down. Up. Sideways. Who knows?",
  "Remember: Paper hands get cold, diamond hands get rich 😂",
  "Everyone’s a trader until the bear market arrives 🐻"
];

// ================= CONTENT GENERATOR =================
async function fetchCryptoNewsHeadline() {
  try {
    const res = await axios.get(NEWS_API, { timeout: 8000 });
    const posts = res.data?.results || [];
    if (!posts.length) return null;
    // Pick a random headline
    const headline = posts[Math.floor(Math.random() * posts.length)].title;
    return headline.length > 200 ? headline.slice(0, 197) + '...' : headline;
  } catch (err) {
    console.error("❌ Crypto news fetch error:", err.message);
    return null;
  }
}

function getRandomTip() {
  return CRYPTO_TIPS[Math.floor(Math.random() * CRYPTO_TIPS.length)];
}

function getRandomFunFact() {
  return CRYPTO_FUN_FACTS[Math.floor(Math.random() * CRYPTO_FUN_FACTS.length)];
}

function getRandomMeme() {
  return CRYPTO_MEMES[Math.floor(Math.random() * CRYPTO_MEMES.length)];
}

async function generateCryptoContentTweet() {
  const categories = ['news', 'tip', 'fact', 'meme'];
  const chosen = categories[Math.floor(Math.random() * categories.length)];

  let tweet = '';
  if (chosen === 'news') {
    const headline = await fetchCryptoNewsHeadline();
    tweet = headline
      ? `🚨 Crypto News: ${headline} \n\n#Crypto #Blockchain #Bitcoin`
      : getRandomTip() + '\n\n#CryptoTip';
  } else if (chosen === 'tip') {
    tweet = getRandomTip() + '\n\n#CryptoTip';
  } else if (chosen === 'fact') {
    tweet = getRandomFunFact() + '\n\n#CryptoFact';
  } else {
    tweet = getRandomMeme() + '\n\n#CryptoMeme';
  }
  // Twitter’s max length
  return tweet.length > 280 ? tweet.slice(0, 277) + "..." : tweet;
}

// ================= POST TWEET =================
async function postCryptoContentTweet() {
  try {
    console.log("🔎 Generating crypto content tweet...");
    const tweetText = await generateCryptoContentTweet();
    const { data } = await twitterClient.v2.tweet(tweetText);
    console.log(
      `[${new Date().toISOString()}] ✅ Tweeted (${data.id}):\n${tweetText}`
    );
  } catch (err) {
    console.error("❌ Tweet failed:", err);
  }
}

// ================= CRON JOB (EVERY 2 HOURS) =================
cron.schedule("0 */2 * * *", postCryptoContentTweet);

// ================= RUN ON START =================
postCryptoContentTweet();
