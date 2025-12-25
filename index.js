// ... (imports, config, Firebase/Twitter initialization, etc) ...

// Tagline & CTA variations for engagement
const CTAS = [
  "Tag a friend to boost your luck 🍀",
  "Tag 2 friends for an extra chance!",
  "Invite 1 friend for a bonus entry!",
  "Double your chance: tag 2 friends!",
  "Bonus drop if your tagged friend joins!",
  "Tag a crypto buddy now!",
  "Friends invited = more winners!",
  "Invite people & win together!",
  "Ask your friends to follow for extra rewards!",
  "Tag your NFT fam below!",
  "Spread the love and tag a mate!",
  "Let’s make it viral! RT + tag pals!",
  "Who should get rich with you? Tag them!"
];

// 48 unique templates, incorporating mentions, CTAs, and TG/pre-sale
const USER_TEMPLATES = [
  // 0-11: Day/Night & Tag A Friend
  "🚀 {amount} $SOL for you, {mentions}! RT, Like, follow @nftfanstoken & tag a friend to double your luck!",
  "💸 Airdrop call: {amount} $SOL up for grabs {mentions}! Smash RT, Like & tag a friend below.",
  "🎁 {mentions}, win {amount} $SOL + special TG drop! RT, Like & tag 1 friend & join our TG: https://t.me/nftfanstokens",
  "⚡ Fast drop! {amount} $SOL for {mentions} — RT, Like, follow @nftfanstoken & tag a friend to enter.",
  "🔥 Hot {amount} $SOL airdrop for {mentions}! Tag 2 friends & follow @nftfanstoken for max entries!",
  "📢 Surprise: {amount} $SOL might be yours, {mentions}! Tag a buddy, follow & RT for entry.",
  "🎉 Party: {amount} $SOL for {mentions}! Tag your bestie & join our TG!",
  "🤩 Don’t miss {amount} $SOL — {mentions}, tag your NFT crew for a special bonus.",
  "🌊 Wave of rewards: {amount} $SOL for {mentions}. Tag pals & join TG: https://t.me/nftfanstokens",
  "💚 {mentions}, show SOL love! RT, Like, tag a friend—more tags = more luck!",
  "😎 {mentions}, win {amount} $SOL by RT, Like & tagging two friends you want to celebrate with!",
  "💥 Big drop! {amount} $SOL for {mentions} — tag friends, RT, Like, and follow @nftfanstoken.",
  // 12-23: Telegram/Bonus/Pre-sale
  "🪂 {amount} $SOL up for {mentions}! Tag a friend and join TG: https://t.me/nftfanstokens.",
  "🎯 Airdrop for {mentions}: {amount} $SOL! Tag friends & follow for extra.",
  "🏆 Win {amount} $SOL, {mentions}! Tag, Like & RT, then join TG for more.",
  "⚡️ Fast pass: {mentions} in for {amount} $SOL, but only if you tag a buddy!",
  "🤑 {mentions}, claim {amount} $SOL + BONUS 5B $NFTFAN! Tag & RT now!",
  "😱 Huge {amount} $SOL drop + NFTFAN bonus for {mentions}! Tag a friend for better odds.",
  "🏅 {mentions} — {amount} $SOL winner could be you! Invite friends & join TG.",
  "🚨 Don’t miss: {amount} $SOL + TG bonus for {mentions}. Tag 2 to qualify!",
  "🌟 Double luck for {mentions}: {amount} $SOL + NFTFAN — tag your airdrop squad!",
  "🔥 Get {amount} $SOL & $NFTFAN pre-sale chance, {mentions}! Details: https://www.nftfanstoken.com/quickbuynft/. Tag to unlock!",
  "⏰ {amount} $SOL drop + NFTFAN pre-sale for {mentions}. Tag a fellow collector.",
  "💰 Not just {amount} $SOL, {mentions}! Tag a friend & grab NFTFAN at presale.",
  // 24-35: Themed Events & Milestone/Hype
  "🎉 {mentions}, festival drop: {amount} $SOL RT and tag a friend to enter!",
  "🏆 Loyal fans like {mentions} win {amount} $SOL — tag the best supporter you know!",
  "🎈 Surprise drop for {mentions}: {amount} $SOL + more in TG. Tag to open the box!",
  "🥳 Celebration time! {mentions}, {amount} $SOL for you & a tagged friend who follows.",
  "🟢 Early supporter rewards: {amount} $SOL for {mentions}! Tag a newcomer—double win.",
  "🎊 Milestone airdrop! {mentions}, claim {amount} $SOL by tagging a mate & RT.",
  "🌟 Exclusive for {mentions}, tag 2 for secret bonus $NFTFAN drop!",
  "🔔 Special hours: {mentions} can win {amount} $SOL. Tag NFT/crypto friends to join.",
  "🌙 Night owl drop for {mentions}: tag a friend and like for a shot at {amount} $SOL.",
  "🌞 Daytime boost! {mentions}, {amount} $SOL up for grabs. Tag & celebrate.",
  "🎤 Shout out: {mentions}, win {amount} $SOL and let the world know—tag a friend!",
  "👀 Lurkers like {mentions} win {amount} $SOL. Tag another lurker in comments!",
  // 36-47: Classic, Surprises, Multiple Socials
  "🍀 Lucky {mentions}, {amount} $SOL could be yours! Tag to activate extra luck.",
  "🚨 Epic drop! {mentions} scored a chance at {amount} $SOL. Tag & RT for max chance.",
  "🎊 Surprise (@) bonus drop: {mentions}, tag below and join TG for hidden rewards.",
  "🦾 Hardcore fans—{mentions}: {amount} $SOL for you. Bring a friend by tagging!",
  "🎯 Your call, {mentions}! Tag a pal to share the $SOL win.",
  "💡 Smart move! {mentions}, tag a friend, RT, and Like for chance at {amount} $SOL.",
  "🎉 Your shot at {amount} $SOL: {mentions}, tag 2 for doubled chance.",
  "💎 Loyal {mentions}, RT, tag a friend & score more $SOL!",
  "💥 Classic drop: {amount} $SOL for {mentions}. Tag a friend for instant bonus.",
  "💬 Join TG: https://t.me/nftfanstokens {mentions} — and tag to win {amount} $SOL.",
  "🌍 Worldwide {amount} $SOL drop: {mentions}, tag a friend & spread airdrop love.",
  "✨ Who’s next? {mentions}, tag a friend so they don’t miss out on {amount} $SOL!",
];

