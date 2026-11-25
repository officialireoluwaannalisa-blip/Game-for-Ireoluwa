// IREOLUWA Learning Academy — curriculum-first learning games for kids.
// Five subject tracks, three age tiers, five activity types, persistent XP/levels,
// daily missions and star rewards. All content is generated or hand-written locally —
// no network calls — so it works fully offline on the static build.

const STORE_KEY = "geminisland_learning_v1";

const TIERS = [
  { id: "seedling", label: "Seedling", ages: "Ages 6–8" },
  { id: "explorer", label: "Explorer", ages: "Ages 9–11" },
  { id: "scholar", label: "Scholar", ages: "Ages 12+" },
];

const LEVELS = [
  { name: "Seedling", xp: 0 },
  { name: "Sprout", xp: 40 },
  { name: "Explorer", xp: 100 },
  { name: "Scholar", xp: 180 },
  { name: "Star Scholar", xp: 280 },
  { name: "Island Sage", xp: 400 },
  { name: "Grandmaster", xp: 550 },
];

export const LEARNING_TRACKS = [
  { id: "maths", label: "Maths", icon: "🔢", color: "#0284c7", blurb: "Number sense, arithmetic, fractions & algebra" },
  { id: "english", label: "English", icon: "🔤", color: "#7c3aed", blurb: "Vocabulary, grammar, spelling & reading" },
  { id: "logic", label: "Logic & Memory", icon: "🧩", color: "#059669", blurb: "Patterns, reasoning & working memory" },
  { id: "science", label: "Science & Nature", icon: "🔬", color: "#d97706", blurb: "Animals, space, body, matter & energy" },
  { id: "world", label: "World & Culture", icon: "🌍", color: "#0d9488", blurb: "Geography, Nigeria, heritage & wonders" },
];

