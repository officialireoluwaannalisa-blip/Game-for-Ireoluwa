// GeminIsland Kids Mode — Safe Filtering, 3D World Highlights, Explorer Dock & Age-5 Learning Labs
// Subjects: Maths, English, Quantitative Reasoning, Qualitative Reasoning, plus Games & Fun.

const KIDS_MODE_STORAGE_KEY = "geminisland_kids_mode_v1";
const KIDS_STARS_STORAGE_KEY = "geminisland_kids_stars_v1";
const KIDS_SPEECH_STORAGE_KEY = "geminisland_kids_speech_v1";

export const KIDS_CATEGORIES = [
  { id: "all", label: "All", color: "#2c7a4b", icon: "🌟", desc: "All kid-friendly spots" },
  { id: "maths", label: "Maths", color: "#0284c7", icon: "🔢", desc: "Counting, shapes & numbers", quizSubject: "maths" },
  { id: "english", label: "English", color: "#7c3aed", icon: "🔤", desc: "ABCs, phonics & stories", quizSubject: "english" },
  { id: "quantitative", label: "Quantitative", color: "#059669", icon: "📐", desc: "Number patterns & logic", quizSubject: "quantitative" },
  { id: "qualitative", label: "Qualitative", color: "#d97706", icon: "🧩", desc: "Sorting, senses & nature", quizSubject: "qualitative" },
  { id: "games", label: "Games", color: "#dc2626", icon: "🎮", desc: "Playful mini-games" },
  { id: "fun", label: "Fun", color: "#0d9488", icon: "🎈", desc: "Music, rides & animals" },
];

export const PLAYABLE_ARCADE_GAMES = [
  {
    id: "car_drive",
    title: "Island Grand Prix",
    shortLabel: "Car Race",
    icon: "🏎️",
    color: "#dc2626",
    categories: ["games", "fun"],
    tip: "Use Arrow Keys to drive & race 3 AI cars!",
  },
  {
    id: "subway_runner",
    title: "Island Surfer",
    shortLabel: "Island Surfer",
    icon: "🏄",
    color: "#0284c7",
    categories: ["games", "fun"],
    tip: "Surf & run the tropical island rails!",
  },
  {
    id: "balloon_pop",
    title: "Sky Balloon Pop",
    shortLabel: "Balloon Pop",
    icon: "🎈",
    color: "#d97706",
    categories: ["games", "fun", "qualitative"],
    tip: "Tap matching color balloons in 3D!",
  },
];

const UNSAFE_FOR_KIDS_RE =
  /\b(pub|tequila|cuervo|cocktail|tiki\s*bar|slot\s*machine|jackpot|bet-winner|spectral\s*manor|haunted|cube\s*labyrinth|cbgb|f-4\s*phantom|fighter\s*jet|nuclear\s*power|drilling\s*rig|ominous|secret\s*bunker)\b/i;

export function isCreationSafeForKids(creation) {
  if (!creation || typeof creation !== "object") return false;
  if (creation.blueprint?.interaction?.kind === "slot_machine") return false;
  const haystack = `${creation.name || ""} ${creation.description || ""}`;
  return !UNSAFE_FOR_KIDS_RE.test(haystack);
}

export function filterWorldForKidsMode(worldData) {
  if (!worldData || !Array.isArray(worldData.creations)) return worldData;
  return {
    ...worldData,
    creations: worldData.creations.filter(isCreationSafeForKids),
  };
}

