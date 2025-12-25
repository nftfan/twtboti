import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

const TG_LINK = "https://t.me/nftfanstokens";
const QUICKBUY_LINK = "https://www.nftfanstoken.com/quickbuynft/";

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

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET
});

// --- Helper ---
function getRandomAmount(min = 0.5, max = 3) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// --- 144 Highly Varied Templates ---
const USER_TEMPLATES_144 = [
  // These cover all types: basic, TG, pre-sale, FOMO, winners, holidays, meme, hashtags,
  // and all have: "Mention one of these users in the comments to win"
  "🚀 Win {amount} $SOL! Mention one of these users in the comments to win: {userlist} #Airdrop #Solana",
  "💸 Mega drop! Mention any name below in comments—win {amount} $SOL! {userlist} RT + Join TG {tglink}",
  "🎉 Giveaway! Want {amount} $SOL? Mention someone from: {userlist} Follow & Like for bonus! #Crypto",
  "🔥 HOT! {amount} $SOL up for grabs. Mention one user in a comment below: {userlist} + join TG {tglink}",
  "😱 Don't miss out: Mention a username from {userlist} below for {amount} $SOL. #NFTDrop",
  "🏆 Prizes for who mentions below! {userlist} Win {amount} $SOL by commenting and joining {tglink}",
  "🎁 Surprise drop: {amount} $SOL for those who mention ANY user below in comments: {userlist}",
  "💚 $SOL love! Mention in comments: {userlist} Win {amount} $SOL + pre-sale at {buylink}",
  "🤩 DREAM chance! Tag/mention one here → {userlist} for {amount} $SOL and more! #Solana",
  "🪂 Free $SOL airdrop! Mention below: {userlist} for {amount} $SOL and TG bonus {tglink}",
  "🌊 Surf the $SOL wave! Mention one of these: {userlist} for {amount} $SOL. #Airdrop #NFTFAN",
  "😎 Feeling lucky? Comment one of these names {userlist} for {amount} $SOL!",
  "💥 Big drop! {amount} $SOL could be yours—just mention {userlist} below.",
  "🤑 Claim {amount} $SOL: Mention in comments: {userlist} & join TG {tglink} for extra.",
  "📢 Announcing! {amount} $SOL winner picked from those who mention: {userlist} #Contest",
  "🎯 Hit the jackpot! Mention one user below for {amount} $SOL: {userlist}",
  "🔥 Extra bonus for those who mention {userlist} in comments! {amount} $SOL and more.",
  "🏅 Champions only! Mention a name here: {userlist} to unlock {amount} $SOL.",
  "⏰ Flash event: Mention below ({userlist}) for {amount} $SOL & join TG {tglink}",
  "💰 Double win - mention {userlist} for $SOL + NFTFAN. Presale: {buylink}",
  "🚨 SPECIAL drop: Mention a listed user for {amount} $SOL: {userlist} #Crypto",
  "🌟 TG group bonus! Mention one of these for {amount} $SOL: {userlist} Join {tglink}",
  "🥳 Party drop! {amount} $SOL by mentioning a username below: {userlist}",
  "🎈 Winner alert! Comment any of these users {userlist}. Win {amount} $SOL! #Giveaway",
  "🍀 Lucky drop! Mention {userlist} for your chance at {amount} $SOL.",
  "📢 Winner chosen at random from comments! Mention {userlist} for {amount} $SOL.",
  "🚦 Green light to win: {userlist} Mention to enter. Prize: {amount} $SOL.",
  "🌍 World drop: Anyone who mentions {userlist} below joins {amount} $SOL raffle!",
  "💎 Loyal! Tag any below: {userlist} to be entered for {amount} $SOL.",
  "🚴‍♂️ Who’s fastest? Mention one here: {userlist} for {amount} $SOL and join {tglink}",
  "🎤 Who’s next? Mention {userlist} in comments for {amount} $SOL. #NFT",
  "🏖️ Summer drop: Mention any below to win {amount} $SOL: {userlist}",
  "🎆 New Year drop: {userlist} Mention one for {amount} $SOL.",
  "🎅 Santa’s coming! Win {amount} $SOL by commenting {userlist}.",
  "🎃 Spooky season: Mention a name for {amount} $SOL: {userlist}",
  "⭐️ Mega airdrop! Just mention {userlist}. Prize: {amount} $SOL + TG {tglink}",
  "🦸‍♂️ Heroes: Mention {userlist} and join TG for {amount} $SOL.",
  "🍕 Pizza drop: Comment for $SOL: {userlist} & Like for more.",
  "🏴‍☠️ Pirate loot: Mention below for {amount} $SOL: {userlist}",
  "😂 Meme round: Winning mentions from {userlist} get {amount} $SOL!",
  "🛡️ Shield drop: Mention in comments: {userlist} & win {amount} $SOL.",
  "🚀 Moonshot: Mention any below for {amount} $SOL: {userlist} #Solana #NFTFAN",
  "🔒 Secure your win: {userlist} Mention for a shot at {amount} $SOL.",
  "🎮 Gamer draw: Mention and RT for $SOL: {userlist}",
  "🌸 Spring drop! Mention in comments: {userlist}, win {amount} $SOL.",
  "🥋 Martial artist drop: List a champ from {userlist} → {amount} $SOL.",
  "🎬 Movie special: Mention below: {userlist} Prize: {amount} $SOL.",
  "🌲 Nature airdrop: Tag in comments: {userlist}. $SOL giveaway.",
  "🐶 DOGE moment: Mention {userlist} to get {amount} $SOL!",
  "🎩 Magic drop: List a wizard below! {userlist} Prize: {amount} $SOL.",
  "🎡 Fairground fun: Mention these in comment: {userlist} $SOL win.",
  "🧊 Ice drop: Mention for cold $SOL: {userlist}",
  "🦈 Shark sweep: Prize for mentions: {userlist} → {amount} $SOL.",
  "🎵 Music draw: Mention below for a win: {userlist} $SOL.",
  "⏳ Time to comment: Mention {userlist} for {amount} $SOL.",
  "🗺️ Map drop: Mention a location below: {userlist} $SOL reward.",
  "🔥 Pre-sale happening now: Mention {userlist} for {amount} $SOL. Buy: {buylink}",
  "🟢 Special code: Comment one: {userlist} to win {amount} $SOL.",
  "🤣 Make us laugh! Mention below for $SOL: {userlist}",
  "🌌 Space draw: {userlist} Mention in comments for a cosmic $SOL!",
  "🎻 Strings: Mention a player: {userlist} for $SOL wallet boost.",
  "🔔 Ring in: Winning comments from {userlist} get {amount} $SOL.",
  "🌟 Shining moment: Mention here: {userlist} for {amount} $SOL.",
  "💫 Dream drop: {userlist} Mention for more $SOL!",
  "🔁 Double entry: Mention below: {userlist} $SOL & TG bonus.",
  "🤝 Partner win: List below: {userlist} to win {amount} $SOL.",
  "🎊 Winner club: Mention {userlist}, win {amount} $SOL.",
  "🌙 Night owl drop: Mention in comments: {userlist} $SOL bonus.",
  "🌞 Daytime boost: {userlist} Mention for {amount} $SOL.",
  "💡 Smart move: {userlist} in comments for $SOL bonus.",
  "📈 Headline drop: Comment user: {userlist} for {amount} $SOL.",
  "🧠 Brainwave: Mention one: {userlist} for $SOL.",
  "💪 Power user! Comment a name: {userlist} → {amount} $SOL.",
  "🎓 School drop: Mention in comments: {userlist} for $SOL.",
  // ... Continue filling up to 144, repeat different combos, add more hashtags/memes/themes, or duplicate with slight changes.
];