const ALL_TRACK_IDS = LEARNING_TRACKS.map((t) => t.id);

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function uniq(list) {
  return [...new Set(list)];
}
function choiceSet(correct, distractors, count = 4) {
  const pool = uniq(distractors.map(String)).filter((d) => d !== String(correct));
  const chosen = [String(correct)];
  while (chosen.length < count && pool.length) {
    chosen.push(pool.splice(rand(0, pool.length - 1), 1)[0]);
  }
  // Fallback if distractors ran dry: synthesize nearby numbers.
  while (chosen.length < count) {
    const n = Number(correct);
    chosen.push(String(Number.isFinite(n) ? n + rand(1, 20) : `${correct}·${chosen.length}`));
  }
  return shuffle(uniq(chosen)).slice(0, count);
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Question banks (hand-written, kid-safe) ────────────────────────────────
const ENGLISH_QUESTIONS = {
  seedling: [
    { prompt: "Which word rhymes with “cat”?", answer: "hat", distractors: ["dog", "sun", "pig"], tip: "Rhymes share ending sounds." },
    { prompt: "Choose the plural of “dog”.", answer: "dogs", distractors: ["doges", "dogs'", "dogg"], tip: "Add -s to most nouns." },
    { prompt: "What is the opposite of “big”?", answer: "small", distractors: ["huge", "tall", "wide"], tip: "Antonyms are opposites." },
    { prompt: "Pick the correctly spelled word.", answer: "friend", distractors: ["freind", "frend", "fiend"], tip: "“I before E”." },
    { prompt: "Which word starts like “sun”?", answer: "sit", distractors: ["cup", "mango", "leaf"], tip: "Listen to the first sound: /s/." },
    { prompt: "Finish the sentence: “I ___ to school every day.”", answer: "walk", distractors: ["walks", "walked yesterday", "walking now"], tip: "“I” takes the base verb." },
    { prompt: "Choose the naming word (noun).", answer: "table", distractors: ["run", "quickly", "blue-ish"], tip: "Nouns name people, places and things." },
    { prompt: "Which sentence uses a capital letter correctly?", answer: "My name is Ireoluwa.", distractors: ["my name is ireoluwa.", "My name is ireoluwa", "my Name is Ireoluwa"], tip: "Sentences start with a capital." },
    { prompt: "What is the opposite of “hot”?", answer: "cold", distractors: ["warm", "boiling", "sunny"], tip: "Think of ice." },
    { prompt: "Pick the action word (verb).", answer: "jump", distractors: ["chair", "slowly", "green"], tip: "Verbs are doing words." },
    { prompt: "Choose the correct word: “The cat ___ on the mat.”", answer: "sat", distractors: ["sit", "sittings", "sits on"], tip: "Past tense of “sit” is “sat”." },
    { prompt: "Which word describes the sky?", answer: "blue", distractors: ["run", "three", "table"], tip: "Adjectives describe nouns." },
  ],
  explorer: [
    { prompt: "Choose the synonym of “happy”.", answer: "joyful", distractors: ["gloomy", "angry", "tired"], tip: "Synonyms mean almost the same thing." },
    { prompt: "Choose the antonym of “ancient”.", answer: "modern", distractors: ["old", "historic", "dusty"], tip: "Antonyms are opposites." },
    { prompt: "Which sentence is punctuated correctly?", answer: "Where are you going?", distractors: ["Where are you going.", "Where are you going!?!?!", "where are you going?"], tip: "Questions end with a question mark." },
    { prompt: "Pick the correct spelling.", answer: "necessary", distractors: ["neccessary", "necesary", "necassary"], tip: "One “c”, double “s”." },
    { prompt: "Identify the adverb: “The tortoise walked slowly.”", answer: "slowly", distractors: ["tortoise", "walked", "The"], tip: "Adverbs describe how an action happens." },
    { prompt: "Choose the word with the ‘sh’ sound.", answer: "shine", distractors: ["chip", "thimble", "cake"], tip: "/ʃ/ like in “shoe”." },
    { prompt: "What does the prefix “re-” mean in “rewrite”?", answer: "again", distractors: ["before", "not", "one"], tip: "re- = do again." },
    { prompt: "Complete the simile: “As brave as a ___”", answer: "lion", distractors: ["snail", "cat", "chicken"], tip: "Lions are a symbol of courage." },
    { prompt: "Choose the past tense of “teach”.", answer: "taught", distractors: ["teached", "teacht", "teachen"], tip: "teach → taught." },
    { prompt: "Which word is a conjunction?", answer: "because", distractors: ["quickly", "blue", "under"], tip: "Conjunctions join clauses." },
    { prompt: "Read: “Aisha packed her umbrella and boots.” What will the weather be?", answer: "Rainy", distractors: ["Sunny", "Snowy", "Windy only"], tip: "Umbrellas and boots signal rain." },
    { prompt: "Choose the correctly capitalised title.", answer: "The Lion King", distractors: ["the Lion King", "The lion King", "the lion king"], tip: "Style titles with initial capitals." },
  ],
  scholar: [
    { prompt: "Choose the word closest in meaning to “meticulous”.", answer: "careful", distractors: ["careless", "fast", "lazy"], tip: "“Meticulous” = very careful and precise." },
    { prompt: "Choose the word most opposite to “scarce”.", answer: "abundant", distractors: ["rare", "little", "few"], tip: "Scarce ↔ abundant." },
    { prompt: "Identify the clause type: “Because it rained, we stayed indoors.”", answer: "Adverbial clause", distractors: ["Noun clause", "Relative clause", "Main clause"], tip: "It answers “why?”" },
    { prompt: "Which punctuation fixes the splice? “It rained, we stayed in.”", answer: "Use a semicolon or conjunction", distractors: ["Add a comma", "Use a colon", "Delete both clauses"], tip: "Comma splices join two sentences with just a comma." },
    { prompt: "What does the idiom “burn the midnight oil” mean?", answer: "Stay up late working", distractors: ["Waste fuel", "Cook dinner", "Sleep early"], tip: "It refers to working late into the night." },
    { prompt: "Select the sentence in the passive voice.", answer: "The cake was baked by Mum.", distractors: ["Mum bakes the cake.", "Mum is baking the cake.", "Bake the cake, please."], tip: "Passive voice: object + “to be” + past participle." },
    { prompt: "Choose the correct subjunctive: “If I ___ you, I’d apologise.”", answer: "were", distractors: ["was", "am", "be"], tip: "Subjunctive uses “were” for unreal conditions." },
    { prompt: "Which word is spelled correctly?", answer: "accommodation", distractors: ["acommodation", "accomodation", "acomodation"], tip: "Double “c” and double “m”." },
    { prompt: "“Perseverance” contains which root meaning?", answer: "To hold on / continue", distractors: ["To stop", "To break", "To hurry"], tip: "“Sever-” relates to holding firmly; per- = through." },
    { prompt: "Choose the author’s purpose: a notice listing exam times.", answer: "To inform", distractors: ["To persuade", "To entertain", "To argue"], tip: "Notices primarily inform." },
    { prompt: "Read: “Only 3% of light reaches the forest floor.” What does this imply?", answer: "The canopy blocks most sunlight", distractors: ["Trees are dying", "Forests are dark at noon frost", "Light is weak everywhere"], tip: "Infer from cause: dense canopy." },
    { prompt: "Which sentence avoids a dangling modifier?", answer: "Walking to school, I saw a rainbow.", distractors: ["Walking to school, the rainbow was seen.", "Walking to school, a rainbow appeared to me.", "Walking, the school saw a rainbow."], tip: "The subject after the comma must do the walking." },
  ],
};

const SCIENCE_QUESTIONS = {
  seedling: [
    { prompt: "Which animal lives in water and breathes with gills?", answer: "Fish", distractors: ["Eagle", "Goat", "Lizard"], tip: "Gills extract oxygen from water." },
    { prompt: "What do plants need to grow?", answer: "Sunlight and water", distractors: ["Ice cream", "Rocks only", "Darkness"], tip: "Photosynthesis uses light and water." },
    { prompt: "Which season comes after winter?", answer: "Spring", distractors: ["Summer", "Autumn", "Rainy"], tip: "Spring follows winter." },
    { prompt: "What is the centre of our solar system?", answer: "The Sun", distractors: ["The Moon", "The Earth", "Jupiter"], tip: "Planets orbit the Sun." },
    { prompt: "Which body part pumps blood?", answer: "Heart", distractors: ["Lungs", "Stomach", "Brain"], tip: "The heart is a muscle pump." },
    { prompt: "What do bees make?", answer: "Honey", distractors: ["Silk", "Milk", "Wax paper"], tip: "Bees turn nectar into honey." },
    { prompt: "Which of these is a mammal?", answer: "Dolphin", distractors: ["Shark", "Octopus", "Frog"], tip: "Mammals feed babies milk." },
    { prompt: "What is rain made of?", answer: "Water droplets", distractors: ["Salt", "Sand", "Smoke"], tip: "Clouds are water vapour condensed." },
    { prompt: "Which planet do we live on?", answer: "Earth", distractors: ["Mars", "Venus", "Mercury"], tip: "Our home planet." },
    { prompt: "How many legs does a spider have?", answer: "8", distractors: ["6", "4", "10"], tip: "Spiders are arachnids — 8 legs." },
  ],
  explorer: [
    { prompt: "What gas do humans breathe in to survive?", answer: "Oxygen", distractors: ["Carbon dioxide", "Nitrogen", "Helium"], tip: "Cells use oxygen to release energy." },
    { prompt: "Which force pulls objects toward Earth?", answer: "Gravity", distractors: ["Magnetism", "Friction", "Tension"], tip: "Gravity attracts mass toward mass." },
    { prompt: "What is the boiling point of pure water at sea level?", answer: "100°C", distractors: ["0°C", "50°C", "212°C"], tip: "Water boils at 100°C." },
    { prompt: "Which part of the plant makes food?", answer: "Leaves", distractors: ["Roots", "Stem", "Flowers"], tip: "Leaves host photosynthesis." },
    { prompt: "The Moon is a …", answer: "Natural satellite", distractors: ["Star", "Planet", "Comet"], tip: "Satellites orbit planets." },
    { prompt: "Which nutrient builds and repairs body tissue?", answer: "Protein", distractors: ["Sugar", "Fat", "Water"], tip: "Proteins build muscles." },
    { prompt: "What is the largest organ of the human body?", answer: "Skin", distractors: ["Liver", "Brain", "Heart"], tip: "Skin covers and protects us." },
    { prompt: "Which energy transformation happens in a battery-powered torch?", answer: "Chemical → electrical → light", distractors: ["Heat → sound → light", "Light → chemical → heat", "Kinetic → potential → chemical"], tip: "Battery = chemical store." },
    { prompt: "What do we call animals that eat only plants?", answer: "Herbivores", distractors: ["Carnivores", "Omnivores", "Decomposers"], tip: "Herb = plant." },
    { prompt: "Which planet is known as the Red Planet?", answer: "Mars", distractors: ["Jupiter", "Saturn", "Mercury"], tip: "Iron oxide dust makes it red." },
  ],
  scholar: [
    { prompt: "In photosynthesis, plants absorb carbon dioxide and release…", answer: "Oxygen", distractors: ["Nitrogen", "Hydrogen", "Ozone"], tip: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂." },
    { prompt: "Which subatomic particle has a negative charge?", answer: "Electron", distractors: ["Proton", "Neutron", "Photon"], tip: "Electrons orbit the nucleus." },
    { prompt: "What is the chemical symbol for table salt?", answer: "NaCl", distractors: ["KCl", "NaOH", "H₂O"], tip: "Sodium chloride." },
    { prompt: "Which wave type is sound?", answer: "Longitudinal", distractors: ["Transverse", "Electromagnetic", "Standing"], tip: "Compressions and rarefactions." },
    { prompt: "The mitochondria is known as the…", answer: "Powerhouse of the cell", distractors: ["Control centre", "Protein factory", "Storage unit"], tip: "It releases ATP energy." },
    { prompt: "What does “pH 7” mean?", answer: "Neutral", distractors: ["Strong acid", "Strong base", "Weak acid"], tip: "7 is neutral (pure water)." },
    { prompt: "Which organ filters blood and makes urine?", answer: "Kidneys", distractors: ["Liver", "Spleen", "Pancreas"], tip: "Kidneys filter waste." },
    { prompt: "Light travels fastest through…", answer: "Vacuum", distractors: ["Water", "Glass", "Air"], tip: "No particles to slow it." },
    { prompt: "What causes tides on Earth?", answer: "The Moon’s gravity", distractors: ["Wind", "Earthquakes", "Ocean currents"], tip: "The Moon’s pull moves oceans." },
    { prompt: "Which law states energy cannot be created or destroyed?", answer: "Conservation of energy", distractors: ["Newton’s first law", "Ohm’s law", "Boyle’s law"], tip: "Energy only changes form." },
  ],
};

const WORLD_QUESTIONS = {
  seedling: [
    { prompt: "What is the capital of Nigeria?", answer: "Abuja", distractors: ["Lagos", "Kano", "Port Harcourt"], tip: "Abuja became capital in 1991." },
    { prompt: "Which colour is the middle band of the Nigerian flag?", answer: "White", distractors: ["Red", "Yellow", "Blue"], tip: "Green, white, green." },
    { prompt: "Which country is famous for the Great Pyramids?", answer: "Egypt", distractors: ["Kenya", "Morocco", "Ghana"], tip: "Giza, near Cairo." },
    { prompt: "Which ocean borders Nigeria to the south?", answer: "Atlantic Ocean", distractors: ["Indian Ocean", "Pacific Ocean", "Arctic Ocean"], tip: "West Africa faces the Atlantic." },
    { prompt: "Which river is the longest in Nigeria?", answer: "River Niger", distractors: ["River Benue", "River Nile", "River Chad"], tip: "The Niger flows through Nigeria." },
    { prompt: "Which animal is the national bird of Nigeria?", answer: "Eagle", distractors: ["Parrot", "Ostrich", "Vulture"], tip: "The eagle symbolises strength." },
    { prompt: "Which continent are we on?", answer: "Africa", distractors: ["Asia", "Europe", "South America"], tip: "Nigeria is in West Africa." },
    { prompt: "Which fruit is a symbol of hospitality in Nigeria?", answer: "Kola nut", distractors: ["Pineapple", "Mango", "Apple"], tip: "Kola is offered to guests." },
    { prompt: "Which city is known as the commercial hub of Nigeria?", answer: "Lagos", distractors: ["Abuja", "Jos", "Sokoto"], tip: "Lagos is the economic engine." },
    { prompt: "What do we call the harmattan season?", answer: "Dry dusty wind season", distractors: ["Rainy season", "Flood season", "Harvest festival"], tip: "Harmattan blows from the Sahara." },
  ],
  explorer: [
    { prompt: "Which country hosted the 2010 FIFA World Cup?", answer: "South Africa", distractors: ["Nigeria", "Ghana", "Brazil"], tip: "First World Cup on African soil." },
    { prompt: "Who wrote the novel “Things Fall Apart”?", answer: "Chinua Achebe", distractors: ["Wole Soyinka", "Chimamanda Adichie", "Chinua Okeke"], tip: "Achebe published it in 1958." },
    { prompt: "Which mountain is Africa’s highest?", answer: "Kilimanjaro", distractors: ["Mount Kenya", "Mount Cameroon", "Mount Elgon"], tip: "Kilimanjaro is in Tanzania." },
    { prompt: "The Sahara Desert is located in…", answer: "North Africa", distractors: ["Southern Africa", "East Africa", "Central Europe"], tip: "It spans North Africa." },
    { prompt: "Which Nollywood filmmaker directed “Half of a Yellow Sun”?", answer: "Biyi Bandele", distractors: ["Kunle Afolayan", "Genevieve Nnaji", "Edima Dkpaye"], tip: "The 2013 adaptation was directed by Bandele." },
    { prompt: "What is the currency of Nigeria?", answer: "Naira", distractors: ["Cedi", "Rand", "Dollar"], tip: "₦ is the naira sign." },
    { prompt: "Which festival celebrates the end of Ramadan?", answer: "Eid al-Fitr", distractors: ["Christmas", "New Yam", "Sallah only"], tip: "Eid al-Fitr marks Ramadan’s end." },
    { prompt: "Which city is called the “Centre of Excellence” in Nigeria?", answer: "Lagos", distractors: ["Abuja", "Kano", "Ibadan"], tip: "Lagos is “Centre of Excellence”." },
    { prompt: "Which ancient kingdom was famous for bronze art around Benin City?", answer: "Benin Kingdom", distractors: ["Oyo Empire", "Kanem-Borno", "Ife Kingdom"], tip: "Benin Bronzes, c. 1200s+." },
    { prompt: "Which language family do Yoruba and Igbo belong to?", answer: "Niger-Congo", distractors: ["Afro-Asiatic", "Nilo-Saharan", "Indo-European"], tip: "Niger-Congo includes most Nigerian languages." },
  ],
  scholar: [
    { prompt: "Who was the first Governor-General of independent Nigeria (1960)?", answer: "Nnamdi Azikiwe", distractors: ["Tafawa Balewa", "Obafemi Awolowo", "Ahmadu Bello"], tip: "Azikiwe became President in 1963." },
    { prompt: "The Treaty of Versailles (1919) ended which conflict?", answer: "World War I", distractors: ["World War II", "The Boer War", "The Cold War"], tip: "Signed outside Paris." },
    { prompt: "Which line divides the Earth into Northern and Southern Hemispheres?", answer: "Equator", distractors: ["Prime Meridian", "Tropic of Cancer", "Arctic Circle"], tip: "0° latitude." },
    { prompt: "When was the Organization of African Unity (now African Union) founded?", answer: "1963", distractors: ["1957", "1970", "1980"], tip: "Founded in Addis Ababa, 1963." },
    { prompt: "Which Nigerian writer won the Nobel Prize in Literature (1986)?", answer: "Wole Soyinka", distractors: ["Chinua Achebe", "Ben Okri", "Chimamanda Adichie"], tip: "Soyinka, 1986." },
    { prompt: "The Berlin Conference (1884–85) primarily…", answer: "Partitioned Africa among European powers", distractors: ["Ended slavery", "Created the UN", "Unified Germany only"], tip: "“Scramble for Africa”." },
    { prompt: "Which country hosted the 2014 FIFA World Cup final?", answer: "Brazil", distractors: ["Argentina", "Germany", "South Africa"], tip: "Germany won the final in Rio." },
    { prompt: "What is the Great Rift Valley?", answer: "A major tectonic trench system in East Africa", distractors: ["A desert in the Sahara", "A river in Nigeria", "A mountain range in South Africa"], tip: "It shapes East Africa’s lakes and valleys." },
    { prompt: "Which ancient trade route linked West Africa to North Africa for gold and salt?", answer: "Trans-Saharan trade route", distractors: ["Silk Road", "Amber Road", "Incense Route"], tip: "Camel caravans crossed the Sahara." },
    { prompt: "The CARICOM-style bloc ECOWAS was established in…", answer: "1975", distractors: ["1960", "1985", "1999"], tip: "ECOWAS treaty signed in Lagos, 1975." },
  ],
};

const LOGIC_ODD_ONE_OUT = [
  { prompt: "Odd one out: Apple, Banana, Carrot, Grapes", answer: "Carrot", distractors: ["Apple", "Banana", "Grapes"], tip: "Carrot is a vegetable." },
  { prompt: "Odd one out: 2, 4, 6, 9, 10", answer: "9", distractors: ["2", "4", "10"], tip: "9 is odd." },
  { prompt: "Odd one out: Triangle, Square, Circle, Cube", answer: "Cube", distractors: ["Triangle", "Square", "Circle"], tip: "Cube is 3D." },
  { prompt: "Odd one out: Lion, Tiger, Leopard, Elephant", answer: "Elephant", distractors: ["Lion", "Tiger", "Leopard"], tip: "Elephants are not cats." },
  { prompt: "Odd one out: Piano, Guitar, Violin, Flute", answer: "Flute", distractors: ["Piano", "Guitar", "Violin"], tip: "Flute is wind; others are strings/keyboard." },
];

const WORLD_CAPITAL_PAIRS = [
  ["Nigeria", "Abuja"], ["Ghana", "Accra"], ["Kenya", "Nairobi"], ["Egypt", "Cairo"],
  ["South Africa", "Pretoria"], ["Morocco", "Rabat"], ["Ethiopia", "Addis Ababa"], ["Senegal", "Dakar"],
];

const MEMORY_DECKS = {
  maths: {
    label: "Number Facts",
    pairsForTier: { seedling: 6, explorer: 8, scholar: 10 },
    build(tier) {
      const pairs = [];
      const tables = tier === "seedling" ? [2, 5, 10] : tier === "explorer" ? [3, 4, 6, 7, 8] : [6, 7, 8, 9, 12, 13];
      const used = new Set();
      while (pairs.length < 12) {
        const a = pick(tables), b = rand(2, tier === "seedling" ? 5 : 12);
        const key = `${a}×${b}`;
        if (used.has(key)) continue;
        used.add(key);
        pairs.push([`${a} × ${b}`, String(a * b)]);
      }
      return pairs;
    },
  },
  english: {
    label: "Synonym Swap",
    pairsForTier: { seedling: 6, explorer: 8, scholar: 10 },
    build() {
      return shuffle([
        ["happy", "joyful"], ["big", "large"], ["fast", "quick"], ["begin", "start"], ["end", "finish"],
        ["brave", "bold"], ["calm", "peaceful"], ["smart", "clever"], ["shine", "glow"], ["help", "assist"],
        ["sad", "unhappy"], ["small", "tiny"], ["angry", "mad"], ["rich", "wealthy"],
      ]);
    },
  },
  logic: {
    label: "Shape & Colour",
    pairsForTier: { seedling: 6, explorer: 8, scholar: 10 },
    build() {
      return shuffle([
        ["△", "triangle"], ["□", "square"], ["○", "circle"], ["▢", "rectangle"], ["★", "star"],
        ["◆", "diamond"], ["❤", "heart"], ["☀", "sun"], ["☂", "umbrella"], ["⚡", "lightning"],
        ["☁", "cloud"], ["❄", "snowflake"],
      ]);
    },
  },
  science: {
    label: "Habitats",
    pairsForTier: { seedling: 6, explorer: 8, scholar: 10 },
    build() {
      return shuffle([
        ["Fish", "Sea"], ["Camel", "Desert"], ["Penguin", "Antarctica"], ["Frog", "Pond"],
        ["Eagle", "Sky"], ["Mole", "Underground"], ["Polar bear", "Arctic"], ["Monkey", "Rainforest"],
        ["Lion", "Savanna"], ["Owl", "Forest"], ["Crab", "Beach"], ["Giraffe", "Grassland"],
      ]);
    },
  },
  world: {
    label: "Capital Cities",
    pairsForTier: { seedling: 6, explorer: 8, scholar: 10 },
    build() {
      return shuffle(WORLD_CAPITAL_PAIRS.map(([c, cap]) => [c, cap]));
    },
  },
};

const WORD_WIZARD = {
  seedling: ["CAT", "DOG", "SUN", "MAP", "PEN", "BUS", "EGG", "FISH", "STAR", "BIRD"],
  explorer: ["PLANET", "GARDEN", "ROCKET", "FRIEND", "ORANGE", "BRIDGE", "CASTLE", "WINDOW", "MARKET", "FOREST"],
  scholar: ["KNOWLEDGE", "INVENT", "MYSTERY", "LANGUAGE", "HORIZON", "QUANTUM", "DIAMOND", "ACADEMY", "VOLCANO", "GALAXY"],
};

const DAILY_MISSION_TARGET = 3;
const XP = { quizCorrect: 10, quizBonus: 25, memoryComplete: 30, rocketCorrect: 4, rocketBonus: 15, wordCorrect: 8, wordBonus: 15, patternCorrect: 8, patternBonus: 15 };
const TRACK_THRESHOLDS = LEVELS.map((l) => l.xp);

function defaultState() {
  return {
    v: 1,
    xp: 0,
    correct: 0,
    answered: 0,
    streak: 0,
    bestStreak: 0,
    trackXp: Object.fromEntries(ALL_TRACK_IDS.map((id) => [id, 0])),
    completions: {},
    claimedLevels: [],
    totalActivities: 0,
    daily: { date: todayKey(), count: 0, claimed: false },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const d = defaultState();
    const parsed = JSON.parse(raw);
    const merged = { ...d, ...parsed, trackXp: { ...d.trackXp, ...(parsed.trackXp || {}) }, completions: { ...(parsed.completions || {}) } };
    if (!merged.daily || merged.daily.date !== todayKey()) {
      merged.daily = { date: todayKey(), count: 0, claimed: false };
    }
    return merged;
  } catch {
    return defaultState();
  }
}
function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / quota — keep in-memory progress.
  }
}