// Curated subject & activity rules for GeminIsland landmarks and games
const STATION_RULES = [
  // Maths
  {
    match: /connect four/i,
    categories: ["maths", "games"],
    primary: "maths",
    icon: "🔴",
    kidTip: "Count 4 circles in a row!",
    quizSubject: "maths",
  },
  {
    match: /marble coaster/i,
    categories: ["maths", "fun"],
    primary: "maths",
    icon: "🔮",
    kidTip: "Count marbles & hear chimes!",
    quizSubject: "maths",
  },
  {
    match: /clocktower village station/i,
    categories: ["maths", "fun"],
    primary: "maths",
    icon: "🕰️",
    kidTip: "Look at the big clock numbers!",
    quizSubject: "maths",
  },
  {
    match: /clockwork orrery/i,
    categories: ["maths", "qualitative"],
    primary: "maths",
    icon: "🪐",
    kidTip: "Count the spinning planets!",
    quizSubject: "maths",
  },
  {
    match: /celestial astrolabe/i,
    categories: ["maths", "quantitative"],
    primary: "maths",
    icon: "⭐",
    kidTip: "Measure stars & circles!",
    quizSubject: "maths",
  },
  {
    match: /quarryview safety & geology/i,
    categories: ["maths", "qualitative"],
    primary: "maths",
    icon: "🔷",
    kidTip: "Explore rock shapes & sizes!",
    quizSubject: "maths",
  },

  // English
  {
    match: /illuminated letter a/i,
    categories: ["english", "fun"],
    primary: "english",
    icon: "🅰️",
    kidTip: "Giant letter A — A is for Apple!",
    quizSubject: "english",
  },
  {
    match: /colossal block letter l/i,
    categories: ["english", "fun"],
    primary: "english",
    icon: "🇱",
    kidTip: "Giant letter L — L is for Lion!",
    quizSubject: "english",
  },
  {
    match: /meadowbrook central library/i,
    categories: ["english"],
    primary: "english",
    icon: "📚",
    kidTip: "Storybooks, ABCs & reading hall!",
    quizSubject: "english",
  },
  {
    match: /matcha corner bookshop/i,
    categories: ["english"],
    primary: "english",
    icon: "📖",
    kidTip: "Cozy corner picture-book shop!",
    quizSubject: "english",
  },
  {
    match: /wikipedia book club/i,
    categories: ["english"],
    primary: "english",
    icon: "🦉",
    kidTip: "Story circle & fun facts!",
    quizSubject: "english",
  },
  {
    match: /meadow post office/i,
    categories: ["english", "fun"],
    primary: "english",
    icon: "✉️",
    kidTip: "Write letters & send postcards!",
    quizSubject: "english",
  },
  {
    match: /brass compass mapmaker/i,
    categories: ["english", "qualitative"],
    primary: "english",
    icon: "🗺️",
    kidTip: "Storybooks, words & treasure maps!",
    quizSubject: "english",
  },

  // Quantitative Reasoning
  {
    match: /chiptune step sequencer/i,
    categories: ["quantitative", "fun"],
    primary: "quantitative",
    icon: "🎛️",
    kidTip: "Build 8-beat number patterns!",
    quizSubject: "quantitative",
  },
  {
    match: /rune lights-out/i,
    categories: ["quantitative", "games"],
    primary: "quantitative",
    icon: "💠",
    kidTip: "Solve the 3x3 light pattern!",
    quizSubject: "quantitative",
  },
  {
    match: /tic-tac-toe/i,
    categories: ["quantitative", "games"],
    primary: "quantitative",
    icon: "⭕",
    kidTip: "Think ahead for 3 in a row!",
    quizSubject: "quantitative",
  },
  {
    match: /starlight planetarium/i,
    categories: ["quantitative", "qualitative"],
    primary: "quantitative",
    icon: "🔭",
    kidTip: "Compare big & small planets!",
    quizSubject: "quantitative",
  },
  {
    match: /starfall weather/i,
    categories: ["quantitative", "qualitative"],
    primary: "quantitative",
    icon: "🌦️",
    kidTip: "Compare wind & weather numbers!",
    quizSubject: "quantitative",
  },
  {
    match: /hearthstone windmill bakery/i,
    categories: ["quantitative", "fun"],
    primary: "quantitative",
    icon: "🥖",
    kidTip: "Count loaves & measure flour!",
    quizSubject: "quantitative",
  },

  // Qualitative Reasoning
  {
    match: /simon memory synth/i,
    categories: ["qualitative", "games"],
    primary: "qualitative",
    icon: "🟦",
    kidTip: "Match glowing colors & sounds!",
    quizSubject: "qualitative",
  },
  {
    match: /coral reef marine aquarium/i,
    categories: ["qualitative", "fun"],
    primary: "qualitative",
    icon: "🐠",
    kidTip: "Spot ocean fish & sea habitats!",
    quizSubject: "qualitative",
  },
  {
    match: /meadowland natural history/i,
    categories: ["qualitative"],
    primary: "qualitative",
    icon: "🦕",
    kidTip: "Sort dinosaurs, fossils & plants!",
    quizSubject: "qualitative",
  },
  {
    match: /morpho butterfly conservatory/i,
    categories: ["qualitative", "fun"],
    primary: "qualitative",
    icon: "🦋",
    kidTip: "Match colorful butterfly wings!",
    quizSubject: "qualitative",
  },
  {
    match: /quarryside gem & mineral/i,
    categories: ["qualitative", "maths"],
    primary: "qualitative",
    icon: "💎",
    kidTip: "Sort shiny gems by color!",
    quizSubject: "qualitative",
  },
  {
    match: /great meadow apiary/i,
    categories: ["qualitative"],
    primary: "qualitative",
    icon: "🐝",
    kidTip: "Discover how bees make honey!",
    quizSubject: "qualitative",
  },
  {
    match: /paperbark art & watercolor/i,
    categories: ["qualitative", "fun"],
    primary: "qualitative",
    icon: "🎨",
    kidTip: "Mix colors & paint pictures!",
    quizSubject: "qualitative",
  },

  // Games
  {
    match: /whack-a-mole/i,
    categories: ["games", "fun"],
    primary: "games",
    icon: "🐹",
    kidTip: "Tap cheeky gophers as they pop!",
  },
  {
    match: /streetball half-court/i,
    categories: ["games", "fun"],
    primary: "games",
    icon: "🏀",
    kidTip: "Click to shoot the basketball!",
  },
  {
    match: /fiesta mini-golf/i,
    categories: ["games", "fun"],
    primary: "games",
    icon: "⛳",
    kidTip: "Colorful mini-golf course!",
  },
  {
    match: /pickleball court|padel court/i,
    categories: ["games"],
    primary: "games",
    icon: "🎾",
    kidTip: "Sunny ball & paddle court!",
  },

  // Fun
  {
    match: /giant walk-on floor piano/i,
    categories: ["fun", "maths"],
    primary: "fun",
    icon: "🎹",
    kidTip: "Tap or walk on keys to play music!",
  },
  {
    match: /rainbow adventure playground/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🌈",
    kidTip: "Rainbow slides & climbing fun!",
  },
  {
    match: /sunnyvale school bus/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🚌",
    kidTip: "Hop aboard the yellow school bus!",
  },
  {
    match: /waratah train/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🚆",
    kidTip: "Ride the double-decker train!",
  },
  {
    match: /sweet swirl ice cream/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🍦",
    kidTip: "Spot the circling ice cream van!",
  },
  {
    match: /festival fireworks/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🎆",
    kidTip: "Click to launch sky fireworks!",
  },
  {
    match: /clover the golden pup/i,
    categories: ["fun", "qualitative"],
    primary: "fun",
    icon: "🐶",
    kidTip: "Meet Clover, the friendly puppy!",
  },
  {
    match: /starlight unicorn trio/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🦄",
    kidTip: "Visit the magical unicorns!",
  },
  {
    match: /giant white cat/i,
    categories: ["fun", "qualitative"],
    primary: "fun",
    icon: "🐱",
    kidTip: "Say hello to the giant fluffy cat!",
  },
  {
    match: /ancient oak treehouse/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🌳",
    kidTip: "Explore the cozy oak treehouse!",
  },
  {
    match: /sweet corner candy shop/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🍬",
    kidTip: "Bright candy & treat shop!",
  },
  {
    match: /silverbrook clockwork toyshop/i,
    categories: ["fun", "maths"],
    primary: "fun",
    icon: "🧸",
    kidTip: "Wooden trains & wind-up toys!",
  },
  {
    match: /emerald sky drake/i,
    categories: ["fun"],
    primary: "fun",
    icon: "🐉",
    kidTip: "Watch the friendly sky dragon fly!",
  },
  {
    match: /sunny pond mallard/i,
    categories: ["fun", "qualitative"],
    primary: "fun",
    icon: "🦆",
    kidTip: "Watch the duck swim in the pond!",
  },
  {
    match: /beacon hill firehouse/i,
    categories: ["fun", "qualitative"],
    primary: "fun",
    icon: "🚒",
    kidTip: "Visit the town fire station!",
  },
];

const CATEGORY_COLOR_BY_ID = Object.fromEntries(KIDS_CATEGORIES.map((c) => [c.id, c.color]));

export function classifyCreationForKids(creation) {
  if (!isCreationSafeForKids(creation)) return null;
  const name = creation.name || "";
  for (const rule of STATION_RULES) {
    if (rule.match.test(name)) {
      return {
        id: creation.id,
        name,
        categories: rule.categories,
        primary: rule.primary,
        color: CATEGORY_COLOR_BY_ID[rule.primary] || "#2c7a4b",
        icon: rule.icon,
        kidTip: rule.kidTip,
        quizSubject: rule.quizSubject || null,
      };
    }
  }
  return null;
}

