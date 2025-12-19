import 'dotenv/config';
import cron from 'node-cron';
import Parser from 'rss-parser';
import { TwitterApi } from 'twitter-api-v2';

// --- Firebase ---
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, update } from "firebase/database";

// ================= LINKS =================
const TG_LINK = "https://t.me/nftfanstokens";
const QUICKBUY_LINK = "https://www.nftfanstoken.com/quickbuynft/";

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyC6wYBu-KOXkDmB-84_7OPtY71zBX4FzRY",
  authDomain: "newnft-47bd7.firebaseapp.com",
  databaseURL: "https://newnft-47bd7-default-rtdb.firebaseio.com",
  projectId: "newnft-47bd7",
  storageBucket: "newnftfanstoken.appspot.com",
  messagingSenderId: "172043823738",
  appId: "1:172043823738:web:daf1fcfb7862d7d8f029c3"
};

const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);

// ================= TWITTER =================
const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET
});

// ================= RSS =================
const parser = new Parser();

const FEEDS = [
  {
    name: "BTC",
    url: "https://news.google.com/rss/search?q=bitcoin&hl=en-US&gl=US&ceid=US:en",
    hashtags: "#Bitcoin #BTC #Crypto"
  },
  {
    name: "ETH",
    url: "https://news.google.com/rss/search?q=ethereum&hl=en-US&gl=US&ceid=US:en",
    hashtags: "#Ethereum #ETH #Crypto"
  },
  {
    name: "SOL",
    url: "https://news.google.com/rss/search?q=solana&hl=en-US&gl=US&ceid=US:en",
    hashtags: "#Solana #SOL #Crypto"
  },
  {
    name: "ETF",
    url: "https://news.google.com/rss/search?q=crypto+etf&hl=en-US&gl=US&ceid=US:en",
    hashtags: "#CryptoETF #BitcoinETF #Markets"
  }
];

// ================= PROMO TEMPLATES =================
function getRandomAmount(min = 0.5, max = 3) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

const TEMPLATES = [
  "🚀 {amount} $SOL up for grabs! RT, Like & Follow @nftfanstoken to win! Drop Solana Wallet 👇",
  "🎁 Airdrop alert: {amount} $SOL! Follow @nftfanstoken + RT! Drop Solana Wallet!",
  `🔥 Win {amount} $SOL + claim **FREE 5B $NFTFAN** — Join TG ${TG_LINK}. RT, Like & Follow @nftfanstoken!`,
  `🚨 Pre-sale live: ${QUICKBUY_LINK} 🚀 RT, Like & Follow @nftfanstoken — drop wallet for {amount} $SOL!`
];

function getRandomTweetText() {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  return template.replace(/\{amount\}/g, getRandomAmount());
}

// ================= FIREBASE HELPERS =================
async function hasHeadlineBeenTweeted(title) {
  const snap = await get(ref(db, `tweeted_headlines/${encodeURIComponent(title)}`));
  return snap.exists();
}

async function saveHeadline(title) {
  await set(ref(db, `tweeted_headlines/${encodeURIComponent(title)}`), {
    title,
    timestamp: Date.now()
  });
}

// ================= RSS HEADLINE TWEET =================
async function postHeadlineTweet() {
  try {
    const feed = FEEDS[Math.floor(Math.random() * FEEDS.length)];
    const rss = await parser.parseURL(feed.url);

    for (const item of rss.items) {
      if (!item.title) continue;

      const exists = await hasHeadlineBeenTweeted(item.title);
      if (exists) continue;

      const tweetText =
        `Just in: ${item.title}\n\n${feed.hashtags}`;

      const { data } = await client.v2.tweet(tweetText);

      await saveHeadline(item.title);

      console.log(`[HEADLINE] ${feed.name} → ${item.title} (${data.id})`);
      return;
    }

    console.log("No new headlines found.");
  } catch (err) {
    console.error("Headline tweet failed:", err);
  }
}

// ================= PROMO TWEET =================
async function postPromoTweet() {
  try {
    const text = getRandomTweetText();
    const { data } = await client.v2.tweet(text);
    console.log(`[PROMO] ${data.text} (${data.id})`);
  } catch (err) {
    console.error("Promo tweet failed:", err);
  }
}

// ================= USERNAME INVITE =================
async function getUsernamesFromFirebase() {
  const snap = await get(ref(db, "groups"));
  if (!snap.exists()) return [];

  const groups = snap.val();
  const available = Object.entries(groups).filter(([_, g]) =>
    g.status !== "done" &&
    Array.isArray(g.usernames) &&
    g.usernames.length > 0
  );

  let selected = [];
  let updates = {};

  for (const [key, group] of available) {
    if (selected.length >= 6) break;
    selected.push(...group.usernames);
    updates[`groups/${key}/status`] = "done";
  }

  if (Object.keys(updates).length) {
    await update(ref(db), updates);
  }

  return selected.slice(0, 6);
}

async function postUsernameInviteTweet() {
  try {
    const usernames = await getUsernamesFromFirebase();
    if (!usernames.length) return;

    const text =
      `Hello ${usernames.join(" ")} 👋\n` +
      `Claim **5 BILLION $NFTFAN TOKENS** — drop EVM wallet in TG:\n${TG_LINK}`;

    const { data } = await client.v2.tweet(text);
    console.log(`[INVITE] ${data.id}`);
  } catch (err) {
    console.error("Username invite failed:", err);
  }
}

// ================= RUN ON START =================
postPromoTweet();
postHeadlineTweet();
postUsernameInviteTweet();

// ================= CRON JOBS =================
cron.schedule('0 * * * *', postPromoTweet);          // Every hour
cron.schedule('*/20 * * * *', postUsernameInviteTweet); // Every 20 min
cron.schedule('*/30 * * * *', postHeadlineTweet);     // Every 30 min
