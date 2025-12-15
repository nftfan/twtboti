import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import TelegramBot from 'node-telegram-bot-api';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

// --- CONFIGURATION ---
const TG_LINK = "https://t.me/nftfanstokens";
const QUICKBUY_LINK = "https://www.nftfanstoken.com/quickbuynft/";

const BOT_TOKEN = '8206583869:AAHg-L0Atf_Y5zEI8DNfNdR7KIcJfDoDs94';
const TARGET_CHAT_ID = -1001835894609;
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBuBB-Cha7eLG1O7SxOTfFt8e6hVAWjkxI",
  authDomain: "tokentransfer-4a9b3.firebaseapp.com",
  databaseURL: "https://tokentransfer-4a9b3-default-rtdb.firebaseio.com",
  projectId: "tokentransfer-4a9b3",
  storageBucket: "tokentransfer-4a9b3.appspot.com",
  messagingSenderId: "205455490321",
  appId: "1:205455490321:web:9919f5dde059316c9320b0",
  measurementId: "G-Y6CVEDL9XH"
};
const TWITTER_USER_ID = process.env.TWITTER_USER_ID; // numeric, required

if (!process.env.X_APP_KEY || !process.env.X_APP_SECRET || !process.env.X_ACCESS_TOKEN || !process.env.X_ACCESS_SECRET || !TWITTER_USER_ID) {
  throw new Error('Missing Twitter API or user config (X_APP_KEY, etc. and TWITTER_USER_ID)');
}

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET
});
const bot = new TelegramBot(BOT_TOKEN, { polling: false });
const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(firebaseApp);

// --- NFTFAN TWITTER POSTER (updated for EVM wallets and $NFTFAN airdrops!) ---
// Prize amounts in billions and trillion
const AMOUNTS = ["5B", "10B", "25B", "50B", "75B", "100B", "200B", "300B", "500B", "700B", "1T"];
const WALLET_TERMS = [
  "your 0x wallet",
  "your EVM wallet",
  "$ETH wallet address",
  "$BASE wallet address",
  "$POL wallet address",
  "MetaMask wallet",
  "EVM chain address"
];
const TEMPLATES = [
  "🚀 Win {amount} $NFTFAN tokens! RT, Like & Follow @nftfanstoken – Drop {wallet} below 👇",
  "💸 Claim {amount} $NFTFAN! Smash RT, tap Like, tag a friend, Follow @nftfanstoken & drop {wallet} to win.",
  "🎁 Airdrop: {amount} $NFTFAN! Follow & RT! Drop {wallet} address.",
  "🔥 Giveaway: Win {amount} $NFTFAN. RT, Like & Follow. Paste your {wallet} below.",
  "💎 $NFTFAN love! {amount} tokens: RT, Like & Follow @nftfanstoken. Drop {wallet} below.",
  "🏆 RT, Like, Follow for {amount} $NFTFAN! Drop your {wallet} for a chance.",
  "🎉 Party airdrop: {amount} $NFTFAN – RT, Like, Follow, and drop your {wallet}.",
  "⚡ Flash: Win {amount} $NFTFAN! RT, Like, Follow. Reply with {wallet}!",
  `🚀 Bonus: {amount} $NFTFAN + Join TG: ${TG_LINK}. RT, Like, Follow & leave {wallet}!`,
  `💰 Pre-Sale: ${QUICKBUY_LINK} 🛒 Win {amount} $NFTFAN – RT, Like, Follow, drop {wallet}!`,
  // ... Add more templates if you want
];