// ─── Age-5 Educational Question Bank (Maths, English, Quantitative, Qualitative) ───
export const KIDS_QUIZ_BANK = {
  maths: {
    title: "Maths Island",
    color: "#0284c7",
    intro: "Count, add, subtract, and spot shapes!",
    questions: [
      {
        id: "m1",
        prompt: "How many red apples are there?",
        visual: "🍎 🍎 🍎 🍎",
        options: [
          { label: "3", icon: "3️⃣" },
          { label: "4", icon: "4️⃣" },
          { label: "5", icon: "5️⃣" },
        ],
        answerIndex: 1,
        praise: "Four shiny apples! Great counting!",
        hint: "Touch each apple and count: 1, 2, 3, 4.",
        spotQuery: /windmill bakery|market hall/i,
        spotLabel: "Visit Market Hall in 3D",
      },
      {
        id: "m2",
        prompt: "2 ducks plus 1 more duck makes how many?",
        visual: "🦆 🦆  +  🦆  =  ?",
        options: [
          { label: "2", icon: "2️⃣" },
          { label: "3", icon: "3️⃣" },
          { label: "4", icon: "4️⃣" },
        ],
        answerIndex: 1,
        praise: "2 plus 1 equals 3 little ducks!",
        hint: "Count all the ducks together: 1, 2, 3.",
        spotQuery: /mallard/i,
        spotLabel: "Visit Sunny Pond Mallard",
      },
      {
        id: "m3",
        prompt: "Which shape has 3 pointy sides?",
        visual: "⚪   🔺   🟦",
        options: [
          { label: "Circle", icon: "⚪" },
          { label: "Triangle", icon: "🔺" },
          { label: "Square", icon: "🟦" },
        ],
        answerIndex: 1,
        praise: "Yes! A triangle has 3 sides and 3 corners!",
        hint: "Look for the shape that looks like a pizza slice!",
        spotQuery: /geology academy|gem/i,
        spotLabel: "Visit Gem & Shape Gallery",
      },
      {
        id: "m4",
        prompt: "You have 5 balloons and 2 float away. How many are left?",
        visual: "🎈 🎈 🎈   (💨🎈🎈)",
        options: [
          { label: "3", icon: "3️⃣" },
          { label: "2", icon: "2️⃣" },
          { label: "5", icon: "5️⃣" },
        ],
        answerIndex: 0,
        praise: "5 take away 2 is 3 balloons left!",
        hint: "Count the 3 balloons still waiting on the left.",
        spotQuery: /playground|candy/i,
        spotLabel: "Visit Rainbow Playground",
      },
      {
        id: "m5",
        prompt: "Count all the stars in the night sky!",
        visual: "⭐ ⭐ ⭐ ⭐ ⭐ ⭐",
        options: [
          { label: "4", icon: "4️⃣" },
          { label: "6", icon: "6️⃣" },
          { label: "8", icon: "8️⃣" },
        ],
        answerIndex: 1,
        praise: "Six bright stars! You are a counting superstar!",
        hint: "Count slowly from left to right: 1, 2, 3, 4, 5, 6.",
        spotQuery: /planetarium|astrolabe/i,
        spotLabel: "Visit Starlight Planetarium",
      },
      {
        id: "m6",
        prompt: "2 stars plus 2 stars makes how many?",
        visual: "🌟 🌟  +  🌟 🌟  =  ?",
        options: [
          { label: "3", icon: "3️⃣" },
          { label: "4", icon: "4️⃣" },
          { label: "6", icon: "6️⃣" },
        ],
        answerIndex: 1,
        praise: "2 plus 2 equals 4! Awesome!",
        hint: "Count both pairs together: 1, 2, 3, 4.",
        spotQuery: /connect four/i,
        spotLabel: "Play Connect Four in 3D",
      },
      {
        id: "m7",
        prompt: "Which shape is round with no corners?",
        visual: "🟦   🟡   🔺",
        options: [
          { label: "Square", icon: "🟦" },
          { label: "Circle", icon: "🟡" },
          { label: "Triangle", icon: "🔺" },
        ],
        answerIndex: 1,
        praise: "A circle goes round and round like a wheel!",
        hint: "It looks like a sunny ball or a bus wheel.",
        spotQuery: /marble coaster/i,
        spotLabel: "Visit Marble Coaster",
      },
      {
        id: "m8",
        prompt: "How many puppies are playing on the grass?",
        visual: "🐶 🐶 🐶 🐶 🐶",
        options: [
          { label: "5", icon: "5️⃣" },
          { label: "4", icon: "4️⃣" },
          { label: "7", icon: "7️⃣" },
        ],
        answerIndex: 0,
        praise: "Five happy puppies! Woof woof!",
        hint: "Count on your fingers as you point to each puppy!",
        spotQuery: /golden pup/i,
        spotLabel: "Visit Clover the Golden Pup",
      },
    ],
  },

  english: {
    title: "English & ABCs",
    color: "#7c3aed",
    intro: "Letters, sounds, rhymes, and early words!",
    questions: [
      {
        id: "e1",
        prompt: "Which picture starts with the letter A?",
        visual: "🅰️  —  a, a, ...",
        options: [
          { label: "Apple", icon: "🍎" },
          { label: "Banana", icon: "🍌" },
          { label: "Car", icon: "🚗" },
        ],
        answerIndex: 0,
        praise: "A is for Apple! Ahh-apple!",
        hint: "Listen to the beginning sound: Ahh-apple!",
        spotQuery: /illuminated letter a/i,
        spotLabel: "Visit Giant Letter A",
      },
      {
        id: "e2",
        prompt: "Find the lowercase partner for big letter A!",
        visual: "A  →  ?",
        options: [
          { label: "b", icon: "🅱️" },
          { label: "a", icon: "🔤" },
          { label: "m", icon: "Ⓜ️" },
        ],
        answerIndex: 1,
        praise: "Big A and little a go together!",
        hint: "Look for the round little letter a.",
        spotQuery: /central library/i,
        spotLabel: "Visit Central Library",
      },
      {
        id: "e3",
        prompt: "What letter starts the word CAT?",
        visual: "🐱  _ A T",
        options: [
          { label: "C", icon: "🌙" },
          { label: "B", icon: "🐝" },
          { label: "S", icon: "☀️" },
        ],
        answerIndex: 0,
        praise: "C-A-T spells CAT! Meow!",
        hint: "Say Kuh-kuh-cat! Which letter makes the kuh sound?",
        spotQuery: /giant white cat/i,
        spotLabel: "Visit Giant White Cat",
      },
      {
        id: "e4",
        prompt: "Which word rhymes with HAT?",
        visual: "🎩  HAT  ~  ?",
        options: [
          { label: "Cat", icon: "🐱" },
          { label: "Bus", icon: "🚌" },
          { label: "Fish", icon: "🐠" },
        ],
        answerIndex: 0,
        praise: "Hat and Cat sound the same at the end!",
        hint: "Listen to the ending: h-AT... c-AT!",
        spotQuery: /bookshop|library/i,
        spotLabel: "Visit Corner Bookshop",
      },
      {
        id: "e5",
        prompt: "Which picture starts with the letter L?",
        visual: "🇱  —  lll...",
        options: [
          { label: "Lion", icon: "🦁" },
          { label: "Frog", icon: "🐸" },
          { label: "Duck", icon: "🦆" },
        ],
        answerIndex: 0,
        praise: "L is for Lion! Roar!",
        hint: "Put your tongue up to say Lll-lion!",
        spotQuery: /block letter l/i,
        spotLabel: "Visit Giant Letter L",
      },
      {
        id: "e6",
        prompt: "Which word matches the sunny picture?",
        visual: "☀️",
        options: [
          { label: "SUN", icon: "☀️" },
          { label: "DOG", icon: "🐶" },
          { label: "BED", icon: "🛏️" },
        ],
        answerIndex: 0,
        praise: "S-U-N spells SUN!",
        hint: "Sun starts with the Sss sound!",
        spotQuery: /post office/i,
        spotLabel: "Visit Meadow Post Office",
      },
      {
        id: "e7",
        prompt: "Which picture starts with the letter B?",
        visual: "🐝  —  buh, buh...",
        options: [
          { label: "Bear", icon: "🐻" },
          { label: "Moon", icon: "🌙" },
          { label: "Tree", icon: "🌳" },
        ],
        answerIndex: 0,
        praise: "B is for Bear and Bee!",
        hint: "Say Buh-buh-bear!",
        spotQuery: /apiary/i,
        spotLabel: "Visit Meadow Apiary",
      },
      {
        id: "e8",
        prompt: "Which word rhymes with DOG?",
        visual: "🐶  DOG  ~  ?",
        options: [
          { label: "Frog", icon: "🐸" },
          { label: "Cake", icon: "🎂" },
          { label: "Star", icon: "⭐" },
        ],
        answerIndex: 0,
        praise: "Dog and Frog rhyme! Ribbit-woof!",
        hint: "Listen to the ending: d-OG... fr-OG!",
        spotQuery: /golden pup/i,
        spotLabel: "Visit Clover the Pup",
      },
    ],
  },

  quantitative: {
    title: "Quantitative Reasoning",
    color: "#059669",
    intro: "Number patterns, comparisons & puzzle logic!",
    questions: [
      {
        id: "qn1",
        prompt: "What number comes next in the line?",
        visual: "1  →  2  →  3  →  ?",
        options: [
          { label: "4", icon: "4️⃣" },
          { label: "6", icon: "6️⃣" },
          { label: "2", icon: "2️⃣" },
        ],
        answerIndex: 0,
        praise: "1, 2, 3, 4! You found the pattern!",
        hint: "Count up by 1 after 3.",
        spotQuery: /step sequencer/i,
        spotLabel: "Visit Beat Step Sequencer",
      },
      {
        id: "qn2",
        prompt: "Which box has MORE stars?",
        visual: "Box A: ⭐⭐⭐   |   Box B: ⭐⭐⭐⭐⭐",
        options: [
          { label: "Box A (3)", icon: "📦" },
          { label: "Box B (5)", icon: "🌟" },
        ],
        answerIndex: 1,
        praise: "Box B has 5 stars, and 5 is more than 3!",
        hint: "Look at which side has a longer row of stars.",
        spotQuery: /planetarium/i,
        spotLabel: "Visit Planetarium",
      },
      {
        id: "qn3",
        prompt: "Look at the color pattern! Which comes next?",
        visual: "🔴  🔵  🔴  🔵  ?",
        options: [
          { label: "Red", icon: "🔴" },
          { label: "Blue", icon: "🔵" },
          { label: "Yellow", icon: "🟡" },
        ],
        answerIndex: 0,
        praise: "Red, Blue, Red, Blue, Red! Pattern pro!",
        hint: "Say it out loud: Red, Blue, Red, Blue...",
        spotQuery: /lights-out/i,
        spotLabel: "Play Lights-Out Puzzle",
      },
      {
        id: "qn4",
        prompt: "Count by 2s! What number comes next?",
        visual: "2  →  4  →  6  →  ?",
        options: [
          { label: "7", icon: "7️⃣" },
          { label: "8", icon: "8️⃣" },
          { label: "5", icon: "5️⃣" },
        ],
        answerIndex: 1,
        praise: "2, 4, 6, 8! Skipping by twos!",
        hint: "Add 2 more after 6: seven... eight!",
        spotQuery: /floor piano/i,
        spotLabel: "Play Giant Floor Piano",
      },
      {
        id: "qn5",
        prompt: "You need 4 blocks to build a tower. You have 2. How many MORE do you need?",
        visual: "🧱 🧱  +  ?  =  🧱 🧱 🧱 🧱",
        options: [
          { label: "1 more", icon: "1️⃣" },
          { label: "2 more", icon: "2️⃣" },
          { label: "4 more", icon: "4️⃣" },
        ],
        answerIndex: 1,
        praise: "2 blocks plus 2 more blocks makes 4!",
        hint: "Count up from 2 until you reach 4: three, four.",
        spotQuery: /tic-tac-toe/i,
        spotLabel: "Play Tic-Tac-Toe",
      },
      {
        id: "qn6",
        prompt: "Count backwards like a rocket! What comes next?",
        visual: "5  →  4  →  3  →  ?",
        options: [
          { label: "2", icon: "2️⃣" },
          { label: "6", icon: "6️⃣" },
          { label: "0", icon: "0️⃣" },
        ],
        answerIndex: 0,
        praise: "5, 4, 3, 2, 1 — blast off!",
        hint: "What number comes right before 3?",
        spotQuery: /rocket|weather/i,
        spotLabel: "Visit Weather & Aviation Hall",
      },
      {
        id: "qn7",
        prompt: "Which group has FEWER treats?",
        visual: "Left: 🍪 🍪   |   Right: 🍪 🍪 🍪 🍪 🍪",
        options: [
          { label: "Left (2)", icon: "🍪" },
          { label: "Right (5)", icon: "🍪" },
        ],
        answerIndex: 0,
        praise: "Left has only 2 cookies — 2 is fewer than 5!",
        hint: "Fewer means the smaller amount.",
        spotQuery: /bakery/i,
        spotLabel: "Visit Windmill Bakery",
      },
      {
        id: "qn8",
        prompt: "Finish the sky pattern!",
        visual: "⭐  ⭐  🌙  ⭐  ⭐  ?",
        options: [
          { label: "Moon", icon: "🌙" },
          { label: "Star", icon: "⭐" },
          { label: "Sun", icon: "☀️" },
        ],
        answerIndex: 0,
        praise: "Star, Star, Moon — Star, Star, Moon!",
        hint: "After two stars, what comes next?",
        spotQuery: /astrolabe/i,
        spotLabel: "Visit Celestial Astrolabe",
      },
    ],
  },

  qualitative: {
    title: "Qualitative Reasoning",
    color: "#d97706",
    intro: "Sorting, odd-one-out, opposites & nature clues!",
    questions: [
      {
        id: "ql1",
        prompt: "Which one is NOT an animal? (Odd One Out)",
        visual: "🐶   🐱   🐰   🚌",
        options: [
          { label: "Dog", icon: "🐶" },
          { label: "School Bus", icon: "🚌" },
          { label: "Rabbit", icon: "🐰" },
        ],
        answerIndex: 1,
        praise: "Right! A school bus is a vehicle, not an animal!",
        hint: "Three of these breathe and have fur, one has wheels!",
        spotQuery: /school bus/i,
        spotLabel: "Visit Sunnyvale School Bus",
      },
      {
        id: "ql2",
        prompt: "Which creature belongs in the Ocean?",
        visual: "🌊  Ocean Home",
        options: [
          { label: "Clownfish", icon: "🐠" },
          { label: "Lion", icon: "🦁" },
          { label: "Eagle", icon: "🦅" },
        ],
        answerIndex: 0,
        praise: "Fish swim under the ocean waves!",
        hint: "Who has fins and breathes underwater?",
        spotQuery: /aquarium/i,
        spotLabel: "Visit Marine Aquarium",
      },
      {
        id: "ql3",
        prompt: "What is the OPPOSITE of COLD?",
        visual: "❄️ COLD  ↔  ?",
        options: [
          { label: "Hot", icon: "🔥" },
          { label: "Ice", icon: "🧊" },
          { label: "Snow", icon: "⛄" },
        ],
        answerIndex: 0,
        praise: "Hot is the opposite of Cold!",
        hint: "Think of warm sunshine or cozy fire!",
        spotQuery: /weather/i,
        spotLabel: "Visit Weather Hall",
      },
      {
        id: "ql4",
        prompt: "It starts to rain outside! What should you open?",
        visual: "🌧️  Rainy Day",
        options: [
          { label: "Umbrella", icon: "☂️" },
          { label: "Ice Cream", icon: "🍦" },
          { label: "Football", icon: "⚽" },
        ],
        answerIndex: 0,
        praise: "An umbrella keeps you nice and dry!",
        hint: "What goes over your head to block raindrops?",
        spotQuery: /waterfall/i,
        spotLabel: "Visit Emerald Waterfall",
      },
      {
        id: "ql5",
        prompt: "Which one can you NOT eat?",
        visual: "🍎   🍌   🍇   👟",
        options: [
          { label: "Apple", icon: "🍎" },
          { label: "Sneaker", icon: "👟" },
          { label: "Grapes", icon: "🍇" },
        ],
        answerIndex: 1,
        praise: "You wear sneakers on your feet, you don't eat them!",
        hint: "Three are sweet fruits, one goes on your foot!",
        spotQuery: /market hall|bakery/i,
        spotLabel: "Visit Market Hall",
      },
      {
        id: "ql6",
        prompt: "Which animal is the BIGGEST in real life?",
        visual: "🐭   🐘   🐝",
        options: [
          { label: "Mouse", icon: "🐭" },
          { label: "Elephant", icon: "🐘" },
          { label: "Bee", icon: "🐝" },
        ],
        answerIndex: 1,
        praise: "An elephant is huge and heavy!",
        hint: "Think about which animal has a giant trunk!",
        spotQuery: /natural history museum/i,
        spotLabel: "Visit History Museum",
      },
      {
        id: "ql7",
        prompt: "Which insect makes sweet golden honey?",
        visual: "🌸  🌼  🍯",
        options: [
          { label: "Honeybee", icon: "🐝" },
          { label: "Ant", icon: "🐜" },
          { label: "Spider", icon: "🕷️" },
        ],
        answerIndex: 0,
        praise: "Bzzz! Bees collect flower nectar to make honey!",
        hint: "Listen for the buzzing wings near flowers!",
        spotQuery: /apiary/i,
        spotLabel: "Visit Great Meadow Apiary",
      },
      {
        id: "ql8",
        prompt: "Red paint and Yellow paint mix together to make...",
        visual: "🔴  +  🟡  =  ?",
        options: [
          { label: "Orange", icon: "🟠" },
          { label: "Blue", icon: "🔵" },
          { label: "Black", icon: "⚫" },
        ],
        answerIndex: 0,
        praise: "Red and yellow make bright orange!",
        hint: "Think of the color of a juicy orange or a sunset!",
        spotQuery: /watercolor studio/i,
        spotLabel: "Visit Watercolor Studio",
      },
    ],
  },
};

