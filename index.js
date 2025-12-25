import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';

// --- Firebase ---
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

// Telegram, promo, and quickbuy links
const TG_LINK = "https://t.me/nftfanstokens";
const QUICKBUY_LINK = "https://www.nftfanstoken.com/quickbuynft/";

// --- Firebase Setup (update if needed) ---
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

// --- Twitter API Setup ---
const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET
});

// --- TEMPLATES for HOURLY TWEET ---
function getRandomAmount(min = 0.5, max = 3) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

const TEMPLATES = [
  "🚀 {amount} $SOL up for grabs! RT, Like & Follow @nftfanstoken to win! Drop Solana Wallet below 👇",
  "💸 Claim {amount} $SOL! Smash RT, tap Like & tag a friend. Follow @nftfanstoken. Drop Solana Wallet!",
  "🎁 Airdrop alert: {amount} $SOL! Follow @nftfanstoken + RT this post! Drop Solana Wallet to enter!",
  "⚡ Lightning drop! {amount} $SOL to random RT & Like + must Follow @nftfanstoken. Drop Solana Wallet!",
  "🔥 Hottest giveaway! Win {amount} $SOL 🚀 Follow @nftfanstoken & RT. Wallet below for entry.",
  "📢 Want {amount} $SOL? RT + Like + Follow @nftfanstoken! Drop your Solana wallet to join.",
  "🎉 Party time! Win {amount} $SOL – RT, Like, and Follow @nftfanstoken. Drop Solana Wallet now!",
  "🤩 Don’t miss! {amount} $SOL airdrop 🍀 RT + Like + Follow @nftfanstoken. Drop Solana Wallet!",
  "🌊 Catch the {amount} $SOL wave! RT + Like, Follow @nftfanstoken. Drop your wallet to ride!",
  "💚 Massive $SOL love! Get {amount} $SOL. RT, Like & Follow @nftfanstoken. Drop Solana Wallet!",
  "😎 Ready for {amount} $SOL? RT & Like this, Follow @nftfanstoken, comment Solana wallet! 🔥",
  "💥 {amount} $SOL drop! Join @nftfanstoken family: RT, Like, Follow. Drop Solana Wallet below.",
  "🪂 Free {amount} $SOL! Requirements: RT, Like & Follow @nftfanstoken. Drop wallet for the win.",
  "🎯 Your chance to win {amount} $SOL! RT, Like & Follow @nftfanstoken now! Drop wallet below.",
  "🏆 Who wants {amount} $SOL? RT this, Like, Follow @nftfanstoken. Drop your wallet to enter!",
  "⚡️ Flash giveaway: {amount} $SOL – Like & RT, must Follow @nftfanstoken! Wallet in comments.",
  // Telegram group + bonus promo
  `🤑 Want {amount} $SOL + claim **FREE 5 BILLION $NFTFAN**? RT, Like & Follow @nftfanstoken! Join our TG group: ${TG_LINK} 💎. Drop Solana Wallet!`,
  `😱 Massive $SOL drop + 5B $NFTFAN bonus! RT, Like, Follow @nftfanstoken & join our TG: ${TG_LINK}. Drop Solana Wallet to qualify!`,
  `🏅 {amount} $SOL for followers! Join our TG ${TG_LINK} for **5 BILLION $NFTFAN**. RT + Like + Follow @nftfanstoken. Drop wallet!`,
  `🚨 Don’t miss out: RT, Like, Follow @nftfanstoken for {amount} $SOL plus join TG: ${TG_LINK} for a **5B $NFTFAN** bonus! Drop Solana Wallet.`,
  `🌟 **DOUBLE DROP** – {amount} $SOL + 5 Billion $NFTFAN!! RT, Like, Follow @nftfanstoken + join TG ${TG_LINK}! Drop Solana Wallet.`,
  // Pre-sale shill
  `🔥 Get {amount} $SOL now and **grab $NFTFAN in pre-sale!** Visit: ${QUICKBUY_LINK} 🛒. RT, Like, Follow @nftfanstoken. Drop wallet!`,
  `⏰ {amount} $SOL drop + **Buy $NFTFAN Pre Sale:** ${QUICKBUY_LINK} – RT, Like, and Follow @nftfanstoken. Drop Solana Wallet below!`,
  `💰 Don't just take {amount} $SOL – get early $NFTFAN at pre-sale! ${QUICKBUY_LINK} RT, Like, Follow @nftfanstoken. Drop your wallet!`,
  `🎉 Win {amount} $SOL & buy $NFTFAN before launch! Pre Sale: ${QUICKBUY_LINK} 🚀 RT, Like, Follow @nftfanstoken, drop wallet!`,
  // Combo CTAs
  "👀 Lurkers wanted! Win {amount} $SOL. RT & Like, Follow @nftfanstoken! Join TG and drop wallet to surprise you!",
  `🎈 Win {amount} $SOL! More airdrops in TG: ${TG_LINK} RT, Like, Follow @nftfanstoken, Drop Solana Wallet!`,
  // Classic, more natural airdrop language
  "Drop Solana Wallet below for a surprise {amount} $SOL airdrop! Like, RT & Follow @nftfanstoken to qualify!",
  "Retweet, Like, and Follow @nftfanstoken for a shot at {amount} $SOL! Drop your Solana Wallet now 🍀",
  "Let's make your wallet happy! Drop Solana Wallet, RT, Like, and Follow @nftfanstoken for {amount} $SOL chance.",
  "💎 Loyal followers get {amount} $SOL – just RT, Like, Follow @nftfanstoken & Drop your Solana Wallet! 🚀",
  "🥳 Airdrop celebration: {amount} $SOL – Like, RT, and Follow @nftfanstoken! Drop Solana Wallet for entry.",
  `🚨 $NFTFAN Token pre-sale happening now: ${QUICKBUY_LINK} 🚨 Win {amount} $SOL by RT, Like, Follow @nftfanstoken + Drop Wallet!`,
  `🟢 Early supporters win: {amount} $SOL. Join TG ${TG_LINK} & buy $NFTFAN at presale (${QUICKBUY_LINK}) RT, Like, Follow, drop wallet!`,
  "Drop your Solana Wallet, then RT, Like, & Follow @nftfanstoken for a shot at {amount} $SOL + more surprises coming! 🚀"
];

