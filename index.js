import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';

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

// 30 fun, randomizable templates!
const TEMPLATES = [
  "🚀 {amount} $SOL up for grabs! 🌟 Drop Solana Wallet for a chance to win! Drop Solana Wallet",
  "Claim {amount} $SOL easily! 💸 Just Drop Solana Wallet to participate! Drop Solana Wallet",
  "🎉 Giving away {amount} $SOL tokens now! Paste your wallet below ⬇️ Drop Solana Wallet",
  "{amount} $SOL airdrop is LIVE! 🪂 Drop your Solana address! Drop Solana Wallet",
  "Feeling lucky? 🍀 {amount} $SOL could be yours! Drop Solana Wallet",
  "🔥 Get in on the {amount} $SOL bonanza! Drop Solana Wallet and join! Drop Solana Wallet",
  "💎 Shine bright with {amount} $SOL! Drop Solana Wallet 👇 Drop Solana Wallet",
  "Lightning drop! ⚡ Get up to {amount} $SOL! Drop Solana Wallet to enter! Drop Solana Wallet",
  "Who wants {amount} $SOL? 😏 Simply Drop Solana Wallet to claim! Drop Solana Wallet",
  "Let’s make it rain {amount} $SOL 🌧️ Drop Solana Wallet for your chance! Drop Solana Wallet",
  "Airdropping {amount} $SOL right now! 🚁 Paste your Solana wallet! Drop Solana Wallet",
  "Chance to win {amount} $SOL! 🎁 Drop Solana Wallet and join the fun! Drop Solana Wallet",
  "Party time! 🎊 We're sending out {amount} $SOL. Drop Solana Wallet below! Drop Solana Wallet",
  "Unwrap your {amount} $SOL surprise! 🎁 Drop Solana Wallet and get rewarded! Drop Solana Wallet",
  "Catch the {amount} $SOL wave! 🌊 Drop Solana Wallet and hop on! Drop Solana Wallet",
  "{amount} $SOL awaits you! 👀 Drop Solana Wallet to reserve your spot! Drop Solana Wallet",
  "Big $SOL energy! 💥 Grab your {amount} $SOL now, just Drop Solana Wallet! Drop Solana Wallet",
  "Want to boost your bag by {amount} $SOL? 📈 Drop Solana Wallet below! Drop Solana Wallet",
  "Celebrate with us! 🎆 Free {amount} $SOL for you. Drop Solana Wallet! Drop Solana Wallet",
  "Next {amount} $SOL winner is... anyone who Drops Solana Wallet! 🏆 Drop Solana Wallet",
  "Good vibes and {amount} $SOL headed your way! ✨ Drop Solana Wallet right now! Drop Solana Wallet",
  "Let’s spark up your wallet with {amount} $SOL! 🔥 Drop Solana Wallet to light it up! Drop Solana Wallet",
  "Solana season is here! 🏖️ Get {amount} $SOL by dropping your wallet. Drop Solana Wallet",
  "{amount} $SOL is calling... will you answer? 📞 Drop Solana Wallet! Drop Solana Wallet",
  "Stack your $SOL! {amount} is one comment away. Drop Solana Wallet 🎯 Drop Solana Wallet",
  "Spreading the $SOL love! 💚 {amount} could be yours—Drop Solana Wallet! Drop Solana Wallet",
  "Free {amount} $SOL drop for followers! 🔔 Drop Solana Wallet and stay tuned! Drop Solana Wallet",
  "{amount} $SOL drop time! ⏰ Who’s in? Drop Solana Wallet to enroll! Drop Solana Wallet",
  "Major $SOL drip! 💦 Win up to {amount} $SOL, just Drop Solana Wallet! Drop Solana Wallet",
  "Ready, set, DROP! 🚦 {amount} $SOL for a lucky wallet below. Drop Solana Wallet"
];

// Function to generate random tweet text
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

// Schedule: every hour at minute 0
cron.schedule('0 * * * *', () => {
  postTweet();
});
