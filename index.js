import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET
});

// Random SOL amount between 0.1 and 1.0, two decimals
function getRandomAmount(min = 0.1, max = 1.0) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Array of simple airdrop tweet templates using {amount}
const AIRDROP_TEMPLATES = [
  "{amount} $SOL drop Solana wallet",
  "Drop your Solana wallet for a chance at {amount} $SOL!",
  "Airdrop: {amount} $SOL! Comment your SOL address below",
  "Giving away {amount} $SOL. Drop your Sol address now!",
  "Win {amount} $SOL - just comment your Solana wallet",
  "Who wants {amount} $SOL? Put your address below!",
  "{amount} $SOL up for grabs 🚀 Solana wallet below 👇",
  "Quick drop! {amount} $SOL. Paste your wallet.",
  "{amount} $SOL airdrop happening now! Sol wallet in comments.",
  "Claim {amount} $SOL! Drop address to enter.",
  "Easy $SOL giveaway: {amount} $SOL, wallet in comments!",
];

// Randomly select template and fill in amount
function getRandomAirdropTweet() {
  const template = AIRDROP_TEMPLATES[Math.floor(Math.random() * AIRDROP_TEMPLATES.length)];
  return template.replace('{amount}', getRandomAmount());
}

// Post the tweet
async function postAirdropTweet() {
  try {
    const text = getRandomAirdropTweet();
    const { data } = await client.v2.tweet(text);
    console.log(`[${new Date().toISOString()}] Airdrop Tweeted: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Airdrop tweet failed:', error);
  }
}

// Tweet every hour, on the hour
cron.schedule('0 * * * *', postAirdropTweet);

// Post once on launch
postAirdropTweet();