// Get a random promo tweet
function getRandomTweetText() {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const amount = getRandomAmount();
  return template.replace(/\{amount\}/g, amount);
}

// --- Fetch n Usernames from Firebase & Mark as "done" ---
async function getUsernamesFromFirebase(n = 3) {
  try {
    const snap = await get(ref(db, "groups"));
    if (!snap.exists()) throw new Error("No groups found");
    const groups = snap.val();
    const available = Object.entries(groups).filter(([_, g]) =>
      g.status !== "done" &&
      Array.isArray(g.usernames) &&
      g.usernames.length > 0
    );
    if (available.length === 0) return [];
    
    let selected = [];
    const usedKeys = [];
    for (const [key, group] of available) {
      if (selected.length >= n) break;
      selected.push(...group.usernames);
      usedKeys.push(key);
    }
    selected = selected.slice(0, n);

    // Mark as done
    const updates = {};
    usedKeys.forEach(k => updates[`groups/${k}/status`] = "done");
    if (Object.keys(updates).length) await update(ref(db), updates);

    return selected;
  } catch (error) {
    console.error('Could not fetch usernames:', error);
    return [];
  }
}

// --- Post Random Promo Tweet ---
async function postTweet() {
  try {
    const text = getRandomTweetText();
    const { data } = await client.v2.tweet(text);
    console.log(`[${new Date().toISOString()}] Tweeted: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Promo tweet failed:', error);
  }
}

// --- Post Username Invite Tweet every 30 minutes, 3 users per tweet ---
async function postUsernameInviteTweet() {
  try {
    const usernames = await getUsernamesFromFirebase(3); // get 3 users only
    if (usernames.length === 0) {
      console.log('No usernames available for the username invite tweet.');
      return;
    }
    const tweetText = `Hello, ${usernames.join(' ')} you are invited to claim 5 Billion free $NFTFAN TOKENS, just drop your evm wallet in our TG group: ${TG_LINK}`;
    const { data } = await client.v2.tweet(tweetText);
    console.log(`[${new Date().toISOString()}] Username Invite Tweet: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Username invite tweet failed:', error);
  }
}

// --- Initial Tweets on Launch ---
postTweet();
postUsernameInviteTweet();

// --- Cron Jobs ---
// Main promo tweet every hour (24 times/day):
cron.schedule('0 * * * *', postTweet);

// User-mention (invite) tweet every 30 min (48 times/day), 3 users per tweet:
cron.schedule('*/30 * * * *', postUsernameInviteTweet);
