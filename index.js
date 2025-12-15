import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';

const TG_LINK = "https://t.me/nftfanstokens";
const QUICKBUY_LINK = "https://www.nftfanstoken.com/quickbuynft/";

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET
});

// Helper for random float in range, rounded to 2 decimals
function getRandomAmount(min = 0.5, max = 3) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// 35 super-engaging templates with CTAs, promos, and surprises!
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

function getRandomTweetText() {
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const amount = getRandomAmount();
  return template.replace(/\{amount\}/g, amount);
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

// Post immediately on launch
postTweet();

// Every hour on the hour
cron.schedule('0 * * * *', () => {
  postTweet();
});
