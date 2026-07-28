/**
 * Learning Content Configuration
 *
 * Central data store for all "How to Learn" content across every skill trainer.
 * Designed to be CMS-ready: replace this file with an API call when a CMS is integrated.
 * Adding a new skill requires only a new entry in LEARNING_CONTENT — zero component changes.
 */

export interface LearningResource {
  title: string;
  platform: string;
  url: string;
  duration?: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  isFree: boolean;
}

export interface RealExample {
  label: string;
  bad: string;
  whyBad: string;
  improved: string;
  expert: string;
}

export interface LearningStep {
  step: number;
  title: string;
  description: string;
  action: string;
}

export interface SkillFundamental {
  title: string;
  description: string;
  emoji: string;
}

export interface SkillLearningContent {
  trainerType: string;
  title: string;
  tagline: string;
  overview: {
    what: string;
    why: string;
    where: string[];
    realWorldContext: string;
  };
  fundamentals: SkillFundamental[];
  steps: LearningStep[];
  tips: string[];
  commonMistakes: string[];
  bestPractices: string[];
  realExamples: RealExample[];
  exercises: string[];
  resources: LearningResource[];
  checklist: string[];
}

// ────────────────────────────────────────────────────────────────────────────

const LEARNING_CONTENT: Record<string, SkillLearningContent> = {

  // ── English Speaking Practice ─────────────────────────────────────────────
  speaking: {
    trainerType: "speaking",
    title: "English Speaking Practice",
    tagline: "Build fluent, confident, and articulate spoken English",
    overview: {
      what: "English speaking is the ability to express ideas clearly and naturally in spoken English — covering pronunciation, grammar, vocabulary, fluency, and confidence in real-time communication.",
      why: "Strong spoken English directly impacts career growth, interview success, professional credibility, and global communication. It is the #1 skill employers look for in candidates across every industry.",
      where: ["Job interviews", "Team meetings and presentations", "Client calls and negotiations", "International conferences", "Everyday workplace conversations"],
      realWorldContext: "Professionals who communicate confidently in English are 3x more likely to be promoted and earn 20–30% higher salaries in global organisations.",
    },
    fundamentals: [
      { title: "Pronunciation", description: "Clear, consistent pronunciation makes you easy to understand. Focus on vowel sounds, consonant clusters, and word stress.", emoji: "🔊" },
      { title: "Fluency", description: "Speaking smoothly without excessive pauses or filler words. Fluency comes from practice, not perfection.", emoji: "🌊" },
      { title: "Vocabulary", description: "Using the right words at the right time. Build domain-specific vocabulary for your professional context.", emoji: "📚" },
      { title: "Grammar", description: "Correct sentence structure builds credibility. Focus on tense consistency, subject-verb agreement, and articles.", emoji: "✏️" },
      { title: "Coherence", description: "Organising your thoughts logically so your listener can follow easily. Use connectors like 'firstly', 'however', 'therefore'.", emoji: "🧩" },
      { title: "Confidence", description: "Confident body language, steady pace, and decisive language make your message more impactful.", emoji: "💪" },
    ],
    steps: [
      { step: 1, title: "Build Vocabulary Daily", description: "Learn 5 new words every day from your professional domain. Use them in sentences immediately.", action: "Open the Vocabulary Builder trainer and learn 5 words today" },
      { step: 2, title: "Shadow Native Speakers", description: "Listen to a short English audio clip and repeat exactly what you hear — matching tone, speed, and rhythm.", action: "Watch a 3-minute TED Talk and shadow the speaker" },
      { step: 3, title: "Answer Aloud Every Day", description: "Pick a random question from a list and answer it out loud for 1–2 minutes without stopping.", action: "Answer: 'What are your strengths?' aloud right now" },
      { step: 4, title: "Record and Review", description: "Record your spoken answers, listen back, and identify filler words, grammar errors, and unclear sections.", action: "Record yourself answering a practice question" },
      { step: 5, title: "Practice with AI Feedback", description: "Use the AI trainer to get structured feedback on every dimension — grammar, fluency, vocabulary, and confidence.", action: "Start a practice session and complete all 5 turns" },
    ],
    tips: [
      "Speak slowly and clearly — speed is not fluency",
      "Pause between sentences rather than using filler words like 'um' or 'uh'",
      "Use simple, direct sentences instead of complex structures",
      "Expand answers beyond one sentence — aim for 3–5 sentence responses",
      "Start answers with a clear opening statement",
      "End answers with a confident closing sentence",
    ],
    commonMistakes: [
      "Translating directly from your native language (causes unnatural phrasing)",
      "Speaking too fast and losing clarity",
      "Using filler words (um, uh, like, basically) excessively",
      "Giving one-word or one-sentence answers",
      "Poor eye contact and weak body posture while speaking",
    ],
    bestPractices: [
      "Practice for 15 minutes every day — consistency beats intensity",
      "Think in English rather than translating from your native language",
      "Read English articles and news aloud to build pronunciation",
      "Join English conversation groups or language exchange communities",
      "Celebrate progress over perfection — mistakes are learning data",
    ],
    realExamples: [
      {
        label: "Answering 'Tell me about yourself'",
        bad: "I am from Delhi. I studied computer science. I worked in a company for 2 years.",
        whyBad: "Too brief, no enthusiasm, no structure, and no connection to the listener's interest.",
        improved: "I am a software developer with 2 years of experience building scalable web applications. I graduated in Computer Science from Delhi University and have worked primarily with React and Python. I am passionate about clean code and user-focused design.",
        expert: "I am a full-stack developer with 2 years of experience at TechCorp, where I built and shipped 3 production React applications serving over 50,000 users. My background is in Computer Science, and I am especially passionate about performance optimisation and developer experience. I am excited about this opportunity because your team's focus on AI-driven products aligns perfectly with the direction I want to grow my career.",
      },
    ],
    exercises: [
      "Introduce yourself in exactly 60 seconds — no more, no less",
      "Describe your daily routine using present simple tense",
      "Explain your favourite movie in 5 sentences",
      "Answer: 'What is your greatest weakness?' without using the word 'weakness'",
      "Give a 2-minute opinion on whether remote work is good or bad",
    ],
    resources: [
      { title: "English with Lucy — Pronunciation & Speaking", platform: "YouTube", url: "https://www.youtube.com/@EnglishwithLucy", duration: "10–15 min videos", level: "Beginner", description: "One of the largest English learning channels — clear pronunciation lessons and speaking practice.", isFree: true },
      { title: "BBC Learning English", platform: "BBC / Web", url: "https://www.bbc.co.uk/learningenglish", duration: "Self-paced", level: "Beginner", description: "Free structured English learning from the BBC with audio, video, and exercises.", isFree: true },
      { title: "Speak English With Vanessa", platform: "YouTube", url: "https://www.youtube.com/@SpeakEnglishWithVanessa", duration: "5–20 min videos", level: "Intermediate", description: "Natural conversation practice and fluency tips for intermediate learners.", isFree: true },
      { title: "Business English Pod", platform: "Web / Podcast", url: "https://www.businessenglishpod.com", duration: "Self-paced", level: "Intermediate", description: "Professional business English lessons covering meetings, negotiations, and presentations.", isFree: true },
    ],
    checklist: [
      "I understand the 6 fundamentals of spoken English",
      "I have identified my weakest area (grammar / fluency / vocabulary / confidence)",
      "I have read one tip and will apply it in today's session",
      "I know at least 2 common mistakes to avoid",
      "I am ready to speak for 2+ minutes per answer",
    ],
  },

  // ── Fluency Coach ────────────────────────────────────────────────────────
  fluency: {
    trainerType: "fluency",
    title: "Fluency Coach",
    tagline: "Speak naturally, smoothly, and confidently without hesitation",
    overview: {
      what: "Fluency is the ability to speak continuously, naturally, and at an appropriate pace — without excessive pauses, filler words, or breakdowns in thought.",
      why: "Fluent speakers are perceived as more intelligent, more credible, and more leadership-ready. In interviews and presentations, fluency directly affects how your message is received.",
      where: ["Job interviews and panel discussions", "Group presentations", "Podcast appearances", "Team standups and demos", "Sales pitches"],
      realWorldContext: "Research shows that speakers who pause intentionally (not hesitantly) are rated 40% more credible than those who rush or use excessive filler words.",
    },
    fundamentals: [
      { title: "Pace Control", description: "Speaking at 120–150 words per minute. Too fast loses the audience; too slow loses their interest.", emoji: "⏱️" },
      { title: "Eliminating Fillers", description: "Replace 'um', 'uh', 'like', 'you know' with intentional pauses. Silence is powerful.", emoji: "🚫" },
      { title: "Breath Control", description: "Breathe from the diaphragm. Proper breathing gives you control over pace and volume.", emoji: "🌬️" },
      { title: "Thought Organisation", description: "Structure thoughts before speaking. Use: Point → Reason → Example → Summary.", emoji: "🧠" },
      { title: "Lexical Flexibility", description: "Have multiple ways to express the same idea. Avoids repetition and keeps speech natural.", emoji: "🔄" },
      { title: "Recovery Skills", description: "Know how to recover gracefully when you lose your train of thought without panicking.", emoji: "🎯" },
    ],
    steps: [
      { step: 1, title: "Record Baseline", description: "Record yourself speaking on any topic for 2 minutes and count your filler words.", action: "Record now and count 'um', 'uh', 'like' in your response" },
      { step: 2, title: "Practise Intentional Silence", description: "Replace every filler word with a 1-second pause. Silence signals confidence.", action: "Speak for 1 minute on any topic — zero filler words allowed" },
      { step: 3, title: "Use the PREP Framework", description: "Point → Reason → Example → Point. Structure any answer in 4 parts.", action: "Answer 'What is your opinion on remote work?' using PREP" },
      { step: 4, title: "Read Aloud Daily", description: "Read any article aloud for 10 minutes. This builds fluency patterns in your brain.", action: "Read the top BBC headline article aloud right now" },
      { step: 5, title: "Timed Speaking Challenges", description: "Set a timer for 2 minutes and speak without stopping on a random topic.", action: "Start a Fluency Coach session and complete the 2-minute challenge" },
    ],
    tips: [
      "Pause deliberately — intentional silence is more powerful than filler words",
      "Slow down by 20% — you think you are speaking slowly but you are not",
      "Use connector words: 'Furthermore', 'In addition', 'However', 'As a result'",
      "Breathe before starting a sentence, not during it",
      "Practice the topic you will speak about before starting AI practice",
      "Aim for 120–150 words per minute — record and measure yourself",
    ],
    commonMistakes: [
      "Speaking too fast due to nervousness, making it harder to understand",
      "Starting sentences without knowing how they will end",
      "Using the same words repeatedly ('basically', 'actually', 'like')",
      "Losing track mid-sentence and abandoning it",
      "Rushing to fill silence instead of pausing intentionally",
    ],
    bestPractices: [
      "Do a 10-minute reading aloud session every morning",
      "Record weekly speaking samples and track filler word reduction",
      "Practice thinking in English rather than translating mentally",
      "Prepare 3 talking points before any important meeting",
      "Use the STAR method (Situation → Task → Action → Result) for structured answers",
    ],
    realExamples: [
      {
        label: "Explaining a project at work",
        bad: "So basically um we were like working on this thing and um it was basically a feature that like you know improved the performance basically.",
        whyBad: "Too many filler words, no structure, vague language, and unclear message.",
        improved: "We worked on a performance optimisation feature that reduced our app's load time by 40%. The approach involved lazy loading images and caching API responses.",
        expert: "In Q3, our team tackled a critical performance bottleneck that was increasing churn. We identified that 60% of load time came from unoptimised images. By implementing lazy loading and a Redis caching layer, we reduced load time by 40% — directly improving user retention by 12%.",
      },
    ],
    exercises: [
      "Speak for 2 minutes on 'My ideal weekend' — zero filler words",
      "Describe your city to someone who has never visited — 90 seconds",
      "Explain how a coffee machine works without saying 'basically' or 'like'",
      "Tell a 60-second story about something that happened last week",
      "Read a news paragraph aloud 3 times, increasing speed each time",
    ],
    resources: [
      { title: "TED Talks — How to Speak", platform: "YouTube / TED", url: "https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen", duration: "10 min", level: "Beginner", description: "Julian Treasure's iconic TED Talk on the science of powerful speaking.", isFree: true },
      { title: "Toastmasters International", platform: "Web", url: "https://www.toastmasters.org", duration: "Ongoing", level: "Beginner", description: "The world's largest public speaking organisation. Find a local or online club to practice fluency in a supportive environment.", isFree: true },
      { title: "Fluency MC — English Fluency", platform: "YouTube", url: "https://www.youtube.com/@fluencymc", duration: "5–10 min", level: "Intermediate", description: "Rap-based English fluency lessons that make practice memorable and fun.", isFree: true },
      { title: "Coursera — Improve Your English Communication Skills", platform: "Coursera (Free Audit)", url: "https://www.coursera.org/specializations/improve-english", duration: "~3 months", level: "Intermediate", description: "Georgia Tech's free communication course covering fluency, emails, and presentations.", isFree: true },
    ],
    checklist: [
      "I have recorded my baseline speaking sample",
      "I know my average filler word count per minute",
      "I understand the PREP framework",
      "I have practised 1 minute of speaking with zero filler words",
      "I am ready to complete a 2-minute AI fluency session",
    ],
  },

  // ── IELTS Speaking Trainer ────────────────────────────────────────────────
  ielts: {
    trainerType: "ielts",
    title: "IELTS Speaking Trainer",
    tagline: "Master all 3 parts of the IELTS Speaking test for Band 7+",
    overview: {
      what: "The IELTS Speaking test is a 11–14 minute face-to-face interview with a certified examiner. It has 3 parts: personal questions (Part 1), a 2-minute speech on a cue card (Part 2), and an abstract discussion (Part 3).",
      why: "IELTS Band 7+ is the global benchmark for academic, professional, and immigration English proficiency. It opens doors to UK, Canada, Australia, and 140+ countries for study and work.",
      where: ["University admissions (UK, Canada, Australia)", "Professional registration (nursing, medicine, law)", "Immigration visas (Canada PR, UK Skilled Worker)", "Corporate international transfers"],
      realWorldContext: "Over 3.5 million people take IELTS every year. A Band 7 vs Band 6.5 can be the difference between getting a Canadian PR or being rejected.",
    },
    fundamentals: [
      { title: "Fluency & Coherence (FC)", description: "Speaking without hesitation and organising ideas logically. This is 25% of your band score.", emoji: "🌊" },
      { title: "Lexical Resource (LR)", description: "Using a wide range of vocabulary precisely and appropriately — not just using 'big words'.", emoji: "📖" },
      { title: "Grammatical Range & Accuracy (GRA)", description: "Using a variety of sentence structures (simple, complex, conditional) with consistent accuracy.", emoji: "✍️" },
      { title: "Pronunciation (P)", description: "Being easily understood, not having a 'perfect' accent. Stress, intonation, and clarity matter.", emoji: "🎵" },
      { title: "Extended Response", description: "Giving full, detailed answers rather than yes/no. Every answer should be 3–5 sentences minimum.", emoji: "📝" },
      { title: "Part 2 Cue Card Strategy", description: "Use 1 minute to plan: 4 bullet points covering 'What, When, Who, Why it was special'.", emoji: "🃏" },
    ],
    steps: [
      { step: 1, title: "Understand Band Descriptors", description: "Read the official IELTS Band Descriptors to understand exactly what examiners look for at each band level.", action: "Google 'IELTS Speaking Band Descriptors PDF' and read the Band 6–7 column" },
      { step: 2, title: "Master Part 1 Topics", description: "Part 1 covers 30+ predictable topics: home, work, hobbies, travel, technology. Prepare 3 answers per topic.", action: "Prepare 3-sentence answers for: Home / Work / Hobbies" },
      { step: 3, title: "Practice the Cue Card Method", description: "For Part 2, use 60 seconds to plan: note 4 key points, then speak for 2 full minutes without stopping.", action: "Practice a Part 2 cue card: 'Describe a time you helped someone'" },
      { step: 4, title: "Develop Part 3 Abstract Thinking", description: "Part 3 requires opinions on society-level topics. Practice: 'In my opinion... because... for example... therefore'.", action: "Answer: 'Do you think technology has made people more or less social?'" },
      { step: 5, title: "Simulate Full Tests", description: "Practice all 3 parts in sequence with timed conditions to build exam stamina.", action: "Complete a full IELTS session in the AI trainer (Parts 1, 2, and 3)" },
    ],
    tips: [
      "Never say 'yes' or 'no' alone — always extend your answer",
      "Use a variety of tenses: past, present, conditional, and future",
      "Link ideas using: 'Moreover', 'On the other hand', 'As a result'",
      "For Part 2, fill all 2 minutes — do not stop early",
      "Use precise vocabulary: instead of 'nice', say 'refreshing', 'invigorating', 'captivating'",
      "Paraphrase the question in your opening sentence to show comprehension",
    ],
    commonMistakes: [
      "Giving one-sentence answers (kills your FC score)",
      "Memorising scripted answers (examiners detect and penalise this)",
      "Stopping before 2 minutes in Part 2",
      "Using simple vocabulary repeatedly ('good', 'bad', 'nice', 'big')",
      "Not asking for clarification when the question is unclear",
    ],
    bestPractices: [
      "Record every practice session and evaluate your own band using descriptors",
      "Learn 10 idioms and collocations specific to IELTS topics",
      "Read The Guardian or BBC for Part 3-style opinions on society topics",
      "Practice with a timer: 60 sec for Part 2 planning, 2 min for delivery",
      "Use conditional sentences in Part 3: 'If I were to choose... I would...'",
    ],
    realExamples: [
      {
        label: "Part 1: 'Do you like cooking?'",
        bad: "Yes, I like cooking. It is fun.",
        whyBad: "Too short, no vocabulary range, no development, would score Band 4.",
        improved: "Yes, I enjoy cooking quite a lot. I find it therapeutic after a stressful day. I particularly like making Indian curries and experimenting with spices.",
        expert: "Yes, cooking is something I am genuinely passionate about. I find it a wonderful creative outlet — it allows me to experiment with flavours and techniques. I particularly enjoy making South Indian cuisine, which I have been perfecting over the past two years. Recently, I have also started exploring Mediterranean recipes, which has been a fascinating culinary journey.",
      },
    ],
    exercises: [
      "Answer 5 Part 1 questions: home, study/work, hobbies, travel, technology",
      "Complete one full Part 2 cue card: 'Describe a place you love to visit'",
      "Give a 2-minute opinion on: 'Are smartphones good for society?'",
      "Describe a past event using 5 different past tenses",
      "Replace 5 simple words (good, bad, nice, big, small) with advanced synonyms",
    ],
    resources: [
      { title: "E2 IELTS — Official IELTS Preparation", platform: "YouTube", url: "https://www.youtube.com/@E2IELTS", duration: "10–30 min videos", level: "Intermediate", description: "The most comprehensive free IELTS preparation channel. Full strategies for all 3 speaking parts.", isFree: true },
      { title: "British Council IELTS", platform: "Web", url: "https://www.britishcouncil.org/exam/ielts/preparation", duration: "Self-paced", level: "Intermediate", description: "Official British Council IELTS preparation resources including sample tests and tips.", isFree: true },
      { title: "IELTS Online Tests", platform: "Web", url: "https://ieltsonlinetests.com/ielts-speaking-practice", duration: "Self-paced", level: "Intermediate", description: "Free IELTS Speaking practice with 200+ real-exam-style questions.", isFree: true },
      { title: "IELTS Liz", platform: "Web", url: "https://ieltsliz.com/ielts-speaking", duration: "Self-paced", level: "Intermediate", description: "Free tips, model answers, and vocabulary for all IELTS speaking topics.", isFree: true },
    ],
    checklist: [
      "I understand the 4 IELTS Speaking band criteria",
      "I have read Band 7 descriptor examples",
      "I know how to structure a Part 2 answer using 4 key points",
      "I have practised extending answers beyond 2 sentences",
      "I am ready to simulate a full 3-part IELTS speaking test",
    ],
  },

  // ── Grammar Trainer ──────────────────────────────────────────────────────
  grammar: {
    trainerType: "grammar",
    title: "Grammar Trainer",
    tagline: "Master English grammar for professional communication",
    overview: {
      what: "Grammar is the structural foundation of clear English communication. It governs tense, sentence structure, subject-verb agreement, articles, and punctuation.",
      why: "Poor grammar undermines your credibility in emails, presentations, interviews, and written reports — even if your ideas are brilliant. Strong grammar signals intelligence and attention to detail.",
      where: ["Professional emails and reports", "Job interviews", "LinkedIn profiles", "Technical documentation", "Academic writing"],
      realWorldContext: "Studies show that 59% of people would not hire a candidate whose resume contains grammar mistakes. Grammar is your professional first impression.",
    },
    fundamentals: [
      { title: "Tenses", description: "English has 12 tenses. Master simple past, present perfect, and conditional tenses for professional communication.", emoji: "⏰" },
      { title: "Subject-Verb Agreement", description: "Singular subjects take singular verbs. 'He goes' not 'He go'. 'The team is' not 'The team are' (American English).", emoji: "🔗" },
      { title: "Articles (a, an, the)", description: "One of the most common errors. 'A' for first mention, 'the' for known, no article for general concepts.", emoji: "📌" },
      { title: "Prepositions", description: "In, on, at, by, with, through — each has specific rules. 'Interested in' not 'interested on'.", emoji: "🗺️" },
      { title: "Sentence Structure", description: "Every sentence needs a subject, verb, and object. Avoid fragments and run-on sentences.", emoji: "🏗️" },
      { title: "Punctuation", description: "Commas, semicolons, and apostrophes serve precise purposes. Incorrect apostrophes ('it's vs its') are very common.", emoji: "✍️" },
    ],
    steps: [
      { step: 1, title: "Identify Your Weak Tense", description: "Most non-native speakers struggle with present perfect ('I have done') vs simple past ('I did').", action: "Write 5 sentences using present perfect tense" },
      { step: 2, title: "Fix Articles Daily", description: "Read a paragraph from a news article and underline every article (a, an, the). Understand why each was used.", action: "Read a BBC paragraph and explain every article usage" },
      { step: 3, title: "Error Correction Practice", description: "Read incorrectly written sentences and correct them. This trains your grammar instinct.", action: "Complete an error correction exercise in the Grammar Trainer" },
      { step: 4, title: "Write and Self-Correct", description: "Write a short paragraph on any topic, then identify and fix your own grammar mistakes.", action: "Write a 5-sentence paragraph about your current project" },
      { step: 5, title: "AI Grammar Drills", description: "Use the AI Grammar Trainer to complete exercises across error correction, sentence rewriting, and fill-in-the-blank.", action: "Complete 5 AI grammar exercises and review the corrections" },
    ],
    tips: [
      "Use present perfect for recent actions: 'I have just finished the report'",
      "Use simple past for completed events: 'I finished the report yesterday'",
      "When in doubt about 'a' or 'the', ask: 'Is this the first mention?' (a) or 'Known to listener?' (the)",
      "Never start a sentence with 'Because' alone — it creates a fragment",
      "Use Grammarly or LanguageTool to review your professional writing",
      "Read 1 paragraph of high-quality English writing daily — NYT, Economist, or HBR",
    ],
    commonMistakes: [
      "Mixing tenses within the same sentence ('I was working and I finish the report')",
      "Overusing the present continuous ('I am going to market everyday' instead of 'I go')",
      "Missing articles ('I bought car' instead of 'I bought a car')",
      "Wrong prepositions ('discuss about' instead of 'discuss')",
      "Double negatives ('I don't have no time' instead of 'I don't have any time')",
    ],
    bestPractices: [
      "Keep a grammar mistake log — write down every correction you receive",
      "Proofread emails before sending — read them aloud to catch errors",
      "Use active voice: 'The team completed the project' not 'The project was completed by the team'",
      "Short sentences are clearer: break long sentences at conjunctions",
      "Install Grammarly as a free browser extension for real-time correction",
    ],
    realExamples: [
      {
        label: "Professional email grammar",
        bad: "Dear Sir, I am writing to you for ask about the job which I have saw in LinkedIn. I am very interest in this job.",
        whyBad: "Multiple errors: wrong infinitive form, wrong tense ('have saw'), adjective instead of adjective form ('interest').",
        improved: "Dear Sir, I am writing to enquire about the job I saw on LinkedIn. I am very interested in this position.",
        expert: "Dear [Name], I am writing to express my interest in the Software Engineer position advertised on LinkedIn (Ref: SE-2024). Having reviewed the role requirements, I believe my 3 years of full-stack development experience aligns closely with what your team is seeking.",
      },
    ],
    exercises: [
      "Correct 5 sentences: find and fix the grammatical error in each",
      "Rewrite in active voice: 'The bug was fixed by the developer last night'",
      "Fill in: 'I _____ (work) at this company for three years now'",
      "Write 3 sentences using conditional type 2 ('If I were...')",
      "Identify all articles (a/an/the) in a paragraph and explain each",
    ],
    resources: [
      { title: "GrammarBook.com", platform: "Web", url: "https://www.grammarbook.com", duration: "Self-paced", level: "Beginner", description: "Free comprehensive grammar rules with quizzes for every topic.", isFree: true },
      { title: "British Council Grammar Reference", platform: "Web", url: "https://learnenglish.britishcouncil.org/grammar", duration: "Self-paced", level: "Beginner", description: "Free grammar lessons from the British Council covering all major grammar points.", isFree: true },
      { title: "Perfect English Grammar", platform: "Web", url: "https://www.perfect-english-grammar.com", duration: "Self-paced", level: "Intermediate", description: "Clear explanations and free exercises for every English grammar point.", isFree: true },
      { title: "Purdue OWL Writing Lab", platform: "Web", url: "https://owl.purdue.edu/owl/general_writing/grammar", duration: "Self-paced", level: "Intermediate", description: "Professional-grade grammar reference used by universities worldwide — completely free.", isFree: true },
    ],
    checklist: [
      "I understand the difference between simple past and present perfect",
      "I know when to use 'a', 'an', and 'the'",
      "I can identify and correct subject-verb agreement errors",
      "I have read through the common mistakes section",
      "I am ready to complete grammar error correction exercises",
    ],
  },

  // ── Vocabulary Builder ────────────────────────────────────────────────────
  vocabulary: {
    trainerType: "vocabulary",
    title: "Vocabulary Builder",
    tagline: "Build a rich, professional vocabulary through spaced repetition",
    overview: {
      what: "Vocabulary is the collection of words you know and can use correctly in context. Professional vocabulary includes domain-specific terms, formal register words, and collocations.",
      why: "A richer vocabulary lets you express precise thoughts, makes you sound more credible, and improves your writing, speaking, and comprehension across all professional contexts.",
      where: ["Professional emails and reports", "Job interviews", "Presentations and pitches", "LinkedIn and professional profiles", "Technical documentation"],
      realWorldContext: "Research shows that the top 3,000 English words cover 95% of everyday conversation, while professional contexts require an additional 5,000–10,000 domain words.",
    },
    fundamentals: [
      { title: "Context Learning", description: "Learn words in sentences, not in isolation. Understanding the context reveals how and when to use a word.", emoji: "🔍" },
      { title: "Word Families", description: "Learn root, prefix, and suffix patterns. Knowing 'construct' gives you construction, constructive, reconstruct, deconstruct.", emoji: "🌳" },
      { title: "Collocations", description: "Words that naturally appear together: 'make a decision' (not 'do a decision'), 'highly recommended' (not 'very recommended').", emoji: "🤝" },
      { title: "Spaced Repetition", description: "Review words at increasing intervals: 1 day → 3 days → 1 week → 2 weeks. This is the most efficient learning method.", emoji: "📆" },
      { title: "Active Use", description: "Use each new word in 3 original sentences within 24 hours of learning it to cement it in memory.", emoji: "✍️" },
      { title: "Register Awareness", description: "Know the difference between formal (commence), neutral (start), and informal (kick off) and choose appropriately.", emoji: "🎭" },
    ],
    steps: [
      { step: 1, title: "Assess Your Current Level", description: "Identify your strongest and weakest vocabulary areas (professional, academic, conversational).", action: "Complete a vocabulary self-assessment: write 5 synonyms for 'important'" },
      { step: 2, title: "Learn 5 Words Daily", description: "Pick 5 new professional words each day. Learn definition, example sentence, and common collocations.", action: "Open Vocabulary Builder and add 5 intermediate-level words" },
      { step: 3, title: "Use New Words Immediately", description: "Within 24 hours of learning, use each word in an email, conversation, or speaking exercise.", action: "Write a 3-sentence email using 2 newly learned words" },
      { step: 4, title: "Review Due Cards", description: "The spaced repetition system will surface words for review at optimal intervals. Review all due cards daily.", action: "Complete your daily vocabulary review session (due cards)" },
      { step: 5, title: "Test in Context", description: "Use new vocabulary in the Speaking Practice or IELTS trainer to get feedback on correct usage.", action: "Complete a speaking session using at least 5 recently learned words" },
    ],
    tips: [
      "Learn collocations, not just words: 'conduct research', not just 'research'",
      "Use a word in 3 different sentences to truly own it",
      "Replace weak adjectives: instead of 'good', use 'exceptional', 'robust', 'compelling'",
      "Keep a vocabulary journal and review it weekly",
      "Read a quality English publication (The Economist, HBR) for 15 minutes daily",
      "Watch TED Talks with subtitles and pause to look up unfamiliar words",
    ],
    commonMistakes: [
      "Learning words in lists without context (forgotten within 48 hours)",
      "Using advanced words incorrectly ('utilise' instead of 'use' everywhere)",
      "Skipping the review phase (spaced repetition only works if you review)",
      "Learning only formal words and ignoring collocations",
      "Passive recognition without active use in speaking/writing",
    ],
    bestPractices: [
      "Review flashcards every morning for 10 minutes before starting work",
      "Read one high-quality English article daily and note 3 new words",
      "Use the vocabulary in professional contexts within 24 hours",
      "Build domain-specific vocabulary banks (e.g., tech, finance, healthcare)",
      "Test yourself weekly — can you use this week's words naturally?",
    ],
    realExamples: [
      {
        label: "Describing performance in an interview",
        bad: "I did a lot of work and made things better in my company.",
        whyBad: "Vague, no professional vocabulary, no specifics — could apply to anyone.",
        improved: "I significantly improved our deployment process, which increased team efficiency.",
        expert: "I spearheaded a DevOps transformation initiative that streamlined our CI/CD pipeline, resulting in a 35% reduction in deployment time and enabling more frequent, reliable releases.",
      },
    ],
    exercises: [
      "Replace 5 weak words with stronger alternatives: big → colossal, important → pivotal",
      "Write a LinkedIn-style achievement statement using professional vocabulary",
      "Use 'articulate', 'proficient', 'leverage', 'streamline' in one paragraph",
      "Find the collocations: what word goes with 'decision'? (make/take a decision)",
      "Complete today's spaced repetition review in the Vocabulary Builder",
    ],
    resources: [
      { title: "Merriam-Webster Word of the Day", platform: "Web / App", url: "https://www.merriam-webster.com/word-of-the-day", duration: "2 min/day", level: "Intermediate", description: "Learn one carefully selected word daily with etymology, examples, and usage notes.", isFree: true },
      { title: "Vocabulary.com", platform: "Web", url: "https://www.vocabulary.com", duration: "Self-paced", level: "Intermediate", description: "Adaptive vocabulary learning platform with games and context-rich definitions.", isFree: true },
      { title: "Anki — Spaced Repetition Flashcards", platform: "App / Web", url: "https://apps.ankiweb.net", duration: "10 min/day", level: "Beginner", description: "The gold standard for spaced repetition learning. Download free community vocabulary decks.", isFree: true },
      { title: "Academic Word List Exercises", platform: "Web", url: "https://www.academicvocabularyexercises.com", duration: "Self-paced", level: "Advanced", description: "Master the 570 most important academic and professional English words.", isFree: true },
    ],
    checklist: [
      "I understand how spaced repetition works",
      "I have added my first 5 vocabulary words to the builder",
      "I know the difference between formal and informal register",
      "I have written one sentence using a word I learned this week",
      "I am ready to complete a vocabulary flashcard review session",
    ],
  },

  // ── HR Communication Practice ─────────────────────────────────────────────
  hr: {
    trainerType: "hr",
    title: "HR Communication Practice",
    tagline: "Master behavioural interviews, salary negotiation, and professional HR conversations",
    overview: {
      what: "HR communication encompasses the language and structure used in job interviews, salary discussions, performance reviews, and workplace conflict resolution.",
      why: "Your ability to articulate your experience, navigate sensitive conversations, and advocate for yourself professionally determines interview success and career trajectory.",
      where: ["Job interviews and screening calls", "Salary and offer negotiation", "Performance review discussions", "Promotion conversations", "Workplace conflict resolution"],
      realWorldContext: "Candidates who use the STAR method in behavioural interviews are 40% more likely to advance to the next round compared to those who answer unstructured.",
    },
    fundamentals: [
      { title: "The STAR Method", description: "Situation → Task → Action → Result. The proven framework for answering 'Tell me about a time when...' questions.", emoji: "⭐" },
      { title: "Quantifying Achievements", description: "Use numbers wherever possible: '20% reduction', 'team of 8', '$50,000 saved'. Metrics make stories memorable.", emoji: "📊" },
      { title: "Professional Vocabulary", description: "Use business language: 'spearheaded', 'collaborated', 'implemented', 'optimised', 'delivered'.", emoji: "💼" },
      { title: "Handling Difficult Questions", description: "Know how to address gaps, weaknesses, and failures — turn negatives into growth narratives.", emoji: "🎯" },
      { title: "Salary Negotiation Language", description: "Know when and how to discuss compensation: research ranges, anchor high, never name a number first.", emoji: "💰" },
      { title: "Active Listening", description: "Pause before answering, ask clarifying questions, and acknowledge the interviewer's points.", emoji: "👂" },
    ],
    steps: [
      { step: 1, title: "Prepare Your STAR Stories", description: "Identify 5–7 key experiences and structure each using STAR. Cover: leadership, conflict, failure, success, collaboration.", action: "Write one STAR story about your biggest professional achievement" },
      { step: 2, title: "Research the Company", description: "Know the company's values, recent news, and products. Reference them in your answers.", action: "Read 3 recent news articles about a company you are targeting" },
      { step: 3, title: "Practice 'Tell Me About Yourself'", description: "This is your 60-second commercial. Structure: Present → Past → Future (why this role).", action: "Record your 60-second self-introduction and time it" },
      { step: 4, title: "Master Weakness Handling", description: "Pick a real weakness, show self-awareness, and describe the steps you are taking to improve.", action: "Prepare a 3-sentence answer for: 'What is your greatest weakness?'" },
      { step: 5, title: "Practice with AI Coaching", description: "Use the HR Practice trainer to answer 5 behavioural questions and receive structured feedback.", action: "Complete a full 5-question HR practice session" },
    ],
    tips: [
      "Always answer using STAR — never give unstructured answers to behavioural questions",
      "Quantify every achievement: percentages, revenue, team size, time saved",
      "For 'weakness' questions: choose a real one that you are actively improving",
      "Mirror the company's language and values in your answers",
      "Prepare 3 thoughtful questions to ask the interviewer at the end",
      "Research salary ranges on Glassdoor, LinkedIn Salary, and AmbitionBox",
    ],
    commonMistakes: [
      "Giving vague answers without specific examples ('I am a team player')",
      "Answering 'What is your salary expectation?' too early or too low",
      "Badmouthing previous employers — always frame negatives as learnings",
      "Rambling past 2 minutes on any answer",
      "Not asking any questions at the end of the interview",
    ],
    bestPractices: [
      "Prepare 3 versions of each STAR story: 30 sec, 1 min, and 2 min",
      "Practice answering HR questions aloud — not just in your head",
      "Record mock interviews and review your body language and filler words",
      "Follow up after every interview with a professional thank-you email",
      "Keep a running list of achievements updated quarterly",
    ],
    realExamples: [
      {
        label: "Answering 'Tell me about a challenge you overcame'",
        bad: "Once I had a problem with a project and it was hard but I fixed it.",
        whyBad: "No specifics, no STAR structure, no evidence of skills — meaningless to an interviewer.",
        improved: "In my previous role, we faced a critical API outage one hour before a major product launch. I coordinated with our DevOps team, identified a configuration error, and we resolved it within 40 minutes. The launch proceeded successfully.",
        expert: "At TechCorp, we experienced a critical API failure one hour before our biggest product launch. As the lead engineer on-call, I immediately assembled a 3-person response team, used our monitoring tools to trace the issue to a misconfigured load balancer, and coordinated a rollback. Within 40 minutes, the system was restored. The launch went ahead on time, and we subsequently implemented automated configuration testing to prevent recurrence.",
      },
    ],
    exercises: [
      "Write your answer to 'Tell me about yourself' in exactly 90 seconds",
      "Prepare a STAR story about a time you showed leadership",
      "Answer: 'Why do you want to leave your current job?' — positively",
      "Practice salary negotiation: counter a ₹10 LPA offer to reach ₹13 LPA",
      "Prepare 3 questions to ask the interviewer that show deep research",
    ],
    resources: [
      { title: "Jeff Su — Interview Tips (Ex-Google)", platform: "YouTube", url: "https://www.youtube.com/@JeffSu", duration: "10–15 min videos", level: "Intermediate", description: "Practical, high-quality interview coaching from a former Google employee.", isFree: true },
      { title: "Exponent — System Design & Behavioural", platform: "YouTube", url: "https://www.youtube.com/@tryexponent", duration: "20–40 min videos", level: "Intermediate", description: "Behavioural interview deep-dives with mock interview recordings.", isFree: true },
      { title: "LinkedIn Interview Prep", platform: "LinkedIn", url: "https://www.linkedin.com/interview-prep", duration: "Self-paced", level: "Beginner", description: "Free AI-powered interview preparation tool with practice questions and tips.", isFree: true },
      { title: "Coursera — Successful Interviewing", platform: "Coursera (Free Audit)", url: "https://www.coursera.org/learn/interview-preparation", duration: "~4 weeks", level: "Beginner", description: "University of Maryland's free course on interview skills, salary negotiation, and career strategy.", isFree: true },
    ],
    checklist: [
      "I have prepared at least 3 STAR stories covering different situations",
      "I can answer 'Tell me about yourself' in under 90 seconds",
      "I know my salary range based on market research",
      "I have prepared my answer for 'What is your weakness?'",
      "I have 3 thoughtful questions ready to ask the interviewer",
    ],
  },

  // ── Public Speaking Coach ─────────────────────────────────────────────────
  public: {
    trainerType: "public",
    title: "Public Speaking Coach",
    tagline: "Command any room with confidence, clarity, and charisma",
    overview: {
      what: "Public speaking is the art of delivering a message to an audience — in presentations, speeches, pitches, or panels — with clarity, confidence, and impact.",
      why: "Public speaking is consistently ranked as the #1 career-accelerating skill. Leaders, entrepreneurs, and high-performers all possess the ability to inspire and persuade audiences.",
      where: ["Board presentations and investor pitches", "Conference keynotes", "Team all-hands meetings", "Product demos and client presentations", "Award ceremonies and panel discussions"],
      realWorldContext: "Warren Buffett said learning public speaking is worth 50% more than any other skill, and he paid $100 to take a Dale Carnegie course early in his career.",
    },
    fundamentals: [
      { title: "Opening Impact", description: "The first 30 seconds determine whether your audience listens. Open with a question, story, or shocking statistic.", emoji: "🎬" },
      { title: "Structure: The Rule of Three", description: "Group ideas in threes. The brain remembers three things best. 'First, Second, Third' creates clarity.", emoji: "3️⃣" },
      { title: "Vocal Variety", description: "Vary your pitch, pace, and volume. Monotone voices lose audiences within minutes.", emoji: "🎵" },
      { title: "Body Language", description: "Stand tall, use open gestures, make eye contact with different audience members, and own the stage.", emoji: "🕴️" },
      { title: "Storytelling", description: "Data tells, stories sell. Every great speech has at least one personal or relatable story at its core.", emoji: "📖" },
      { title: "Powerful Closing", description: "End with a call to action or memorable statement. The audience remembers the last thing you say.", emoji: "🏁" },
    ],
    steps: [
      { step: 1, title: "Study Master Speakers", description: "Watch 5 TED Talks and analyse: opening technique, structure, vocal variety, body language, and closing.", action: "Watch Simon Sinek's 'How Great Leaders Inspire Action' and take notes" },
      { step: 2, title: "Prepare Your Structure", description: "Outline any speech: Hook → 3 Main Points → Stories/Data → Call to Action → Memorable Close.", action: "Create an outline for a 3-minute speech on a topic you know well" },
      { step: 3, title: "Practise Your Opening", description: "Rehearse just the first 60 seconds 20 times until it flows effortlessly — this is your most critical moment.", action: "Rehearse and record your speech opening 5 times" },
      { step: 4, title: "Work on Vocal Delivery", description: "Read a paragraph aloud 3 ways: whisper, normal, projected. Find the right energy and vary your pitch.", action: "Read your speech with deliberate pauses after every 3 sentences" },
      { step: 5, title: "Rehearse in Full", description: "Deliver the complete speech to a wall, mirror, or video camera. Repeat until you can deliver it without notes.", action: "Record a full speech rehearsal and evaluate it yourself" },
    ],
    tips: [
      "Open with a story, question, or statistic — never 'Good morning, my name is...'",
      "Pause dramatically after your most important point — let it land",
      "Make eye contact: 3 seconds per person, moving around the room",
      "Gesture with open palms — it signals openness and honesty",
      "Slow down when delivering key insights — speed = nervousness",
      "Prepare for Q&A by anticipating the 5 toughest questions",
    ],
    commonMistakes: [
      "Reading directly from slides or notes (kills credibility instantly)",
      "Speaking too fast due to nervousness",
      "Using jargon that the audience does not understand",
      "No eye contact — staring at the screen or floor",
      "Ending weakly with 'That's all from me, thank you'",
    ],
    bestPractices: [
      "Join Toastmasters for a structured public speaking community",
      "Record every speech and watch it back — brutal but transformational",
      "Volunteer to speak at every opportunity — experience is the only teacher",
      "Rehearse standing up, not sitting down — your body posture affects your delivery",
      "Get a speaking coach or mentor who gives honest feedback",
    ],
    realExamples: [
      {
        label: "Opening a product presentation",
        bad: "Good morning everyone, my name is Raj and I will be presenting about our new product today.",
        whyBad: "Generic, boring, no hook — the audience is already on their phones.",
        improved: "Imagine losing 2 hours of work every single day to a problem that already has a solution. That is what our team built this product to solve.",
        expert: "In 2023, our biggest client lost $2 million because of a workflow inefficiency that took just 3 minutes to fix — once you know how. Today, I am going to show you exactly how our platform solves that problem at scale, and why 50 companies have already switched in the last 6 months.",
      },
    ],
    exercises: [
      "Deliver a 60-second introduction speech — hook, 3 points, call to action",
      "Give a 90-second impromptu talk on a random object in your room",
      "Present a problem and solution in exactly 2 minutes",
      "Deliver a motivational message to a team after a setback",
      "Pitch your city to someone considering visiting in 60 seconds",
    ],
    resources: [
      { title: "TED Masterclass — The Official TED Guide to Public Speaking", platform: "YouTube / Book", url: "https://www.youtube.com/@TED", duration: "Various", level: "Intermediate", description: "Learn from the world's best speakers across thousands of free TED Talks.", isFree: true },
      { title: "Toastmasters International", platform: "Web", url: "https://www.toastmasters.org", duration: "Ongoing", level: "Beginner", description: "The world's largest public speaking organisation. Join free online meetings to practice.", isFree: true },
      { title: "Conor Neill — Entrepreneurship & Public Speaking", platform: "YouTube", url: "https://www.youtube.com/@ConorNeill", duration: "10–20 min videos", level: "Intermediate", description: "Deep, practical advice on influence, persuasion, and public speaking from a professor at IESE Business School.", isFree: true },
      { title: "Coursera — Dynamic Public Speaking", platform: "Coursera (Free Audit)", url: "https://www.coursera.org/specializations/public-speaking", duration: "~4 months", level: "Beginner", description: "University of Washington's comprehensive public speaking specialisation — free to audit.", isFree: true },
    ],
    checklist: [
      "I have watched at least one TED Talk and analysed the opening technique",
      "I have outlined a speech structure using Hook → 3 Points → CTA",
      "I understand the Rule of Three",
      "I have practised my speech opening at least 3 times",
      "I am ready to deliver a 60-second speech in the AI trainer",
    ],
  },

  // ── Email Writing Coach ───────────────────────────────────────────────────
  email: {
    trainerType: "email",
    title: "Email Writing Coach",
    tagline: "Write clear, professional emails that get responses",
    overview: {
      what: "Professional email writing is the art of communicating clearly, concisely, and persuasively through written messages in a workplace context.",
      why: "The average professional sends 40 emails per day and receives 121. How you write emails directly affects your professional reputation, productivity, and relationships.",
      where: ["Client communication", "Internal team updates", "Escalation and complaint handling", "Follow-ups and proposals", "Job applications and networking"],
      realWorldContext: "Poor email writing costs businesses an estimated $400 billion annually in lost productivity and miscommunication. Clear emails get responses 3x faster.",
    },
    fundamentals: [
      { title: "Subject Line Clarity", description: "The subject line determines open rate. Be specific: 'Meeting reschedule — Thu 3pm to Fri 10am' not 'Meeting'.", emoji: "📌" },
      { title: "The Pyramid Structure", description: "Start with the most important information. Background → Request → Details — not the reverse.", emoji: "🔺" },
      { title: "Tone Calibration", description: "Match formality to the relationship: formal for new contacts, professional-casual for colleagues.", emoji: "🎭" },
      { title: "Conciseness", description: "Every sentence must earn its place. If a sentence does not add information, delete it.", emoji: "✂️" },
      { title: "Clear Call to Action", description: "Every email should end with a clear next step: 'Please confirm by Thursday 5pm' not 'Let me know'.", emoji: "📋" },
      { title: "Proofreading", description: "Read every email aloud before sending. Errors in emails permanently damage professional credibility.", emoji: "🔍" },
    ],
    steps: [
      { step: 1, title: "Understand Email Anatomy", description: "Every professional email: Subject → Greeting → Context (1 sentence) → Body (3–5 sentences) → CTA → Sign-off.", action: "Rewrite your most recent sent email using this structure" },
      { step: 2, title: "Master the Subject Line", description: "Write 3 versions of the same subject line and pick the most specific and action-oriented one.", action: "Write 3 subject lines for: 'I need a deadline extension'" },
      { step: 3, title: "Write the Opening Line", description: "Never start with 'Hope you are doing well'. Start with your purpose: 'I am writing to request / confirm / update'.", action: "Write 5 professional email opening lines for different scenarios" },
      { step: 4, title: "Craft a Clear CTA", description: "What do you need the reader to DO? Make it explicit, measurable, and time-bound.", action: "Rewrite 'Please let me know your thoughts' as a clear, specific request" },
      { step: 5, title: "Practice AI Email Tasks", description: "Complete 3 email writing tasks with AI feedback on tone, grammar, professionalism, and structure.", action: "Start an Email Writing session and complete the first task" },
    ],
    tips: [
      "Write the email, then cut it by 30% — you will always find words to remove",
      "Never send an email when angry — write it, save it, review it tomorrow",
      "Use bullet points for 3+ items — walls of text are never read fully",
      "BCC people who need info but not the reply chain",
      "Reply within 24 hours — even if just to say you will respond fully later",
      "Use 'I' not 'We' when taking personal ownership of an action",
    ],
    commonMistakes: [
      "Burying the main request at the end after paragraphs of context",
      "Reply-all when only one person needs to respond",
      "Using vague CTAs: 'Let me know your thoughts / Please revert'",
      "Emotionally charged language in written form (escalates conflict)",
      "Sending emails without proofreading (typos are professional reputation damage)",
    ],
    bestPractices: [
      "Batch process emails at set times — avoid constant inbox checking",
      "Use email templates for frequently repeated messages",
      "Archive immediately after replying — keep inbox as a to-do list",
      "Use subject line flags: [Action Required], [FYI], [Urgent]",
      "Follow up exactly once if no response after 3 business days",
    ],
    realExamples: [
      {
        label: "Requesting a meeting with a busy stakeholder",
        bad: "Hi, I want to have a meeting with you to discuss some things that are important. Please let me know when you are free.",
        whyBad: "No context, no time frame, no respect for the recipient's time, vague ask.",
        improved: "Hi Priya, I would like a 30-minute call to discuss the Q4 budget allocation. Are you available Tuesday or Wednesday between 2–4pm?",
        expert: "Hi Priya, I hope your week is going well. I would value 30 minutes of your time to discuss the Q4 budget allocation for the platform team — specifically to align on the infrastructure spend before the board presentation on the 15th. Would Tuesday 2–3pm or Wednesday 10–11am work for you? I am happy to adjust to your schedule.",
      },
    ],
    exercises: [
      "Request a deadline extension from your manager — professional tone",
      "Write a follow-up email after a job interview thanking the interviewer",
      "Escalate a delayed delivery from a vendor — firm but professional",
      "Send a project status update to 3 stakeholders with different levels of detail",
      "Decline a meeting invitation politely and propose an alternative",
    ],
    resources: [
      { title: "Grammarly Blog — Business Writing", platform: "Web", url: "https://www.grammarly.com/blog/business-writing", duration: "10 min reads", level: "Beginner", description: "Practical, free guides on professional email writing, business communication, and grammar.", isFree: true },
      { title: "Harvard Business Review — Business Writing", platform: "Web", url: "https://hbr.org/topic/subject/business-writing", duration: "10 min reads", level: "Intermediate", description: "Expert articles on writing more persuasively and professionally in a business context.", isFree: true },
      { title: "Coursera — Business Writing", platform: "Coursera (Free Audit)", url: "https://www.coursera.org/learn/writing-for-business", duration: "~4 weeks", level: "Beginner", description: "University of Michigan's free business writing course covering emails, reports, and proposals.", isFree: true },
      { title: "Writing for Results — LinkedIn Learning", platform: "Web", url: "https://www.linkedin.com/learning/business-writing-principles", duration: "1.5 hours", level: "Intermediate", description: "Business writing principles for professional communication — free with LinkedIn Premium trial.", isFree: false },
    ],
    checklist: [
      "I understand the 5-part email anatomy",
      "I know how to write a specific, action-oriented subject line",
      "I can write a clear call to action with a deadline",
      "I have reviewed 3 common email mistakes I will avoid",
      "I am ready to write my first AI email writing task",
    ],
  },

  // ── Storytelling Coach ────────────────────────────────────────────────────
  storytelling: {
    trainerType: "storytelling",
    title: "Storytelling Coach",
    tagline: "Tell compelling stories that inspire, persuade, and connect",
    overview: {
      what: "Storytelling is the craft of shaping experiences into narratives with structure, emotion, and purpose — to inform, persuade, or inspire an audience.",
      why: "Stories are 22x more memorable than facts alone. The best leaders, salespeople, and communicators use stories to make ideas stick and audiences act.",
      where: ["Job interviews (STAR method)", "Sales pitches and product demos", "Leadership communication", "Brand building and marketing", "Presentations and keynotes"],
      realWorldContext: "Steve Jobs, Elon Musk, and Oprah Winfrey are all master storytellers. Every Apple product launch was built around a story before a single feature was mentioned.",
    },
    fundamentals: [
      { title: "The Story Arc", description: "Every great story has: Setup (who, when, where) → Conflict (the problem) → Climax (the turning point) → Resolution (the outcome).", emoji: "🏔️" },
      { title: "Emotional Hook", description: "Connect with the listener's emotions within the first 30 seconds. Stories that make us feel are stories we remember.", emoji: "💙" },
      { title: "Specificity", description: "Specific details make stories real. 'A Tuesday in January' is more vivid than 'one day'. '127 people' is more powerful than 'many people'.", emoji: "🔬" },
      { title: "The STAR Method", description: "Situation → Task → Action → Result. The professional storytelling framework for interviews and work contexts.", emoji: "⭐" },
      { title: "Pacing and Tension", description: "Slow down at the most emotional or dramatic moment. Speed up in the build-up. Silence creates anticipation.", emoji: "⏱️" },
      { title: "The Lesson", description: "Every story should have a takeaway. What did you learn? What should the audience do differently?", emoji: "💡" },
    ],
    steps: [
      { step: 1, title: "Collect Your Stories", description: "Identify 10 personal experiences that taught you something: successes, failures, surprises, turning points.", action: "Write a list of 5 memorable personal experiences" },
      { step: 2, title: "Apply the Story Arc", description: "Take your best story and map it: Setup → Conflict → Turning Point → Resolution → Lesson.", action: "Structure one story using the 4-part story arc" },
      { step: 3, title: "Add Vivid Details", description: "Revisit your story and add: 1 sensory detail, 1 emotion, 1 specific number or fact.", action: "Rewrite your story with 3 specific details that were not there before" },
      { step: 4, title: "Practise the Delivery", description: "Tell your story aloud — vary pace, pause at the climax, use voice to convey emotion.", action: "Record your story and listen for emotional delivery" },
      { step: 5, title: "AI Story Evaluation", description: "Share your story with the AI Storytelling coach for feedback on structure, emotion, flow, and vocabulary.", action: "Complete a full storytelling session in the AI trainer" },
    ],
    tips: [
      "Start in the middle of the action — not 'In 2018, I was born in...'",
      "Use dialogue: 'She looked at me and said...' brings the listener into the scene",
      "Pause after the most impactful line — let it breathe",
      "Use the rule of three: three obstacles, three lessons, three characters",
      "End with the lesson, not the resolution — the lesson is why you told the story",
      "Practice each story until it feels natural, not rehearsed",
    ],
    commonMistakes: [
      "Starting with too much background before the conflict (losing the audience)",
      "Telling the story chronologically without building tension",
      "Vague details ('some time ago', 'a lot of people', 'a big problem')",
      "No emotional arc — it reads like a report, not a story",
      "Forgetting the lesson — leaving the audience wondering 'so what?'",
    ],
    bestPractices: [
      "Keep a story journal — write down interesting experiences as they happen",
      "Study great storytellers: listen to The Moth podcast or TED's Best Stories",
      "Adapt the same story for different audiences and purposes",
      "Use data to support stories: numbers + narrative = persuasion",
      "Practice storytelling in casual conversations before high-stakes settings",
    ],
    realExamples: [
      {
        label: "Telling a story about learning from failure",
        bad: "Once I had a project that failed and it was hard but I learned from it.",
        whyBad: "No emotion, no specific details, no arc, no lesson — completely forgettable.",
        improved: "In 2022, I led a product launch that missed its deadline by 3 weeks. I was devastated. But that failure forced me to implement proper sprint planning, which made our next 4 launches 100% on time.",
        expert: "In January 2022, I stood in front of 30 stakeholders and delivered the hardest sentence of my career: 'We will miss the launch deadline by 3 weeks.' The silence was suffocating. I had been so focused on building features that I had neglected risk management entirely. That moment changed how I lead projects. I immediately introduced bi-weekly risk reviews, cross-team alignment sessions, and a clear escalation protocol. Our next four launches were delivered on time. Failure taught me what 10 successful projects never could.",
      },
    ],
    exercises: [
      "Tell the story of the biggest risk you ever took in 90 seconds",
      "Describe a time you changed your mind about something important",
      "Tell a story about a person who inspired you — include one piece of dialogue",
      "Share a 2-minute story about a time you helped someone",
      "Tell the story of your career journey as a 3-chapter narrative",
    ],
    resources: [
      { title: "The Moth Podcast — True Personal Stories", platform: "Podcast", url: "https://themoth.org/radio-hour", duration: "10–20 min episodes", level: "Beginner", description: "The gold standard of personal storytelling. Listen to master storytellers and study their structure and delivery.", isFree: true },
      { title: "Matthew Dicks — Storyworthy", platform: "YouTube / Book", url: "https://www.youtube.com/@matthewdicks", duration: "Various", level: "Intermediate", description: "The world's most successful Moth storyteller shares concrete techniques for crafting memorable stories.", isFree: true },
      { title: "Pixar's Rules of Storytelling", platform: "Web", url: "https://www.pixar.com/storytelling", duration: "30 min read", level: "Beginner", description: "Pixar's 22 rules of storytelling — the most influential storytelling framework in modern media.", isFree: true },
      { title: "Coursera — Everyday Storytelling", platform: "Coursera (Free Audit)", url: "https://www.coursera.org/learn/everyday-storytelling", duration: "~4 weeks", level: "Beginner", description: "Berkeley Haas School's free course on storytelling for professional contexts.", isFree: true },
    ],
    checklist: [
      "I have identified 3 personal stories I can tell in a professional context",
      "I understand the 4-part story arc: Setup → Conflict → Turning Point → Lesson",
      "I have added specific details to make one story vivid",
      "I know the common mistake of starting too slowly",
      "I am ready to tell a story in the AI Storytelling coach",
    ],
  },

  // ── Leadership Communication ──────────────────────────────────────────────
  leadership: {
    trainerType: "leadership",
    title: "Leadership Communication",
    tagline: "Inspire, direct, and align teams through powerful leadership language",
    overview: {
      what: "Leadership communication is how managers, team leads, and executives convey direction, feedback, motivation, and decision-making to teams — with authority, empathy, and clarity.",
      why: "90% of leadership failures are attributed to poor communication. How you communicate determines whether your team feels inspired or disengaged, aligned or confused.",
      where: ["Team meetings and one-on-ones", "Performance reviews and feedback sessions", "Conflict mediation", "Organisational announcements", "Motivational speeches and team rallies"],
      realWorldContext: "Gallup research shows that 70% of the variance in employee engagement is directly attributable to the manager's communication style.",
    },
    fundamentals: [
      { title: "Clarity Over Complexity", description: "Great leaders communicate simply. If you cannot explain it to a 10-year-old, you do not understand it well enough yet.", emoji: "🎯" },
      { title: "Empathy First", description: "Understand before directing. Acknowledge emotions before offering solutions in difficult conversations.", emoji: "💙" },
      { title: "Decisive Language", description: "Avoid 'maybe', 'I think', 'sort of'. Leaders use: 'We will', 'My decision is', 'The plan is'. Decisiveness builds trust.", emoji: "⚡" },
      { title: "Feedback Mastery", description: "Use the SBI model: Situation → Behaviour → Impact. Focus on observable behaviours, not character judgements.", emoji: "🔄" },
      { title: "Active Listening", description: "Ask more questions than you make statements. The best leaders are the best listeners.", emoji: "👂" },
      { title: "Vision Alignment", description: "Connect every task and decision to the bigger purpose. 'Why' is more motivating than 'what' or 'how'.", emoji: "🌟" },
    ],
    steps: [
      { step: 1, title: "Learn the SBI Feedback Model", description: "Situation → Behaviour → Impact. Practice giving feedback on specific behaviours, not personality.", action: "Write a piece of SBI feedback for an imaginary team member scenario" },
      { step: 2, title: "Develop Your Leadership Voice", description: "Identify 3 words that describe the leader you want to be. Align your communication to these words.", action: "Write your leadership philosophy in 3 sentences" },
      { step: 3, title: "Practice Difficult Conversations", description: "Rehearse addressing underperformance, conflict, and mistakes — empathetically and directly.", action: "Role-play: address a team member who missed a deadline twice" },
      { step: 4, title: "Master Motivational Language", description: "Learn to connect tasks to purpose, celebrate effort (not just results), and acknowledge team contributions.", action: "Write a team appreciation message that is specific and genuine" },
      { step: 5, title: "AI Leadership Scenarios", description: "Practice responding to 4 leadership situations with AI feedback on authority, empathy, and clarity.", action: "Complete a full Leadership Communication session in the AI trainer" },
    ],
    tips: [
      "Say 'We' for successes and 'I' for accountability — not the reverse",
      "Ask 'What do you need from me?' before giving advice",
      "When delivering bad news: Context → Impact → Path Forward — never sugarcoat",
      "Give feedback within 48 hours of the event — not weeks later",
      "Repeat your team's purpose in every all-hands — people need to hear the 'why' regularly",
      "Use silence strategically — pause after important statements",
    ],
    commonMistakes: [
      "Giving vague or sandwich feedback ('you are great, but...') that confuses the recipient",
      "Avoiding difficult conversations until they become crises",
      "Making decisions without explaining the reasoning (breeds distrust)",
      "Micromanaging instead of delegating with clear expectations",
      "Praising only results, not effort and growth",
    ],
    bestPractices: [
      "Hold weekly one-on-ones with every direct report — never cancel them",
      "Send a weekly team update: progress, priorities, blockers, and appreciation",
      "Ask for upward feedback regularly: 'What can I do better as your manager?'",
      "Document all important decisions and communicate reasoning transparently",
      "Read 'Dare to Lead' by Brené Brown or 'The Manager's Path' by Camille Fournier",
    ],
    realExamples: [
      {
        label: "Addressing repeated deadline misses",
        bad: "Hey you have been missing deadlines again and it is not good. Please try to be more careful.",
        whyBad: "No specifics (SBI), no impact stated, no action plan, vague ask, could feel personal.",
        improved: "In the last two sprints, the API feature was delivered 3 days late both times. This pushed back the QA cycle and affected our release date. I want to understand what is getting in the way and how I can support you.",
        expert: "I want to talk about the last two sprint deliverables. In both cases, the API feature was delivered 3 days past the agreed date, which had a knock-on effect on QA and pushed our release by a week. I am not sharing this to assign blame — I want to understand what obstacles you are facing. What does your current workload look like, and what support do you need to meet these timelines going forward?",
      },
    ],
    exercises: [
      "Deliver feedback using SBI on a team member who interrupted a meeting repeatedly",
      "Announce a difficult change (budget cut, layoff) to your team — empathetically and clearly",
      "Motivate a team after a product failure — without minimising the setback",
      "Delegate a critical task to a junior team member with clear expectations",
      "Mediate a conflict between two senior team members",
    ],
    resources: [
      { title: "Simon Sinek — Leaders Eat Last", platform: "YouTube / Book", url: "https://www.youtube.com/@SimonSinek", duration: "Various", level: "Intermediate", description: "Simon Sinek's research on leadership, purpose, and how great leaders communicate.", isFree: true },
      { title: "Harvard ManageMentor — Giving Feedback", platform: "Web", url: "https://hbr.org/topic/subject/feedback", duration: "10–15 min reads", level: "Intermediate", description: "Harvard Business Review's free articles on giving feedback, having difficult conversations, and leadership communication.", isFree: true },
      { title: "Manager Tools Podcast", platform: "Podcast", url: "https://www.manager-tools.com/podcasts", duration: "30 min episodes", level: "Intermediate", description: "The world's most popular management podcast — practical, evidence-based leadership communication advice.", isFree: true },
      { title: "Coursera — Inspiring and Motivating Individuals", platform: "Coursera (Free Audit)", url: "https://www.coursera.org/learn/inspiring-motivation", duration: "~4 weeks", level: "Intermediate", description: "University of Michigan's free leadership course covering motivation, feedback, and team communication.", isFree: true },
    ],
    checklist: [
      "I understand the SBI feedback model",
      "I have written my personal leadership philosophy",
      "I know the difference between empathy and sympathy in conversations",
      "I have reviewed common leadership communication mistakes",
      "I am ready to practice a difficult leadership scenario in the AI trainer",
    ],
  },

  // ── Negotiation Practice ──────────────────────────────────────────────────
  negotiation: {
    trainerType: "negotiation",
    title: "Negotiation Practice",
    tagline: "Get what you deserve through principled, confident negotiation",
    overview: {
      what: "Negotiation is the process of reaching a mutually acceptable agreement between two or more parties — through communication, reasoning, and strategic give-and-take.",
      why: "Every professional who negotiates their salary earns an average of ₹15–30 lakhs more over a 10-year career compared to those who accept the first offer. Negotiation is the highest-ROI skill you can develop.",
      where: ["Salary and compensation negotiation", "Client and vendor contracts", "Freelance project pricing", "Internal resource and budget requests", "Real estate and major purchases"],
      realWorldContext: "A 2021 study found that only 37% of professionals always negotiate salary. Of those who did, 85% received more than the initial offer — simply by asking.",
    },
    fundamentals: [
      { title: "BATNA", description: "Best Alternative To a Negotiated Agreement. Always know your walkaway point. BATNA is your source of power.", emoji: "🛡️" },
      { title: "Anchoring", description: "The first number stated sets the reference point. Always anchor high and let the other party negotiate down.", emoji: "⚓" },
      { title: "Interest vs Position", description: "Positions are stated demands. Interests are underlying needs. Focus on interests to find creative solutions.", emoji: "🔍" },
      { title: "Active Listening", description: "The best negotiators listen 70% and speak 30%. Silence after their offer is a powerful tool.", emoji: "👂" },
      { title: "Emotional Control", description: "Never show desperation, anger, or excessive enthusiasm. Stay calm and analytical throughout.", emoji: "🧘" },
      { title: "Strategic Concessions", description: "Never concede without getting something in return. Every concession should be framed as a trade.", emoji: "♟️" },
    ],
    steps: [
      { step: 1, title: "Research Your Market Value", description: "Before any salary negotiation, research ranges on Glassdoor, LinkedIn Salary, AmbitionBox, and Levels.fyi.", action: "Research the market range for your role and experience level right now" },
      { step: 2, title: "Define Your BATNA", description: "What is your walkaway point? What happens if this negotiation fails? Clarity here gives you confidence.", action: "Write down your BATNA for your next salary negotiation" },
      { step: 3, title: "Prepare Your Anchor", description: "Set your opening ask 20–30% above your target to leave room for negotiation.", action: "Calculate your target and your opening anchor number" },
      { step: 4, title: "Practise the Key Moments", description: "Rehearse: (1) making your opening ask, (2) responding to counteroffers, (3) asking for time to consider.", action: "Role-play: counter 'Our best offer is X' with confidence and logic" },
      { step: 5, title: "AI Negotiation Roleplay", description: "Practice salary and client negotiation scenarios with an AI counterpart that pushes back.", action: "Complete a full 4-round negotiation session in the AI trainer" },
    ],
    tips: [
      "Never accept or reject the first offer immediately — always ask for time: 'Thank you, let me consider this'",
      "Ask for the full package: base, bonus, stock, leave, remote work, learning budget",
      "Use silence: after stating your number, stop talking. Let them respond first.",
      "Quantify your value: 'Based on my experience delivering X and Y, I am targeting Z'",
      "Frame every ask as a question: 'What flexibility do you have around the base salary?'",
      "Know when to stop — overpushing can damage the relationship",
    ],
    commonMistakes: [
      "Accepting the first offer without a single question (costs ₹10–30 LPA over a career)",
      "Revealing your expected salary before hearing the offer",
      "Making emotional arguments ('I need more money for rent') instead of value-based ones",
      "Giving ultimatums too early in the negotiation",
      "Negotiating against yourself by underselling",
    ],
    bestPractices: [
      "Never negotiate via email for the first conversation — do it by phone or in person",
      "Always negotiate the total package, not just the base salary",
      "Get all verbal agreements confirmed in writing before accepting",
      "Practice your negotiation script aloud 5 times before the real conversation",
      "Build a relationship before getting to numbers — people give more to people they like",
    ],
    realExamples: [
      {
        label: "Salary negotiation — countering the first offer",
        bad: "Thank you for the offer. Can you please give me a bit more? I was hoping for something higher.",
        whyBad: "No anchor, no justification, vague ask — easily dismissed. You gave them all the power.",
        improved: "Thank you for the offer — I am very excited about this role. Based on my 4 years of experience and the market data I have reviewed, I was targeting ₹14 LPA. Is there flexibility to move in that direction?",
        expert: "Thank you — I am genuinely excited about this opportunity and can see myself making a significant contribution to the team's goals. Based on my 4 years of delivering full-stack features at scale, including the payment gateway integration that processed ₹50 crore in transactions, and reviewing current market benchmarks on LinkedIn Salary and AmbitionBox, I was targeting ₹15 LPA. I understand budget constraints are real — is there room to discuss the base, or perhaps a performance bonus structure that gets us to that level?",
      },
    ],
    exercises: [
      "Negotiate a ₹10 LPA offer to ₹14 LPA using value-based arguments",
      "Respond to: 'This is our final offer' — without accepting or walking away",
      "Negotiate a project deadline extension with a demanding client",
      "Ask for a promotion during a performance review conversation",
      "Counter a vendor who refuses to reduce their pricing by 15%",
    ],
    resources: [
      { title: "Never Split the Difference — Chris Voss", platform: "YouTube / Book", url: "https://www.youtube.com/@chriss_voss", duration: "Various", level: "Intermediate", description: "FBI hostage negotiator turned negotiation trainer. His YouTube channel has free lessons from the world's best negotiation book.", isFree: true },
      { title: "Coursera — Successful Negotiation", platform: "Coursera (Free Audit)", url: "https://www.coursera.org/learn/negotiation", duration: "~7 weeks", level: "Intermediate", description: "University of Michigan's free negotiation course — one of Coursera's most popular courses ever.", isFree: true },
      { title: "Harvard PON — Negotiation Resources", platform: "Web", url: "https://www.pon.harvard.edu/free-resources", duration: "Self-paced", level: "Advanced", description: "Harvard's Program on Negotiation offers free articles, videos, and case studies on advanced negotiation strategies.", isFree: true },
      { title: "Glassdoor Salary Insights", platform: "Web", url: "https://www.glassdoor.co.in/Salaries", duration: "10 min research", level: "Beginner", description: "Free salary benchmarking tool — essential research before any salary negotiation.", isFree: true },
    ],
    checklist: [
      "I have researched the market salary range for my role",
      "I have defined my BATNA and walkaway point",
      "I know how to anchor and justify my opening number",
      "I have practised one negotiation scenario aloud",
      "I am ready to complete an AI negotiation roleplay session",
    ],
  },

  // ── Confidence Booster ────────────────────────────────────────────────────
  confidence: {
    trainerType: "confidence",
    title: "Confidence Booster",
    tagline: "Build unshakeable confidence in any high-pressure situation",
    overview: {
      what: "Confidence is the consistent ability to act, speak, and present yourself with authority and composure — even in unfamiliar, high-stakes, or intimidating situations.",
      why: "Confident people earn more, get promoted faster, build stronger relationships, and are more persuasive. Confidence is not a trait — it is a skill that is developed through deliberate practice.",
      where: ["Public speaking and presentations", "Job interviews", "Networking events", "Difficult conversations", "Pitching to investors or senior leadership"],
      realWorldContext: "Research by Amy Cuddy (Harvard) shows that posture, presence, and preparation — not natural talent — are the primary predictors of perceived confidence in professional settings.",
    },
    fundamentals: [
      { title: "Preparation", description: "The deepest source of confidence is knowing your material cold. Prepare more than you think you need to.", emoji: "📚" },
      { title: "Body Language", description: "Stand tall, make eye contact, use open gestures. Your physiology changes your psychology — adopt a 'power pose' for 2 minutes before any high-stakes moment.", emoji: "🕴️" },
      { title: "Vocal Authority", description: "Speak slowly, finish sentences clearly, and lower your pitch slightly. Confident voices are deliberate and grounded.", emoji: "🔊" },
      { title: "Reframing Nerves", description: "Nervousness and excitement have identical physiological symptoms. Tell yourself 'I am excited' instead of 'I am nervous'.", emoji: "⚡" },
      { title: "Assertive Language", description: "Eliminate hedging words: replace 'I think maybe...' with 'I believe...', 'sort of' with a clear statement.", emoji: "💪" },
      { title: "Resilience", description: "Confidence recovers quickly from setbacks. Practise bouncing back from unexpected challenges without falling apart.", emoji: "🌱" },
    ],
    steps: [
      { step: 1, title: "Identify Your Confidence Triggers", description: "What situations make you feel most anxious? Ranking them helps you target practice for your biggest challenges.", action: "Write a list of 5 situations where you feel least confident" },
      { step: 2, title: "Practice Power Physiology", description: "Adopt 'power poses' for 2 minutes before high-pressure situations. This changes your hormonal state.", action: "Stand in a power pose for 2 minutes right now and notice how you feel" },
      { step: 3, title: "Eliminate Hedging Language", description: "Record yourself for 5 minutes and count every 'I think maybe', 'I'm not sure', 'kind of'. Replace with direct statements.", action: "Record yourself and identify your 3 most common hedging phrases" },
      { step: 4, title: "Deliberate Discomfort", description: "Do one uncomfortable thing every day: speak up in a meeting, start a conversation with a stranger, ask for something you want.", action: "Identify one uncomfortable action and commit to doing it today" },
      { step: 5, title: "High-Pressure AI Practice", description: "Respond to 4 high-pressure scenarios — investor pitches, public criticism, executive introductions — in the AI trainer.", action: "Complete a full Confidence Booster session with all 4 scenarios" },
    ],
    tips: [
      "Prepare for worst-case scenarios — fear of the unknown shrinks when you have a plan",
      "Use your name when introducing yourself — ownership of your identity projects confidence",
      "Slow your speech by 20% — rushed speech signals nervousness",
      "Hold eye contact for 3–5 seconds before looking away — not more, not less",
      "When you make a mistake, acknowledge it briefly, correct it, and move on — do not dwell",
      "Celebrate small wins daily — confidence is cumulative",
    ],
    commonMistakes: [
      "Waiting to 'feel' confident before acting (confidence comes from action, not before it)",
      "Over-apologising: 'Sorry to bother you, I just wanted to ask...'",
      "Trailing off at the end of sentences — it sounds uncertain",
      "Avoiding eye contact entirely or making it aggressively intense",
      "Downplaying achievements: 'It was nothing' or 'Anyone could have done it'",
    ],
    bestPractices: [
      "Keep a 'confidence journal' — write 3 wins (however small) every evening",
      "Do one uncomfortable thing every single day — discomfort is the currency of growth",
      "Study confident role models and borrow specific mannerisms deliberately",
      "Build competence: the most durable confidence comes from being genuinely skilled",
      "Get coaching or mentoring from someone whose confidence you admire",
    ],
    realExamples: [
      {
        label: "Introducing yourself to senior executives",
        bad: "Hi um I am Priya, I work in the... engineering team... yeah we build the backend stuff.",
        whyBad: "Filler words, trailing off, no specifics, no energy — forgettable within 60 seconds.",
        improved: "Hi, I am Priya — I lead the backend engineering team. We built the payment infrastructure that processed ₹100 crore in transactions last quarter.",
        expert: "Hi, I am Priya. I lead the backend engineering team responsible for our payment and transaction infrastructure. In the last quarter, we scaled the system to handle a 10x traffic spike during the Diwali sale — zero downtime. I am excited to discuss how we can extend that robustness to the new markets you are exploring.",
      },
    ],
    exercises: [
      "Introduce yourself in 60 seconds to a panel of senior executives — make them remember you",
      "Respond calmly to your manager publicly criticising your work in a team meeting",
      "Pitch your biggest career achievement in 90 seconds with energy and specifics",
      "Decline an unreasonable request assertively without apologising",
      "Deliver a confident statement of your opinion on a controversial work topic",
    ],
    resources: [
      { title: "Amy Cuddy — Your Body Language May Shape Who You Are", platform: "YouTube / TED", url: "https://www.ted.com/talks/amy_cuddy_your_body_language_may_shape_who_you_are", duration: "21 min", level: "Beginner", description: "The most watched TED Talk on confidence — Amy Cuddy's research on posture, presence, and power.", isFree: true },
      { title: "Charisma on Command", platform: "YouTube", url: "https://www.youtube.com/@CharismaOnCommand", duration: "10–20 min videos", level: "Beginner", description: "Science-backed analysis of charismatic, confident people — learn by deconstructing real examples.", isFree: true },
      { title: "Mark Manson — Confidence Articles", platform: "Web", url: "https://markmanson.net/confidence", duration: "10–15 min reads", level: "Intermediate", description: "Counterintuitive, research-backed articles on building genuine confidence — not fake positivity.", isFree: true },
      { title: "Coursera — The Science of Well-Being", platform: "Coursera (Free Audit)", url: "https://www.coursera.org/learn/the-science-of-well-being", duration: "~10 weeks", level: "Beginner", description: "Yale's most popular course — covers the science of confidence, happiness, and mindset shifts.", isFree: true },
    ],
    checklist: [
      "I have identified my top 3 confidence-limiting situations",
      "I understand that confidence is a skill built through action, not a feeling waited for",
      "I have read the assertive language tips and identified my hedging words",
      "I have prepared a confident self-introduction",
      "I am ready to tackle high-pressure scenarios in the AI Confidence Booster",
    ],
  },
};

// ── Public API ───────────────────────────────────────────────────────────────

export function getLearningContent(trainerType: string): SkillLearningContent | null {
  return LEARNING_CONTENT[trainerType] ?? null;
}

export function getAllLearningContent(): SkillLearningContent[] {
  return Object.values(LEARNING_CONTENT);
}

export function getRecommendedResource(trainerType: string, weakDimension: string): LearningResource | null {
  const content = LEARNING_CONTENT[trainerType];
  if (!content || !content.resources || content.resources.length === 0) return null;

  // Try to find a resource that explicitly mentions the weak dimension (e.g. 'grammar', 'fluency')
  const keyword = weakDimension.toLowerCase();
  const matched = content.resources.find(
    r => r.title.toLowerCase().includes(keyword) || r.description.toLowerCase().includes(keyword)
  );

  // Fallback to the first resource if no specific match
  return matched || content.resources[0];
}

export { LEARNING_CONTENT };