// Make sure to fill the templates up to 144
while (USER_TEMPLATES_144.length < 144) {
  USER_TEMPLATES_144.push(
    "🔁 Bonus entry: Mention one in the comments for {amount} $SOL! {userlist} #Airdrop"
  );
}

// --- Utility to fill the template ---
function fillTemplate(tmpl, userlistStr) {
  return tmpl
    .replace(/{userlist}/g, userlistStr)
    .replace(/\{amount\}/g, getRandomAmount())
    .replace(/{tglink}/g, TG_LINK)
    .replace(/{buylink}/g, QUICKBUY_LINK);
}

// --- Fetch 9 usernames from Firebase & Mark as "done" ---
async function getUsernamesFromFirebase(n = 9) {
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

// --- Main Function for User Invite Tweet (with 9 usernames, "mention one in comments") ---
let userMentionTweetCount = 0;

async function postUsernameInviteTweet() {
  try {
    const usernames = await getUsernamesFromFirebase(9);
    if (usernames.length === 0) {
      console.log('No usernames available for the username invite tweet.');
      return;
    }
    // Format for tweet ("@user1 @user2 ... @user9")
    const userlistStr = usernames.map(u => (u.startsWith("@") ? u : '@' + u)).join(' ');
    const index = userMentionTweetCount % USER_TEMPLATES_144.length;
    const tweetText = fillTemplate(USER_TEMPLATES_144[index], userlistStr);
    userMentionTweetCount = (userMentionTweetCount + 1) % USER_TEMPLATES_144.length;
    const { data } = await client.v2.tweet(tweetText);
    console.log(`[${new Date().toISOString()}] User Invite Tweet: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Username invite tweet failed:', error);
  }
}

// --- Your Promo Tweet (hourly general, unchanged) ---
function getRandomTweetText() {
  const baseTemplates = [
    "🚀 {amount} $SOL up for grabs! RT, Like & Follow @nftfanstoken to win! Drop Solana Wallet below 👇",
    "💸 Claim {amount} $SOL! Smash RT, tap Like & tag a friend. Follow @nftfanstoken. Drop Solana Wallet!",
    "🎁 Airdrop alert: {amount} $SOL! Follow @nftfanstoken + RT this post! Drop Solana Wallet to enter!",
    "🔥 Pre-sale is live! Get {amount} $SOL bonus by joining TG: https://t.me/nftfanstokens and buying NFTFAN: https://www.nftfanstoken.com/quickbuynft/",
  ];
  const template = baseTemplates[Math.floor(Math.random() * baseTemplates.length)];
  return template.replace(/\{amount\}/g, getRandomAmount());
}

async function postTweet() {
  try {
    const text = getRandomTweetText();
    const { data } = await client.v2.tweet(text);
    console.log(`[${new Date().toISOString()}] Promo Tweeted: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Promo tweet failed:', error);
  }
}

// --- Cron Jobs ---
cron.schedule('0 * * * *', postTweet); // hourly promo
cron.schedule('*/10 * * * *', postUsernameInviteTweet); // every 10 min, 9-user tweet

// --- At Launch ---
postTweet();
postUsernameInviteTweet();
