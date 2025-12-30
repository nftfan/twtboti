import 'dotenv/config';
import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';

import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

const TG_LINK = "https://t.me/nftfanstokens";
const DM_TEXT = `🔥 $NFTFAN airdrop is going on in TG: ${TG_LINK}`;

// --- Firebase Setup ---
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

/**
 * Fetch up to 3 unique Twitter usernames (strings) from Firebase whose group.status !== "done".
 * Also marks those groups as handled ("done").
 */
async function getUsernamesFromFirebase(limit = 3) {
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
      for (const username of group.usernames) {
        if (selected.length >= limit) break;
        selected.push(username);
      }
      usedKeys.push(key);
      if (selected.length >= limit) break;
    }

    // Mark used groups as done (if any used)
    const updates = {};
    usedKeys.forEach(k => updates[`groups/${k}/status`] = "done");
    if (Object.keys(updates).length) await update(ref(db), updates);

    return selected;
  } catch (error) {
    console.error('Could not fetch usernames:', error);
    return [];
  }
}

/**
 * Given a Twitter username (without @), uses Twitter API to DM the message.
 */
async function sendDmToUser(username, text) {
  try {
    // 1. Get user ID
    const user = await client.v2.userByUsername(username);
    const userId = user?.data?.id;
    if (!userId) throw new Error(`No userId found for username: ${username}`);

    // 2. Send DM (as per Twitter API v2 endpoint)
    // Twitter's Endpoint: POST /2/dm_conversations/with/:participant_id/messages
    // see https://developer.twitter.com/en/docs/twitter-api/direct-messages/quick-start
    await client.v2.post(`dm_conversations/with/${userId}/messages`, {
      text,
    });

    console.log(`[${new Date().toISOString()}] DM sent to ${username}`);
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] DM failed to @${username}:`, error?.data || error.message || error);
    return false;
  }
}

/**
 * Main function: every hour, get up to 3 usernames, DM each "airdrop" message.
 */
async function sendAirdropDms() {
  const usernames = await getUsernamesFromFirebase(3);
  if (usernames.length === 0) {
    console.log(`[${new Date().toISOString()}] No usernames available for DM.`);
    return;
  }

  for (const username of usernames) {
    await sendDmToUser(username, DM_TEXT);
    // Optional: small delay to avoid API flood/rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
}

// --- NO tweets anymore ---
// (You may comment out or remove tweet-related code)

// --- Cron Job: Send DMs every hour ---
cron.schedule('0 * * * *', sendAirdropDms); // On the hour, every hour

// Optional: run immediately on launch if you want
sendAirdropDms();