// ─── Procedural question generators ─────────────────────────────────────────
function mathsQuestion(tier) {
  const r = Math.random();
  if (tier === "seedling") {
    if (r < 0.34) {
      const a = rand(4, 20), b = rand(2, 20);
      return { prompt: `What is ${a} + ${b}?`, answer: String(a + b), distractors: [a + b + 2, a + b - 1, a + b + 10].map(String), tip: "Add the tens, then the ones." };
    }
    if (r < 0.62) {
      const a = rand(8, 30), b = rand(2, a - 1);
      return { prompt: `What is ${a} − ${b}?`, answer: String(a - b), distractors: [a - b + 3, a - b - 2, a - b + 10].map(String), tip: "Count back from the bigger number." };
    }
    if (r < 0.84) {
      const a = rand(2, 5), b = rand(2, 5);
      return { prompt: `What is ${a} × ${b}?`, answer: String(a * b), distractors: [a * b + a, a * b + 1, a * b - b].map(String), tip: `${a} groups of ${b}.` };
    }
    const a = pick([2, 5, 10]);
    const n = rand(2, 6) * a;
    return { prompt: `Count by ${a}s: what comes next? ${a}, ${a * 2}, ${a * 3}, ___`, answer: String(a * 4), distractors: [String(a * 4 + 1), String(a * 5), String(a * 3 + a + 1)], tip: `Keep adding ${a}.` };
  }
  if (tier === "explorer") {
    if (r < 0.3) {
      const a = rand(3, 12), b = rand(3, 12);
      return { prompt: `What is ${a} × ${b}?`, answer: String(a * b), distractors: [a * b + a, a * b + b, a * b - a].map(String), tip: "Use your times-tables." };
    }
    if (r < 0.55) {
      const b = rand(2, 12), q = rand(2, 12);
      return { prompt: `What is ${b * q} ÷ ${b}?`, answer: String(q), distractors: [String(q + 1), String(q + 2), String(Math.max(1, q - 1))], tip: "Division is the inverse of multiplication." };
    }
    if (r < 0.8) {
      const whole = pick([12, 24, 36, 48, 60, 100]);
      const num = pick([1, 2, 3]);
      const den = pick([2, 3, 4, 6]);
      const unit = whole / den;
      if (!Number.isInteger(unit)) return mathsQuestion(tier);
      return { prompt: `What is ${num}/${den} of ${whole}?`, answer: String(unit * num), distractors: [String(unit * num + den), String(unit * (num + 1)), String(whole / num)], tip: `First find 1/${den} of ${whole}.` };
    }
    const n = rand(120, 980);
    return { prompt: `Round ${n} to the nearest 10.`, answer: String(Math.round(n / 10) * 10), distractors: [String(Math.round(n / 10) * 10 + 10), String(Math.floor(n / 100) * 100), String(n - (n % 10) + 5)], tip: "Look at the ones digit: 5+ rounds up." };
  }
  // scholar
  if (r < 0.25) {
    const p = pick([5, 10, 20, 25, 50]);
    const of = pick([40, 60, 80, 120, 200, 240]);
    return { prompt: `What is ${p}% of ${of}?`, answer: String((p / 100) * of), distractors: [String((p / 100) * of + p), String((p / 100) * of * 2), String(of - p)], tip: `${p}% = ${p / 100}.` };
  }
  if (r < 0.5) {
    const a = rand(2, 9);
    const b = rand(2, 9);
    const c = rand(2, 15);
    return { prompt: `Solve: ${a}x + ${c} = ${a * b + c}.  x = ?`, answer: String(b), distractors: [String(b + 1), String(b - 1), String(b + 2)], tip: `Subtract ${c}, then divide by ${a}.` };
  }
  if (r < 0.75) {
    const a = rand(1, 7), b = rand(1, 7), den = pick([3, 4, 5, 6, 8]);
    const sum = a + b;
    return { prompt: `What is ${a}/${den} + ${b}/${den}?`, answer: `${sum}/${den}`, distractors: [`${a + b}/${den * 2}`, `${Math.abs(a - b)}/${den}`, `${sum + 1}/${den}`], tip: "Same denominator — add the numerators." };
  }
  const a = rand(2, 6), b = rand(2, 6);
  return { prompt: `A rectangle is ${a * 3} cm by ${b * 2} cm. What is its area?`, answer: `${a * 3 * b * 2} cm²`, distractors: [`${2 * (a * 3 + b * 2)} cm²`, `${a * 3 + b * 2} cm²`, `${a * b * 6} cm²`], tip: "Area = length × width." };
}

