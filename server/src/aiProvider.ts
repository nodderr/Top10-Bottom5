// ============================================================
// AI Provider — Gemini 2.0 Flash integration
// AI freely generates BOTH the topic AND the ranking list.
// Theme areas are used only as loose inspiration to keep
// categories culturally relevant and fun for Indian audiences.
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIRankingResult } from './types';
import { normalize } from './fuzzyMatcher';

const MAX_RETRIES = 3;
const MODEL_NAME = 'gemini-2.5-flash';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY environment variable is not set');
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

// Broad theme buckets — AI picks ONE and then freely invents
// the specific category title and ranking.
const THEME_BUCKETS = [
  'Indian food and cuisine',
  'Indian movies and Bollywood',
  'Indian cricket and sports',
  'Indian cities and places',
  'Indian pop culture and internet trends',
  'Indian brands and products',
  'Indian TV shows and web series',
  'Global superheroes (Marvel and DC)',
  'Anime and manga',
  'Video games',
  'Social media apps and tech',
  'Cars and motorcycles popular in India',
  'Indian celebrities and influencers',
  'Tourist destinations that Indians love',
  'Nostalgia — things Indian 90s/2000s kids remember',
  'Fast food and restaurant chains in India',
  'Indian music — Bollywood songs and artists',
  'World sports and international teams',
  'OTT platforms and streaming shows',
  'Things Indian college students relate to',
];

// Keep track of recently used themes per session to add variety
const recentThemes: string[] = [];

function pickTheme(usedThemes: string[]): string {
  // Exclude recently used themes across all rooms
  const allUsed = new Set([...usedThemes, ...recentThemes.slice(-5)]);
  const available = THEME_BUCKETS.filter((t) => !allUsed.has(t));
  const pool = available.length > 0 ? available : THEME_BUCKETS;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  // Track globally for variety across rooms
  recentThemes.push(chosen);
  if (recentThemes.length > 10) recentThemes.shift();

  return chosen;
}

function buildPrompt(theme: string): string {
  return `You are the game master for a viral Indian party game — like Family Feud meets Google Feud, played by young Indians aged 16-35.

Your job: Come up with a SPECIFIC, CREATIVE "Top 10" ranking category within the theme of "${theme}", then rank the Top 10 items.

RULES FOR THE CATEGORY TITLE:
- Must be specific and punchy — NOT generic like "Top 10 Indian Foods"
- Think of titles that make people immediately say "oh THIS is going to cause arguments!"
- Examples of GOOD titles: "Top 10 Bollywood Villains of All Time", "Top 10 Things Indian Moms Say", "Top 10 Most Overrated Tourist Spots", "Top 10 Dishes That Hit Different at 2am"
- The title should feel like something a cool podcast would debate
- Keep it fun, relatable, slightly controversial but not offensive

RULES FOR THE RANKING:
- Provide EXACTLY 10 answers ranked 1 to 10
- Every answer must be instantly recognisable to the average Indian 20-year-old
- The ranking should feel intuitive but spark debate — #3 should feel like it could be #1 to someone
- Avoid: obscure facts, politics, religion, violence, offensive content
- Keep each answer short: 1-5 words max

Return ONLY valid JSON — no markdown, no explanation, nothing else:
{
  "category": "Top 10 [Your Creative Category Title Here]",
  "answers": [
    { "rank": 1, "answer": "Answer One" },
    { "rank": 2, "answer": "Answer Two" },
    { "rank": 3, "answer": "Answer Three" },
    { "rank": 4, "answer": "Answer Four" },
    { "rank": 5, "answer": "Answer Five" },
    { "rank": 6, "answer": "Answer Six" },
    { "rank": 7, "answer": "Answer Seven" },
    { "rank": 8, "answer": "Answer Eight" },
    { "rank": 9, "answer": "Answer Nine" },
    { "rank": 10, "answer": "Answer Ten" }
  ]
}`;
}

function parseResponse(text: string): AIRankingResult {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.category || !Array.isArray(parsed.answers)) {
    throw new Error('Invalid AI response structure');
  }
  if (parsed.answers.length !== 10) {
    throw new Error(`Expected 10 answers, got ${parsed.answers.length}`);
  }
  for (const a of parsed.answers) {
    if (typeof a.rank !== 'number' || typeof a.answer !== 'string') {
      throw new Error('Invalid answer structure');
    }
  }

  return parsed as AIRankingResult;
}

/**
 * Generate a fresh ranking — AI picks the specific category title
 * freely within a given broad theme bucket.
 *
 * @param usedThemes - Theme bucket IDs already used in this room's session
 */
export async function generateRanking(usedThemes: string[] = []): Promise<AIRankingResult & { theme: string }> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME });
  const theme = pickTheme(usedThemes);
  const prompt = buildPrompt(theme);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[AI] Generating round — theme: "${theme}" (attempt ${attempt})`);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const ranking = parseResponse(text);

      // Add normalizedAnswer for fuzzy matching
      ranking.answers = ranking.answers.map((a) => ({
        ...a,
        normalizedAnswer: normalize(a.answer),
      })) as AIRankingResult['answers'];

      console.log(`[AI] Generated: "${ranking.category}"`);
      return { ...ranking, theme };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[AI] Attempt ${attempt} failed:`, lastError.message);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt)); // exponential backoff
      }
    }
  }

  throw new Error(`AI generation failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