// ─── WebAudio + Speech Helpers ───────────────────────────────────────────────
let kidsAudioCtx = null;

function playKidsTone(freqs, step = 0.08, dur = 0.16, type = "triangle", gainPeak = 0.07) {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return;
  try {
    if (!kidsAudioCtx) kidsAudioCtx = new Ctor();
    if (kidsAudioCtx.state === "suspended") {
      kidsAudioCtx.resume().catch(() => {});
    }
    if (kidsAudioCtx.state !== "running") return;
    freqs.forEach((f, i) => {
      const t0 = kidsAudioCtx.currentTime + i * step;
      const osc = kidsAudioCtx.createOscillator();
      const g = kidsAudioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(kidsAudioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    });
  } catch {
    // Ignore audio errors
  }
}

export function playKidsSuccessChime() {
  playKidsTone([523.25, 659.25, 783.99, 1046.5], 0.075, 0.2, "triangle", 0.08);
}

export function playKidsTryAgainChime() {
  playKidsTone([330, 293.66], 0.09, 0.16, "sine", 0.05);
}

export function playKidsHopChime() {
  playKidsTone([587.33, 783.99], 0.065, 0.14, "sine", 0.055);
}

// ─── Kids Mode Controller ────────────────────────────────────────────────────
export function createKidsModeController({
  onToggleKidsMode,
  onSelectCategory,
  onFocusCreation,
  onLaunchArcade,
  onSelectQuickPrompt,
  onHighlightUpdate,
  onToast,
}) {
  let enabled = (() => {
    try {
      const v = localStorage.getItem(KIDS_MODE_STORAGE_KEY);
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  })();

  let autoSpeak = (() => {
    try {
      const v = localStorage.getItem(KIDS_SPEECH_STORAGE_KEY);
      return v === null ? true : v === "1";
    } catch {
      return true;
    }
  })();

  let solvedIds = (() => {
    try {
      const raw = localStorage.getItem(KIDS_STARS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  })();

  let activeCategory = "all";
  let explorerCollapsed = false;
  let worldCreations = [];
  let classifiedStations = [];
  let activeSubject = "maths";
  let questionIndexBySubject = { maths: 0, english: 0, quantitative: 0, qualitative: 0 };
  let activeFeedback = null; // { ok: boolean, text: string }

  // DOM Elements
  const topKidsBar = document.getElementById("kids-top-bar");
  const modeToggleBtn = document.getElementById("kids-mode-toggle");
  const modeToggleText = document.getElementById("kids-mode-toggle-text");
  const starsBadge = document.getElementById("kids-stars-badge");
  const starsCountEl = document.getElementById("kids-stars-count");
  const speechToggleBtn = document.getElementById("kids-speech-toggle");
  const speechToggleLabel = document.getElementById("kids-speech-label");

  const explorerDock = document.getElementById("kids-explorer-dock");
  const explorerCollapseBtn = document.getElementById("kids-explorer-collapse");
  const explorerBody = document.getElementById("kids-explorer-body");
  const categoryTabsEl = document.getElementById("kids-category-tabs");
  const subjectBannerEl = document.getElementById("kids-subject-banner");
  const stationStripEl = document.getElementById("kids-station-strip");

  const quizDialog = document.getElementById("kids-quiz-dialog");
  const quickStartersEl = document.getElementById("kids-quick-starters");

  function speakText(text, force = false) {
    if ((!autoSpeak && !force) || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text || ""));
      utter.rate = 0.94;
      utter.pitch = 1.08;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore speech synthesis restrictions
    }
  }

  function saveSolvedIds() {
    try {
      localStorage.setItem(KIDS_STARS_STORAGE_KEY, JSON.stringify([...solvedIds]));
    } catch {
      // Ignore storage quota errors
    }
  }

  function syncTopBar() {
    if (document.body) {
      document.body.dataset.kidsMode = enabled ? "1" : "0";
    }
    if (modeToggleBtn) {
      modeToggleBtn.setAttribute("aria-pressed", enabled ? "true" : "false");
      modeToggleBtn.classList.toggle("is-active", enabled);
    }
    if (modeToggleText) {
      modeToggleText.textContent = enabled ? "Kids Mode: On" : "Kids Mode: Off";
    }
    if (starsBadge) {
      starsBadge.hidden = !enabled;
    }
    if (starsCountEl) {
      starsCountEl.textContent = String(solvedIds.size);
    }
    if (speechToggleBtn) {
      speechToggleBtn.hidden = !enabled;
      speechToggleBtn.setAttribute("aria-pressed", autoSpeak ? "true" : "false");
      speechToggleBtn.classList.toggle("is-active", autoSpeak);
    }
    if (speechToggleLabel) {
      speechToggleLabel.textContent = autoSpeak ? "Voice On" : "Voice Off";
    }
    if (quickStartersEl) {
      quickStartersEl.hidden = !enabled;
    }
    if (explorerDock) {
      explorerDock.hidden = !enabled;
    }
    if (topKidsBar) {
      topKidsBar.hidden = false;
    }
  }

  function buildStationsFromCreations(creations) {
    worldCreations = Array.isArray(creations) ? creations : [];
    const list = [];
    for (const c of worldCreations) {
      const info = classifyCreationForKids(c);
      if (info) list.push(info);
    }
    // Keep predictable priority order matching STATION_RULES order
    const orderIdx = (name) => {
      const idx = STATION_RULES.findIndex((r) => r.match.test(name));
      return idx === -1 ? 999 : idx;
    };
    list.sort((a, b) => orderIdx(a.name) - orderIdx(b.name));
    classifiedStations = list;
  }

  function getFilteredStations() {
    if (activeCategory === "all") return classifiedStations;
    return classifiedStations.filter((st) => st.categories.includes(activeCategory));
  }

  function push3DHighlights() {
    if (!enabled) {
      onHighlightUpdate?.([]);
      return;
    }
    const list = getFilteredStations();
    const catColor = activeCategory === "all" ? null : CATEGORY_COLOR_BY_ID[activeCategory];
    const payload = list.map((st) => ({
      id: st.id,
      color: catColor || st.color,
    }));
    onHighlightUpdate?.(payload);
  }

  function renderCategoryTabs() {
    if (!categoryTabsEl) return;
    categoryTabsEl.innerHTML = "";
    for (const cat of KIDS_CATEGORIES) {
      const count =
        cat.id === "all"
          ? classifiedStations.length
          : classifiedStations.filter((s) => s.categories.includes(cat.id)).length;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `kids-cat-btn${activeCategory === cat.id ? " is-active" : ""}`;
      btn.dataset.category = cat.id;
      btn.setAttribute("aria-pressed", activeCategory === cat.id ? "true" : "false");
      if (activeCategory === cat.id) {
        btn.style.backgroundColor = cat.color;
        btn.style.borderColor = cat.color;
      }
      btn.innerHTML = `<span class="kids-cat-icon" aria-hidden="true">${cat.icon}</span><span class="kids-cat-label">${cat.label}</span><span class="kids-cat-count">${count}</span>`;
      btn.addEventListener("click", () => {
        activeCategory = cat.id;
        playKidsHopChime();
        renderExplorer();
        push3DHighlights();
        onSelectCategory?.(cat);
        if (autoSpeak) {
          speakText(`${cat.label}. ${cat.desc}`);
        }
      });
      categoryTabsEl.appendChild(btn);
    }
  }

  function renderSubjectBanner() {
    if (!subjectBannerEl) return;
    subjectBannerEl.innerHTML = "";
    const activeMeta = KIDS_CATEGORIES.find((c) => c.id === activeCategory);

    if (activeMeta?.quizSubject) {
      const lab = KIDS_QUIZ_BANK[activeMeta.quizSubject];
      const msg = document.createElement("div");
      msg.className = "kids-subject-summary";
      msg.innerHTML = `<span class="kids-subject-title">${activeMeta.icon} ${lab.title}</span><span class="kids-subject-desc">${lab.intro}</span>`;

      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.className = "kids-quiz-launch-btn";
      playBtn.style.backgroundColor = lab.color;
      playBtn.textContent = `Play ${activeMeta.label} Mini-Quiz`;
      playBtn.addEventListener("click", () => openQuiz(activeMeta.quizSubject));

      subjectBannerEl.append(msg, playBtn);
      return;
    }

    // Playable 3D Arcade Games + Quick Educational Labs
    const quickWrap = document.createElement("div");
    quickWrap.className = "kids-quick-labs";

    const arcadeTitle = document.createElement("span");
    arcadeTitle.className = "kids-quick-labs-title";
    arcadeTitle.textContent = "Play 3D:";
    quickWrap.appendChild(arcadeTitle);

    for (const game of PLAYABLE_ARCADE_GAMES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kids-quick-arcade-btn";
      btn.style.backgroundColor = game.color;
      btn.dataset.arcadeLaunch = game.id;
      btn.innerHTML = `<span aria-hidden="true">${game.icon}</span><span>${game.shortLabel}</span>`;
      btn.addEventListener("click", () => {
        btn.blur();
        playKidsHopChime();
        onLaunchArcade?.(game.id, game);
        if (autoSpeak) {
          speakText(`${game.title}! ${game.tip}`);
        }
      });
      quickWrap.appendChild(btn);
    }

    const label = document.createElement("span");
    label.className = "kids-quick-labs-title";
    label.textContent = "Learn:";
    quickWrap.appendChild(label);

    for (const subj of ["maths", "english", "quantitative", "qualitative"]) {
      const cat = KIDS_CATEGORIES.find((c) => c.id === subj);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kids-quick-lab-btn";
      btn.style.borderColor = cat.color;
      btn.style.color = cat.color;
      btn.innerHTML = `<span aria-hidden="true">${cat.icon}</span><span>${cat.label} Quiz</span>`;
      btn.addEventListener("click", () => openQuiz(subj));
      quickWrap.appendChild(btn);
    }

    subjectBannerEl.appendChild(quickWrap);
  }

  function renderStationCards() {
    if (!stationStripEl) return;
    stationStripEl.innerHTML = "";
    const stations = getFilteredStations();
    const activeColor = activeCategory === "all" ? null : CATEGORY_COLOR_BY_ID[activeCategory];

    const matchingArcade =
      activeCategory === "all"
        ? PLAYABLE_ARCADE_GAMES
        : PLAYABLE_ARCADE_GAMES.filter((g) => g.categories.includes(activeCategory));

    for (const game of matchingArcade) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "kids-station-card is-arcade-card";
      card.dataset.arcadeCard = game.id;
      card.style.borderColor = `${game.color}55`;

      const iconEl = document.createElement("span");
      iconEl.className = "kids-station-icon";
      iconEl.style.backgroundColor = `${game.color}1e`;
      iconEl.textContent = game.icon;

      const copyEl = document.createElement("span");
      copyEl.className = "kids-station-copy";

      const titleEl = document.createElement("span");
      titleEl.className = "kids-station-title";
      titleEl.textContent = `PLAY: ${game.title}`;

      const tipEl = document.createElement("span");
      tipEl.className = "kids-station-tip";
      tipEl.textContent = game.tip;

      copyEl.append(titleEl, tipEl);
      card.append(iconEl, copyEl);

      card.addEventListener("click", () => {
        card.blur();
        playKidsHopChime();
        onLaunchArcade?.(game.id, game);
        if (autoSpeak) {
          speakText(`${game.title}! ${game.tip}`);
        }
      });

      stationStripEl.appendChild(card);
    }

    if (stations.length === 0 && matchingArcade.length === 0) {
      const empty = document.createElement("div");
      empty.className = "kids-station-empty";
      empty.textContent = "Loading island spots…";
      stationStripEl.appendChild(empty);
      return;
    }

    for (const st of stations) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "kids-station-card";
      const accent = activeColor || st.color;

      const iconEl = document.createElement("span");
      iconEl.className = "kids-station-icon";
      iconEl.style.backgroundColor = `${accent}18`;
      iconEl.textContent = st.icon;

      const copyEl = document.createElement("span");
      copyEl.className = "kids-station-copy";

      const titleEl = document.createElement("span");
      titleEl.className = "kids-station-title";
      titleEl.textContent = st.name;

      const tipEl = document.createElement("span");
      tipEl.className = "kids-station-tip";
      tipEl.textContent = st.kidTip;

      copyEl.append(titleEl, tipEl);
      card.append(iconEl, copyEl);

      card.addEventListener("click", () => {
        playKidsHopChime();
        onFocusCreation?.(st.id, st);
        onToast?.(`${st.icon} ${st.name} — ${st.kidTip}`);
        if (autoSpeak) {
          speakText(`${st.name}. ${st.kidTip}`);
        }
      });

      stationStripEl.appendChild(card);
    }
  }

  function renderExplorer() {
    if (!explorerDock) return;
    explorerDock.classList.toggle("is-collapsed", explorerCollapsed);
    if (explorerBody) {
      explorerBody.hidden = explorerCollapsed;
    }
    if (explorerCollapseBtn) {
      explorerCollapseBtn.textContent = explorerCollapsed ? "Explore & Learn ▴" : "Hide Guide ▾";
      explorerCollapseBtn.setAttribute("aria-expanded", explorerCollapsed ? "false" : "true");
    }
    renderCategoryTabs();
    renderSubjectBanner();
    renderStationCards();
  }

  // ─── Interactive Learning Quiz Dialog ──────────────────────────────────────
  function findCreationByRegex(regex) {
    if (!regex) return null;
    return worldCreations.find((c) => isCreationSafeForKids(c) && regex.test(c.name || "")) || null;
  }

  function renderQuizDialog() {
    if (!quizDialog) return;
    const bank = KIDS_QUIZ_BANK[activeSubject] || KIDS_QUIZ_BANK.maths;
    const qList = bank.questions;
    const qIdx = (questionIndexBySubject[activeSubject] || 0) % qList.length;
    const q = qList[qIdx];
    const matchingSpot = findCreationByRegex(q.spotQuery);
    const isSolved = solvedIds.has(q.id);

    quizDialog.innerHTML = "";

    const shell = document.createElement("div");
    shell.className = "kids-quiz-shell";

    // Header
    const header = document.createElement("div");
    header.className = "kids-quiz-header";

    const subjectTabs = document.createElement("div");
    subjectTabs.className = "kids-quiz-subjects";
    for (const subj of ["maths", "english", "quantitative", "qualitative"]) {
      const cat = KIDS_CATEGORIES.find((c) => c.id === subj);
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = `kids-quiz-subj-btn${activeSubject === subj ? " is-active" : ""}`;
      if (activeSubject === subj) {
        tab.style.backgroundColor = cat.color;
        tab.style.borderColor = cat.color;
      }
      tab.innerHTML = `<span aria-hidden="true">${cat.icon}</span><span>${cat.label}</span>`;
      tab.addEventListener("click", () => {
        activeSubject = subj;
        activeFeedback = null;
        playKidsHopChime();
        renderQuizDialog();
        const nextQ = KIDS_QUIZ_BANK[subj].questions[questionIndexBySubject[subj] % KIDS_QUIZ_BANK[subj].questions.length];
        if (autoSpeak) speakText(nextQ.prompt);
      });
      subjectTabs.appendChild(tab);
    }

    const actions = document.createElement("div");
    actions.className = "kids-quiz-header-actions";

    const starsPill = document.createElement("span");
    starsPill.className = "kids-quiz-stars";
    starsPill.textContent = `★ ${solvedIds.size}`;

    const speakBtn = document.createElement("button");
    speakBtn.type = "button";
    speakBtn.className = "kids-quiz-speak-btn";
    speakBtn.textContent = "🔊 Read Aloud";
    speakBtn.addEventListener("click", () => speakText(q.prompt, true));

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "cb-close-btn";
    closeBtn.setAttribute("aria-label", "Close learning activity");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => quizDialog.close());

    actions.append(starsPill, speakBtn, closeBtn);
    header.append(subjectTabs, actions);

    // Body
    const body = document.createElement("div");
    body.className = "kids-quiz-body";

    const progressLine = document.createElement("div");
    progressLine.className = "kids-quiz-progress";
    progressLine.textContent = `${bank.title} · Puzzle ${qIdx + 1} of ${qList.length}${isSolved ? " · Star Earned ★" : ""}`;

    const promptEl = document.createElement("h2");
    promptEl.className = "kids-quiz-prompt";
    promptEl.textContent = q.prompt;

    const visualStage = document.createElement("div");
    visualStage.className = "kids-quiz-visual";
    visualStage.textContent = q.visual;

    const optionsGrid = document.createElement("div");
    optionsGrid.className = "kids-quiz-options";
    if (q.options.length === 2) {
      optionsGrid.classList.add("is-two");
    }

    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kids-quiz-option-btn";
      if (activeFeedback?.chosenIdx === idx) {
        btn.classList.add(activeFeedback.ok ? "is-correct" : "is-wrong");
      }
      btn.innerHTML = `<span class="kids-opt-icon" aria-hidden="true">${opt.icon}</span><span class="kids-opt-label">${opt.label}</span>`;
      btn.addEventListener("click", () => {
        const correct = idx === q.answerIndex;
        if (correct) {
          solvedIds.add(q.id);
          saveSolvedIds();
          syncTopBar();
          playKidsSuccessChime();
          activeFeedback = { ok: true, text: q.praise, chosenIdx: idx };
          speakText(q.praise);
        } else {
          playKidsTryAgainChime();
          activeFeedback = { ok: false, text: q.hint, chosenIdx: idx };
          speakText(q.hint);
        }
        renderQuizDialog();
      });
      optionsGrid.appendChild(btn);
    });

    body.append(progressLine, promptEl, visualStage, optionsGrid);

    if (activeFeedback) {
      const fb = document.createElement("div");
      fb.className = `kids-quiz-feedback ${activeFeedback.ok ? "is-correct" : "is-hint"}`;
      fb.textContent = activeFeedback.ok ? `★ ${activeFeedback.text}` : `💡 ${activeFeedback.text}`;
      body.appendChild(fb);
    }

    // Footer
    const footer = document.createElement("div");
    footer.className = "kids-quiz-footer";

    if (matchingSpot) {
      const visitBtn = document.createElement("button");
      visitBtn.type = "button";
      visitBtn.className = "kids-quiz-visit-btn";
      visitBtn.textContent = `${q.spotLabel} →`;
      visitBtn.addEventListener("click", () => {
        quizDialog.close();
        playKidsHopChime();
        onFocusCreation?.(matchingSpot.id);
        onToast?.(`${matchingSpot.name} — ${matchingSpot.description || ""}`);
      });
      footer.appendChild(visitBtn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "kids-quiz-next-btn";
    nextBtn.style.backgroundColor = bank.color;
    nextBtn.textContent = activeFeedback?.ok ? "Next Puzzle →" : "Skip / Next →";
    nextBtn.addEventListener("click", () => {
      questionIndexBySubject[activeSubject] = (qIdx + 1) % qList.length;
      activeFeedback = null;
      playKidsHopChime();
      renderQuizDialog();
      const nextQ = qList[questionIndexBySubject[activeSubject]];
      if (autoSpeak) speakText(nextQ.prompt);
    });
    footer.appendChild(nextBtn);

    shell.append(header, body, footer);
    quizDialog.appendChild(shell);
  }

  function openQuiz(subject = "maths") {
    if (!quizDialog) return;
    activeSubject = KIDS_QUIZ_BANK[subject] ? subject : "maths";
    activeFeedback = null;
    renderQuizDialog();
    if (!quizDialog.open) {
      quizDialog.showModal();
    }
    const qList = KIDS_QUIZ_BANK[activeSubject].questions;
    const q = qList[(questionIndexBySubject[activeSubject] || 0) % qList.length];
    if (autoSpeak) {
      speakText(q.prompt);
    }
  }

  // Bind UI controls
  modeToggleBtn?.addEventListener("click", () => {
    enabled = !enabled;
    try {
      localStorage.setItem(KIDS_MODE_STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // Ignore
    }
    playKidsHopChime();
    syncTopBar();
    push3DHighlights();
    onToggleKidsMode?.(enabled);
    if (enabled) {
      onToast?.("Kids Mode on — Maths, English, Games & Fun highlighted!");
    } else {
      onToast?.("Full Island mode active");
    }
  });

  speechToggleBtn?.addEventListener("click", () => {
    autoSpeak = !autoSpeak;
    try {
      localStorage.setItem(KIDS_SPEECH_STORAGE_KEY, autoSpeak ? "1" : "0");
    } catch {
      // Ignore
    }
    syncTopBar();
    if (autoSpeak) {
      speakText("Voice helper is on!", true);
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });

  explorerCollapseBtn?.addEventListener("click", () => {
    explorerCollapsed = !explorerCollapsed;
    renderExplorer();
  });

  quickStartersEl?.querySelectorAll("[data-kid-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-kid-prompt") || "";
      if (prompt) {
        playKidsHopChime();
        onSelectQuickPrompt?.(prompt);
      }
    });
  });

  function awardStar(starId, reason = "Great job! You earned a Star!") {
    const key = typeof starId === "string" && starId ? starId : `arcade_${Date.now()}`;
    if (!solvedIds.has(key)) {
      solvedIds.add(key);
      saveSolvedIds();
      syncTopBar();
      playKidsSuccessChime();
      onToast?.(`★ ${reason}`, 3400);
      if (autoSpeak) {
        speakText(reason);
      }
      return true;
    }
    return false;
  }

  syncTopBar();
  renderExplorer();

  return {
    isEnabled: () => enabled,
    setWorldCreations(creations) {
      buildStationsFromCreations(creations);
      renderExplorer();
      push3DHighlights();
    },
    openQuiz,
    awardStar,
    getActiveCategory: () => activeCategory,
    setActiveCategory(catId) {
      if (KIDS_CATEGORIES.some((c) => c.id === catId)) {
        activeCategory = catId;
        renderExplorer();
        push3DHighlights();
      }
    },
  };
}