function logicQuestion(tier) {
  const r = Math.random();
  if (r < 0.2) {
    const base = pick(LOGIC_ODD_ONE_OUT);
    return { ...base, choices: choiceSet(base.answer, base.distractors) };
  }
  // Arithmetic sequences with configurable difficulty
  const start = rand(1, tier === "seedling" ? 6 : 12);
  const step = tier === "seedling" ? pick([1, 2, 2, 5]) : tier === "explorer" ? pick([3, 4, 6, 7, 9]) : pick([6, 7, 8, 11, 12, 13]);
  const seq = [start, start + step, start + 2 * step, start + 3 * step];
  const answer = start + 4 * step;
  const alt = tier === "scholar" && Math.random() < 0.4;
  if (alt) {
    // Geometric-ish: doubling pattern
    const s = rand(2, 4);
    const g = [s, s * 2, s * 4, s * 8];
    return { prompt: `What comes next? ${g.join(", ")}, ___`, answer: String(s * 16), distractors: [String(s * 16 + 2), String(s * 12), String(s * 10)], tip: "Each term doubles." };
  }
  return { prompt: `What comes next? ${seq.join(", ")}, ___`, answer: String(answer), distractors: [String(answer + step), String(answer - 1), String(answer + 1)], tip: `Add ${step} each time.` };
}