// --- Util: random CTA for occasional insertion
function getRandomCTA() {
  return CTAS[Math.floor(Math.random() * CTAS.length)];
}

// --- Compose one of 48 unique user-mention tweets, fill with usernames ---
function getUserMentionTweetText(usernames, tweetIndex = 0) {
  // Compose mentions. If less than 3 left, use whatever is provided.
  let mentions = usernames.map(u => (u.startsWith('@') ? u : '@' + u)).join(' ');
  // Pick one of the 48 templates, cycle by index of tweet per day
  const template = USER_TEMPLATES[tweetIndex % USER_TEMPLATES.length];
  // Optionally insert a random CTA, to further vary
  let text = template.replace('{mentions}', mentions)
                     .replace(/\{amount\}/g, getRandomAmount());
  // To add more variety, insert a CTA to every few tweets
  if (tweetIndex % 3 === 0 && Math.random() < 0.7) {
    text += ' ' + getRandomCTA();
  }
  return text;
}

// --- Track which of 48 to post (optionally store in DB or process memory) ---
let userMentionTweetCount = 0; // Reset every day if needed

// --- Main Function for User Invite Tweet --- //
async function postUsernameInviteTweet() {
  try {
    const usernames = await getUsernamesFromFirebase(3); // get 3 users only
    if (usernames.length === 0) {
      console.log('No usernames available for the username invite tweet.');
      return;
    }
    // Use the current count as index, then increment
    const tweetText = getUserMentionTweetText(usernames, userMentionTweetCount);
    userMentionTweetCount = (userMentionTweetCount + 1) % USER_TEMPLATES.length;
    const { data } = await client.v2.tweet(tweetText);
    console.log(`[${new Date().toISOString()}] Username Invite Tweet: ${data.text} (ID: ${data.id})`);
  } catch (error) {
    console.error('Username invite tweet failed:', error);
  }
}

// ... (rest of your code: cron jobs, etc) ...