// --- POST TWEETS LOGIC ---
function getRandomAmount() {
  return AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];
}
function getRandomWalletTerm() {
  return WALLET_TERMS[Math.floor(Math.random() * WALLET_TERMS.length)];
}
function getRandomTweetText() {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const amount = getRandomAmount();
  const wallet = getRandomWalletTerm();
  return template.replace(/\{amount\}/g, amount).replace(/\{wallet\}/g, wallet);
}
async function postTweet() {
  try {
    const text = getRandomTweetText();
    const { data } = await client.v2.tweet(text);
    console.log(`[${new Date().toISOString()}] Tweeted: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Tweet failed:', error);
  }
}

// --- WALLET COLLECTOR & SENDER LOGIC ---
function extractEvmWallets(text) {
  if (!text) return [];
  const regex = /\b0x[a-fA-F0-9]{40}\b/g;
  return text.match(regex) || [];
}
async function isWalletSent(wallet) {
  const checksum = wallet.toLowerCase();
  const refPath = `evm-giveaway-wallets/${checksum}`;
  const walletRef = ref(db, refPath);
  const snapshot = await get(walletRef);
  return snapshot.exists();
}
async function markWalletSent(wallet) {
  const checksum = wallet.toLowerCase();
  const refPath = `evm-giveaway-wallets/${checksum}`;
  const walletRef = ref(db, refPath);
  await set(walletRef, { sentAt: Date.now() });
}

async function fetchUpToNRepliesFromUserTweets(maxReplies = 90) {
  const { data: tweets } = await client.v2.userTimeline(TWITTER_USER_ID, { max_results: 5 });
  const tweetIds = tweets?.map(t => t.id) || [];
  let resultReplies = [];
  for (const tweetId of tweetIds) {
    if (resultReplies.length >= maxReplies) break;
    const conv_query = `conversation_id:${tweetId}`;
    const paginator = await client.v2.search(conv_query, { max_results: 100 });
    for await (const tweet of paginator) {
      if (tweet?.author_id && tweet.author_id === TWITTER_USER_ID) continue;
      if (resultReplies.length < maxReplies) resultReplies.push(tweet);
      else break;
    }
    if (resultReplies.length >= maxReplies) break;
  }
  return resultReplies.slice(0, maxReplies);
}

// --- MAIN 24H WALLET RUNNER ---
async function walletCollectorAndSender() {
  console.log(`[${new Date().toISOString()}] Wallet collector started...`);
  // 1. Fetch up to 90 replies from latest tweets
  const replies = await fetchUpToNRepliesFromUserTweets(90);
  // 2. Extract/dedupe
  const allWallets = [];
  for (const reply of replies) {
    const wallets = extractEvmWallets(reply.text);
    for (const wallet of wallets) {
      if (!allWallets.includes(wallet.toLowerCase())) {
        allWallets.push(wallet.toLowerCase());
        if (allWallets.length >= 90) break;
      }
    }
    if (allWallets.length >= 90) break;
  }
  // 3. Only send not-yet-sent (firebase)
  const walletsToSend = [];
  for (const wallet of allWallets) {
    if (!(await isWalletSent(wallet))) {
      walletsToSend.push(wallet);
      if (walletsToSend.length >= 90) break;
    }
  }
  // 4. Schedule 1 every 16min over 24h
  const delayMinutes = 16;
  walletsToSend.forEach((wallet, idx) => {
    setTimeout(async () => {
      try {
        const msg = `🎁 New EVM wallet from X giveaway:\n<code>${wallet}</code>\nEligible for $NFTFAN airdrop!`;
        await bot.sendMessage(TARGET_CHAT_ID, msg, { parse_mode: 'HTML' });
        await markWalletSent(wallet);
        console.log(`[${new Date().toISOString()}] Sent wallet #${idx + 1}: ${wallet}`);
      } catch (err) {
        console.error('Telegram send error:', err);
      }
    }, idx * delayMinutes * 60 * 1000);
  });
  console.log(`Ready to send ${walletsToSend.length} wallets, spaced every ${delayMinutes} min.`);
}


// === SCHEDULING ===

// Tweet on startup
postTweet();
// Tweet every hour on the hour
cron.schedule('0 * * * *', () => postTweet());

// Run wallet collector every 24h (0700 UTC), or switch time as desired
cron.schedule('0 7 * * *', () => walletCollectorAndSender());
console.log('NFTFAN MegaBot started! Posting tweet every hour, collecting X wallets every 24h (or on demand).');

// You can also run wallet collector/sender at startup if you want:
walletCollectorAndSender();