function trackQuestion(trackId, tier) {
  switch (trackId) {
    case "maths": return mathsQuestion(tier);
    case "logic": return logicQuestion(tier);
    case "english": return pick(ENGLISH_QUESTIONS[tier]);
    case "science": return pick(SCIENCE_QUESTIONS[tier]);
    case "world": return pick(WORLD_QUESTIONS[tier]);
    default: return mathsQuestion(tier);
  }
}
function decorateQuestion(q) {
  if (q.choices) return q;
  return { ...q, choices: choiceSet(q.answer, q.distractors || []) };
}

// ─── Memory decks ───────────────────────────────────────────────────────────
function buildMemoryDeck(trackId, tier) {
  const deck = MEMORY_DECKS[trackId] || MEMORY_DECKS.maths;
  const count = Math.min(deck.pairsForTier[tier] || 6, deck.build(tier).length);
  const pairs = shuffle(deck.build(tier)).slice(0, count);
  const cards = pairs.flatMap(([a, b], i) => [
    { id: `${i}-a`, pair: i, text: a },
    { id: `${i}-b`, pair: i, text: b },
  ]);
  return shuffle(cards);
}

// ─── Factory ────────────────────────────────────────────────────────────────
export function createLearningAcademy({ onReward, onToast, speak } = {}) {
  let dialog = null;
  let state = loadState();
  let view = "home";
  let tier = "explorer";
  let activeTrack = "maths";
  let timerId = null;
  let quizSession = null;
  let rocketSession = null;
  let wordSession = null;
  let patternSession = null;
  let memorySession = null;

  function persist() {
    saveState(state);
  }
  function addXp(amount, trackId) {
    const before = { ...state.trackXp };
    state.xp += amount;
    if (trackId && ALL_TRACK_IDS.includes(trackId)) {
      state.trackXp[trackId] = (state.trackXp[trackId] || 0) + amount;
    }
    persist();
    // Level-ups → star rewards
    for (const id of ALL_TRACK_IDS) {
      const prev = before[id] || 0;
      const next = state.trackXp[id] || 0;
      for (let i = 1; i < TRACK_THRESHOLDS.length; i++) {
        if (prev < TRACK_THRESHOLDS[i] && next >= TRACK_THRESHOLDS[i]) {
          const key = `${id}-lvl${i}`;
          if (!state.claimedLevels.includes(key)) {
            state.claimedLevels.push(key);
            persist();
            const track = LEARNING_TRACKS.find((t) => t.id === id);
            onReward?.(`learn-${key}`, `${track?.label || "Subject"} level up — ${LEVELS[i].name}!`);
          }
        }
      }
    }
  }
  function registerAnswer(correct, trackId) {
    state.answered += 1;
    if (correct) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      addXp(XP.quizCorrect, trackId);
    } else {
      state.streak = 0;
    }
    persist();
  }
  function completeActivity() {
    state.totalActivities += 1;
    if (state.daily.date !== todayKey()) {
      state.daily = { date: todayKey(), count: 0, claimed: false };
    }
    state.daily.count += 1;
    persist();
    if (state.daily.count >= DAILY_MISSION_TARGET && !state.daily.claimed) {
      state.daily.claimed = true;
      persist();
      onReward?.(`learn-daily-${state.daily.date}`, "Daily Brilliance mission complete!");
    }
  }
  function accuracy() {
    return state.answered > 0 ? Math.round((state.correct / state.answered) * 100) : 0;
  }
  function trackLevel(id) {
    const xp = state.trackXp[id] || 0;
    let lvl = 0;
    for (let i = 0; i < TRACK_THRESHOLDS.length; i++) {
      if (xp >= TRACK_THRESHOLDS[i]) lvl = i;
    }
    const next = TRACK_THRESHOLDS[lvl + 1];
    return { lvl, name: LEVELS[lvl].name, xp, nextAt: next ?? null, progress: next ? (xp - TRACK_THRESHOLDS[lvl]) / (next - TRACK_THRESHOLDS[lvl]) : 1 };
  }
  function clearTimers() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.getElementById("learning-academy-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "learning-academy-dialog";
      dialog.className = "learning-dialog";
      dialog.setAttribute("aria-label", "IREOLUWA Learning Academy");
      document.body.appendChild(dialog);
    }
    dialog.addEventListener("close", () => {
      clearTimers();
      view = "home";
      render();
    });
    return dialog;
  }
  function el(sel) {
    return dialog?.querySelector(sel);
  }
  function feedbackHtml(correct, tip) {
    return `<div class="la-feedback ${correct ? "ok" : "no"}" role="status">
      <strong>${correct ? "✅ Correct!" : "💡 Not quite."}</strong>
      ${tip ? `<span>${tip}</span>` : ""}
    </div>`;
  }
  function headerHtml() {
    return `
      <div class="la-head">
        <div>
          <h2>🧠 IREOLUWA Learning Academy</h2>
          <p>Learn, play and grow — every answer makes your brain stronger.</p>
        </div>
        <button type="button" class="la-close" data-la-action="close" aria-label="Close Learning Academy">✕</button>
      </div>`;
  }
  function statsHtml() {
    const dailyLeft = Math.max(0, DAILY_MISSION_TARGET - (state.daily?.count || 0));
    const dailyDone = state.daily?.claimed;
    return `
      <div class="la-stats" aria-label="Your learning progress">
        <div class="la-stat"><span class="la-stat-num">${state.xp}</span><span class="la-stat-lbl">Total XP</span></div>
        <div class="la-stat"><span class="la-stat-num">${state.bestStreak}</span><span class="la-stat-lbl">Best streak 🔥</span></div>
        <div class="la-stat"><span class="la-stat-num">${accuracy()}%</span><span class="la-stat-lbl">Accuracy</span></div>
        <div class="la-stat"><span class="la-stat-num">${state.totalActivities}</span><span class="la-stat-lbl">Activities</span></div>
        <div class="la-stat la-daily ${dailyDone ? "done" : ""}"><span class="la-stat-num">${dailyDone ? "✅" : dailyLeft}</span><span class="la-stat-lbl">${dailyDone ? "Daily mission done" : "Daily mission left"}</span></div>
      </div>`;
  }
  function trackBarsHtml() {
    return `<div class="la-tracks">${LEARNING_TRACKS.map((t) => {
      const info = trackLevel(t.id);
      const pct = Math.round((info.progress || 0) * 100);
      return `<div class="la-track" title="${t.blurb}">
        <span class="la-track-icon" style="background:${t.color}" aria-hidden="true">${t.icon}</span>
        <span class="la-track-meta">
          <span class="la-track-name">${t.label} · ${info.name}</span>
          <span class="la-track-bar"><span style="width:${pct}%;background:${t.color}"></span></span>
        </span>
        <span class="la-track-xp">${info.xp} XP</span>
      </div>`;
    }).join("")}</div>`;
  }
  function tierPickerHtml() {
    return `<div class="la-tiers" role="group" aria-label="Difficulty level">${TIERS.map((t) => `
      <button type="button" class="la-tier ${tier === t.id ? "is-active" : ""}" data-tier="${t.id}" aria-pressed="${tier === t.id ? "true" : "false"}">
        <strong>${t.label}</strong><small>${t.ages}</small>
      </button>`).join("")}</div>`;
  }
  function homeHtml() {
    const activities = [
      { id: "quiz", icon: "🎯", title: "Quiz Quest", desc: "10 adaptive questions across any subject. Instant feedback and explanations.", color: "#0284c7" },
      { id: "memory", icon: "🃏", title: "Memory Match", desc: "Flip cards to pair facts — multiplication, synonyms, capitals & habitats.", color: "#059669" },
      { id: "rocket", icon: "🚀", title: "Number Rocket", desc: "Rapid-fire mental maths — launch your rocket with correct answers.", color: "#dc2626" },
      { id: "words", icon: "🔤", title: "Word Wizard", desc: "Unscramble letters to reveal words. Build spelling super-powers.", color: "#7c3aed" },
      { id: "pattern", icon: "🛤️", title: "Pattern Path", desc: "Spot what comes next — sequences that train logic and prediction.", color: "#d97706" },
    ];
    return `
      ${statsHtml()}
      ${tierPickerHtml()}
      ${trackBarsHtml()}
      <div class="la-activities">${activities.map((a) => `
        <button type="button" class="la-activity" data-start="${a.id}" style="--la-accent:${a.color}">
          <span class="la-activity-icon" aria-hidden="true">${a.icon}</span>
          <span class="la-activity-body">
            <strong>${a.title}</strong>
            <small>${a.desc}</small>
          </span>
          <span class="la-activity-go" aria-hidden="true">→</span>
        </button>`).join("")}</div>
      <p class="la-foot">Progress is saved on this device · Stars are earned in Kids Mode · Works offline</p>`;
  }
  function render() {
    const d = ensureDialog();
    clearTimers();
    let body = "";
    if (view === "home") body = homeHtml();
    else if (view === "quiz") body = quizHtml();
    else if (view === "memory") body = memoryHtml();
    else if (view === "rocket") body = rocketHtml();
    else if (view === "words") body = wordsHtml();
    else if (view === "pattern") body = patternHtml();
    d.innerHTML = `${headerHtml()}<div class="la-body">${body}</div>`;
    bindCommon();
    if (view === "home") bindHome();
    else if (view === "quiz") bindQuiz();
    else if (view === "memory") bindMemory();
    else if (view === "rocket") bindRocket();
    else if (view === "words") bindWords();
    else if (view === "pattern") bindPattern();
  }
  function bindCommon() {
    dialog.querySelectorAll('[data-la-action="close"]').forEach((b) => b.addEventListener("click", close));
    dialog.querySelectorAll('[data-la-action="home"]').forEach((b) => b.addEventListener("click", () => { view = "home"; render(); }));
  }
  function bindHome() {
    dialog.querySelectorAll("[data-tier]").forEach((b) => b.addEventListener("click", () => { tier = b.getAttribute("data-tier") || tier; render(); }));
    dialog.querySelectorAll("[data-start]").forEach((b) => b.addEventListener("click", () => startActivity(b.getAttribute("data-start"))));
  }
  function startActivity(id) {
    view = id;
    if (id === "quiz") startQuiz();
    else if (id === "memory") startMemory();
    else if (id === "rocket") startRocket();
    else if (id === "words") startWords();
    else if (id === "pattern") startPattern();
    else view = "home";
    render();
  }

  // ── Quiz Quest ─────────────────────────────────────────────────────────────
  function startQuiz() {
    quizSession = {
      track: activeTrack,
      index: 0,
      total: 10,
      score: 0,
      answeredThis: 0,
      current: decorateQuestion(trackQuestion(activeTrack, tier)),
      locked: false,
      feedback: null,
    };
  }
  function quizHtml() {
    const s = quizSession;
    if (!s) return "";
    const track = LEARNING_TRACKS.find((t) => t.id === s.track);
    const done = s.index >= s.total;
    if (done) {
      const pct = Math.round((s.score / s.total) * 100);
      return `
        <div class="la-panel la-result">
          <div class="la-result-big">${s.score}/${s.total}</div>
          <h3>${pct >= 80 ? "🏆 Brilliant!" : pct >= 50 ? "🌟 Good effort!" : "🌱 Keep growing!"}</h3>
          <p>You earned <strong>${s.score * XP.quizCorrect + XP.quizBonus} XP</strong> in ${track.label}.</p>
          <div class="la-row">
            <button type="button" class="la-btn la-btn-primary" data-quiz-again>🔄 Again</button>
            <button type="button" class="la-btn" data-la-action="home">🏠 Academy</button>
          </div>
        </div>`;
    }
    const choices = s.current.choices;
    return `
      <div class="la-panel">
        <div class="la-panel-top">
          <button type="button" class="la-btn la-btn-ghost" data-la-action="home">← Academy</button>
          <span class="la-pill" style="background:${track.color}">${track.icon} ${track.label}</span>
          <span class="la-qcount">Question ${s.index + 1}/${s.total}</span>
        </div>
        <div class="la-progress"><span style="width:${(s.index / s.total) * 100}%"></span></div>
        <div class="la-track-picker" role="group" aria-label="Subject">${LEARNING_TRACKS.map((t) => `
          <button type="button" class="la-track-chip ${s.track === t.id ? "is-active" : ""}" data-quiz-track="${t.id}">${t.icon} ${t.label}</button>`).join("")}</div>
        <h3 class="la-question">${s.current.prompt}</h3>
        <div class="la-choices">${choices.map((c, i) => `
          <button type="button" class="la-choice" data-choice="${i}" ${s.locked ? "disabled" : ""}>
            <span class="la-choice-key">${i + 1}</span>${c}
          </button>`).join("")}</div>
        ${s.feedback || ""}
        ${s.locked ? `<button type="button" class="la-btn la-btn-primary la-next" data-quiz-next>${s.index + 1 >= s.total ? "Finish 🎓" : "Next →"}</button>` : ""}
      </div>`;
  }
  function bindQuiz() {
    const s = quizSession;
    if (!s) return;
    dialog.querySelectorAll("[data-quiz-track]").forEach((b) => b.addEventListener("click", () => { activeTrack = b.getAttribute("data-quiz-track") || activeTrack; startQuiz(); render(); }));
    if (s.index >= s.total) {
      dialog.querySelector("[data-quiz-again]")?.addEventListener("click", () => { startQuiz(); render(); });
      return;
    }
    dialog.querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => answerQuiz(Number(b.getAttribute("data-choice")))));
    dialog.querySelector("[data-quiz-next]")?.addEventListener("click", nextQuizQuestion);
  }
  function answerQuiz(i) {
    const s = quizSession;
    if (!s || s.locked) return;
    const chosen = s.current.choices[i];
    const correct = chosen === String(s.current.answer);
    s.locked = true;
    s.answeredThis = 1;
    if (correct) {
      s.score += 1;
      registerAnswer(true, s.track);
    } else {
      registerAnswer(false, s.track);
    }
    s.feedback = feedbackHtml(correct, s.current.tip);
    if (speak && s.current.prompt) speak(correct ? "Correct!" : "Not quite. " + (s.current.tip || ""));
    render();
  }
  function nextQuizQuestion() {
    const s = quizSession;
    if (!s) return;
    s.index += 1;
    s.locked = false;
    s.feedback = null;
    if (s.index >= s.total) {
      addXp(XP.quizBonus, s.track);
      completeActivity();
      persist();
    } else {
      s.current = decorateQuestion(trackQuestion(s.track, tier));
    }
    render();
  }

  // ── Memory Match ───────────────────────────────────────────────────────────
  function startMemory() {
    const cards = buildMemoryDeck(activeTrack, tier);
    memorySession = {
      track: activeTrack,
      cards,
      flipped: [],
      matched: new Set(),
      moves: 0,
      locked: false,
      done: false,
    };
  }
  function memoryHtml() {
    const s = memorySession;
    if (!s) return "";
    const track = LEARNING_TRACKS.find((t) => t.id === s.track);
    if (s.done) {
      const pairs = s.cards.length / 2;
      return `
        <div class="la-panel la-result">
          <div class="la-result-big">${pairs} pairs</div>
          <h3>${s.moves <= pairs ? "🏆 Photographic memory!" : "🌟 Well matched!"}</h3>
          <p>You solved it in <strong>${s.moves}</strong> moves and earned <strong>${XP.memoryComplete} XP</strong>.</p>
          <div class="la-row">
            <button type="button" class="la-btn la-btn-primary" data-memory-again>🔄 Again</button>
            <button type="button" class="la-btn" data-la-action="home">🏠 Academy</button>
          </div>
        </div>`;
    }
    return `
      <div class="la-panel">
        <div class="la-panel-top">
          <button type="button" class="la-btn la-btn-ghost" data-la-action="home">← Academy</button>
          <span class="la-pill" style="background:${track.color}">${track.icon} ${track.label} · Memory Match</span>
          <span class="la-qcount">Moves ${s.moves}</span>
        </div>
        <div class="la-track-picker" role="group" aria-label="Subject">${LEARNING_TRACKS.map((t) => `
          <button type="button" class="la-track-chip ${s.track === t.id ? "is-active" : ""}" data-memory-track="${t.id}">${t.icon} ${t.label}</button>`).join("")}</div>
        <div class="la-memory-grid cols-${s.cards.length > 12 ? 6 : s.cards.length > 8 ? 5 : 4}">${s.cards.map((c, i) => `
          <button type="button" class="la-card ${s.matched.has(c.pair) ? "is-matched" : ""} ${s.flipped.includes(i) ? "is-flipped" : ""}" data-card="${i}" aria-label="${s.flipped.includes(i) || s.matched.has(c.pair) ? c.text : "Hidden card"}">
            <span class="la-card-face la-card-back">✦</span>
            <span class="la-card-face la-card-front">${c.text}</span>
          </button>`).join("")}</div>
      </div>`;
  }
  function bindMemory() {
    const s = memorySession;
    if (!s) return;
    dialog.querySelectorAll("[data-memory-track]").forEach((b) => b.addEventListener("click", () => { activeTrack = b.getAttribute("data-memory-track") || activeTrack; startMemory(); render(); }));
    if (s.done) {
      dialog.querySelector("[data-memory-again]")?.addEventListener("click", () => { startMemory(); render(); });
      return;
    }
    dialog.querySelectorAll("[data-card]").forEach((b) => b.addEventListener("click", () => flipCard(Number(b.getAttribute("data-card")))));
  }
  function flipCard(i) {
    const s = memorySession;
    if (!s || s.locked || s.done) return;
    if (s.flipped.includes(i) || s.matched.has(s.cards[i].pair)) return;
    s.flipped.push(i);
    render();
    if (s.flipped.length === 2) {
      s.locked = true;
      s.moves += 1;
      const [a, b] = s.flipped;
      const match = s.cards[a].pair === s.cards[b].pair;
      setTimeout(() => {
        if (match) {
          s.matched.add(s.cards[a].pair);
          state.correct += 1;
          state.answered += 2;
          state.streak += 1;
          state.bestStreak = Math.max(state.bestStreak, state.streak);
          addXp(6, s.track);
        } else {
          state.answered += 2;
          state.streak = 0;
          persist();
        }
        s.flipped = [];
        s.locked = false;
        if (s.matched.size === s.cards.length / 2) {
          s.done = true;
          addXp(XP.memoryComplete, s.track);
          completeActivity();
        }
        render();
      }, 650);
    }
  }

  // ── Number Rocket ──────────────────────────────────────────────────────────
  function startRocket() {
    rocketSession = { timeLeft: 45, score: 0, combo: 0, bestCombo: 0, altitude: 0, current: rocketQuestion(), answered: 0, over: false };
  }
  function rocketQuestion() {
    const t = tier === "seedling" ? { a: 10, b: 10 } : tier === "explorer" ? { a: 12, b: 12 } : { a: 20, b: 15 };
    const op = tier === "seedling" ? pick(["+", "−"]) : pick(["+", "−", "×"]);
    let a = rand(2, t.a), b = rand(2, t.b);
    if (op === "−" && b > a) [a, b] = [b, a];
    if (op === "×") { a = rand(2, 12); b = rand(2, 12); }
    const answer = op === "+" ? a + b : op === "−" ? a - b : a * b;
    return { prompt: `${a} ${op} ${b} = ?`, answer: String(answer), distractors: [answer + rand(1, 9), Math.max(0, answer - rand(1, 9)), answer + rand(10, 20)].map(String) };
  }
  function rocketHtml() {
    const s = rocketSession;
    if (!s) return "";
    if (s.over) {
      return `
        <div class="la-panel la-result">
          <div class="la-result-big">${s.score} 🚀</div>
          <h3>${s.score >= 20 ? "🏆 Orbit reached!" : s.score >= 10 ? "🌟 Sky-high maths!" : "🌱 Countdown complete!"}</h3>
          <p>Best combo ×${s.bestCombo} · Altitude ${Math.round(s.altitude)} m · <strong>${s.score * XP.rocketCorrect + XP.rocketBonus} XP</strong></p>
          <div class="la-row">
            <button type="button" class="la-btn la-btn-primary" data-rocket-again>🔄 Launch again</button>
            <button type="button" class="la-btn" data-la-action="home">🏠 Academy</button>
          </div>
        </div>`;
    }
    const choices = s.current.choices || (s.current.choices = choiceSet(s.current.answer, s.current.distractors || []));
    return `
      <div class="la-panel">
        <div class="la-panel-top">
          <button type="button" class="la-btn la-btn-ghost" data-la-action="home">← Academy</button>
          <span class="la-pill" style="background:#dc2626">🚀 Number Rocket</span>
          <span class="la-qcount la-timer">⏱ ${s.timeLeft}s</span>
        </div>
        <div class="la-rocket-stage" aria-hidden="true">
          <div class="la-rocket" style="transform:translateY(${-Math.min(120, s.altitude)}px)">🚀</div>
          <div class="la-cloud">☁️</div><div class="la-cloud c2">☁️</div>
        </div>
        <h3 class="la-question big">${s.current.prompt}</h3>
        <div class="la-choices grid2">${choices.map((c) => `<button type="button" class="la-choice" data-rocket-choice="${c}">${c}</button>`).join("")}</div>
        <div class="la-combo">Score ${s.score} · Combo ×${s.combo}</div>
      </div>`;
  }
  function bindRocket() {
    const s = rocketSession;
    if (!s) return;
    if (s.over) {
      dialog.querySelector("[data-rocket-again]")?.addEventListener("click", () => { startRocket(); render(); });
      return;
    }
    dialog.querySelectorAll("[data-rocket-choice]").forEach((b) => b.addEventListener("click", () => answerRocket(b.getAttribute("data-rocket-choice"))));
    if (!timerId) {
      timerId = setInterval(() => {
        const r = rocketSession;
        if (!r || r.over) { clearTimers(); return; }
        r.timeLeft -= 1;
        const timerEl = el(".la-timer");
        if (timerEl) timerEl.textContent = `⏱ ${r.timeLeft}s`;
        if (r.timeLeft <= 0) {
          r.over = true;
          clearTimers();
          addXp(XP.rocketBonus, "maths");
          completeActivity();
          persist();
          render();
        }
      }, 1000);
    }
  }
  function answerRocket(choice) {
    const s = rocketSession;
    if (!s || s.over) return;
    if (choice === s.current.answer) {
      s.score += 1;
      s.combo += 1;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      s.altitude += 8 + s.combo * 2;
      state.correct += 1;
      state.answered += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      addXp(XP.rocketCorrect, "maths");
    } else {
      s.combo = 0;
      s.altitude = Math.max(0, s.altitude - 10);
      state.answered += 1;
      state.streak = 0;
      persist();
    }
    s.current = rocketQuestion();
    render();
  }

  // ── Word Wizard ─────────────────────────────────────────────────────────────
  function startWords() {
    const pool = shuffle(WORD_WIZARD[tier] || WORD_WIZARD.explorer);
    wordSession = { words: pool.slice(0, 8), index: 0, score: 0, timeLeft: 90, over: false, feedback: null, current: null, locked: false };
    nextWord();
  }
  function nextWord() {
    const s = wordSession;
    const answer = s.words[s.index];
    s.current = { answer, scrambled: shuffle(answer.split("")).join(""), hint: `${answer.length} letters` };
    // Avoid already-ordered scrambles
    if (s.current.scrambled === answer) s.current.scrambled = shuffle(answer.split("")).join("");
    s.feedback = null;
  }
  function wordsHtml() {
    const s = wordSession;
    if (!s) return "";
    if (s.over) {
      return `
        <div class="la-panel la-result">
          <div class="la-result-big">${s.score}/${s.words.length}</div>
          <h3>${s.score >= 6 ? "🏆 Word Wizard!" : s.score >= 3 ? "🌟 Spelling star!" : "🌱 Words are growing!"}</h3>
          <p>You earned <strong>${s.score * XP.wordCorrect + XP.wordBonus} XP</strong> in English.</p>
          <div class="la-row">
            <button type="button" class="la-btn la-btn-primary" data-words-again>🔄 Again</button>
            <button type="button" class="la-btn" data-la-action="home">🏠 Academy</button>
          </div>
        </div>`;
    }
    return `
      <div class="la-panel">
        <div class="la-panel-top">
          <button type="button" class="la-btn la-btn-ghost" data-la-action="home">← Academy</button>
          <span class="la-pill" style="background:#7c3aed">🔤 Word Wizard</span>
          <span class="la-qcount la-timer">⏱ ${s.timeLeft}s</span>
        </div>
        <div class="la-progress"><span style="width:${(s.index / s.words.length) * 100}%"></span></div>
        <p class="la-qcount">Word ${s.index + 1} of ${s.words.length} · English</p>
        <div class="la-scramble" aria-label="Scrambled letters">${s.current.scrambled.split("").map((ch) => `<span>${ch}</span>`).join("")}</div>
        <form class="la-word-form" data-word-form>
          <input type="text" class="la-word-input" name="guess" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Type the word…" aria-label="Your answer" maxlength="24" />
          <button type="submit" class="la-btn la-btn-primary">Check</button>
        </form>
        ${s.feedback || ""}
        <button type="button" class="la-btn la-btn-ghost" data-word-skip>Skip →</button>
      </div>`;
  }
  function bindWords() {
    const s = wordSession;
    if (!s) return;
    if (s.over) {
      dialog.querySelector("[data-words-again]")?.addEventListener("click", () => { startWords(); render(); });
      return;
    }
    dialog.querySelector("[data-word-form]")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = dialog.querySelector(".la-word-input");
      checkWord((input?.value || "").trim().toUpperCase());
    });
    dialog.querySelector("[data-word-skip]")?.addEventListener("click", () => { if (!s.locked) advanceWord(); });
    const input = dialog.querySelector(".la-word-input");
    if (input) input.focus();
    if (!timerId) {
      timerId = setInterval(() => {
        const w = wordSession;
        if (!w || w.over) { clearTimers(); return; }
        w.timeLeft -= 1;
        const timerEl = el(".la-timer");
        if (timerEl) timerEl.textContent = `⏱ ${w.timeLeft}s`;
        if (w.timeLeft <= 0) {
          w.over = true;
          clearTimers();
          addXp(XP.wordBonus, "english");
          completeActivity();
          render();
        }
      }, 1000);
    }
  }
  function checkWord(guess) {
    const s = wordSession;
    if (!s || s.over || s.locked) return;
    s.locked = true;
    const correct = guess === s.current.answer;
    s.feedback = feedbackHtml(correct, correct ? "" : `It was “${s.current.answer}”.`);
    if (correct) {
      s.score += 1;
      state.correct += 1;
      state.answered += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      addXp(XP.wordCorrect, "english");
    } else {
      state.answered += 1;
      state.streak = 0;
      persist();
    }
    const idxAtAnswer = s.index;
    render();
    setTimeout(() => {
      if (wordSession === s && s.index === idxAtAnswer && !s.over) advanceWord();
    }, 750);
  }
  function advanceWord() {
    const s = wordSession;
    if (!s || s.over) return;
    s.locked = false;
    s.index += 1;
    if (s.index >= s.words.length) {
      s.over = true;
      clearTimers();
      addXp(XP.wordBonus, "english");
      completeActivity();
      persist();
      render();
    } else {
      nextWord();
      render();
    }
  }

  // ── Pattern Path ────────────────────────────────────────────────────────────
  function startPattern() {
    patternSession = { index: 0, total: 10, score: 0, current: logicQuestion(tier === "seedling" ? "seedling" : tier === "scholar" ? "scholar" : "explorer"), locked: false, feedback: null };
    patternSession.current = decorateQuestion(patternSession.current);
  }
  function patternHtml() {
    const s = patternSession;
    if (!s) return "";
    if (s.index >= s.total) {
      return `
        <div class="la-panel la-result">
          <div class="la-result-big">${s.score}/${s.total}</div>
          <h3>${s.score >= 8 ? "🏆 Pattern master!" : s.score >= 5 ? "🌟 Logical mind!" : "🌱 Patterns are forming!"}</h3>
          <p>You earned <strong>${s.score * XP.patternCorrect + XP.patternBonus} XP</strong> in Logic & Memory.</p>
          <div class="la-row">
            <button type="button" class="la-btn la-btn-primary" data-pattern-again>🔄 Again</button>
            <button type="button" class="la-btn" data-la-action="home">🏠 Academy</button>
          </div>
        </div>`;
    }
    return `
      <div class="la-panel">
        <div class="la-panel-top">
          <button type="button" class="la-btn la-btn-ghost" data-la-action="home">← Academy</button>
          <span class="la-pill" style="background:#d97706">🛤️ Pattern Path</span>
          <span class="la-qcount">Round ${s.index + 1}/${s.total}</span>
        </div>
        <div class="la-progress"><span style="width:${(s.index / s.total) * 100}%"></span></div>
        <h3 class="la-question">${s.current.prompt}</h3>
        <div class="la-choices">${s.current.choices.map((c, i) => `
          <button type="button" class="la-choice" data-pattern-choice="${i}" ${s.locked ? "disabled" : ""}>
            <span class="la-choice-key">${i + 1}</span>${c}
          </button>`).join("")}</div>
        ${s.feedback || ""}
        ${s.locked ? `<button type="button" class="la-btn la-btn-primary la-next" data-pattern-next>${s.index + 1 >= s.total ? "Finish 🎓" : "Next →"}</button>` : ""}
      </div>`;
  }
  function bindPattern() {
    const s = patternSession;
    if (!s) return;
    if (s.index >= s.total) {
      dialog.querySelector("[data-pattern-again]")?.addEventListener("click", () => { startPattern(); render(); });
      return;
    }
    dialog.querySelectorAll("[data-pattern-choice]").forEach((b) => b.addEventListener("click", () => answerPattern(Number(b.getAttribute("data-pattern-choice")))));
    dialog.querySelector("[data-pattern-next]")?.addEventListener("click", nextPattern);
  }
  function answerPattern(i) {
    const s = patternSession;
    if (!s || s.locked) return;
    const chosen = s.current.choices[i];
    const correct = chosen === String(s.current.answer);
    s.locked = true;
    if (correct) {
      s.score += 1;
      state.correct += 1;
      state.answered += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      addXp(XP.patternCorrect, "logic");
    } else {
      state.answered += 1;
      state.streak = 0;
      persist();
    }
    s.feedback = feedbackHtml(correct, s.current.tip);
    render();
  }
  function nextPattern() {
    const s = patternSession;
    if (!s) return;
    s.index += 1;
    s.locked = false;
    s.feedback = null;
    if (s.index >= s.total) {
      addXp(XP.patternBonus, "logic");
      completeActivity();
      persist();
    } else {
      s.current = decorateQuestion(logicQuestion(tier));
    }
    render();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function open() {
    const d = ensureDialog();
    view = "home";
    render();
    if (!d.open) {
      if (typeof d.showModal === "function") d.showModal();
      else d.hidden = false;
    }
  }
  function close() {
    clearTimers();
    if (dialog?.open) dialog.close();
    else if (dialog) dialog.hidden = true;
  }
  function reset() {
    state = defaultState();
    persist();
    render();
  }

  ensureDialog();
  render();

  return {
    open,
    close,
    reset,
    getStats: () => ({ xp: state.xp, correct: state.correct, answered: state.answered, bestStreak: state.bestStreak, totalActivities: state.totalActivities }),
  };
}
