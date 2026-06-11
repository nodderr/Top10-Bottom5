// ============================================================
// AI Provider — Gemini Flash integration
// Generates ranked lists for game categories
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIRankingResult } from './types';
import { CategoryConfig } from './categories';
import { normalize } from './fuzzyMatcher';

const MAX_RETRIES = 3;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY environment variable is not set');
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

function buildPrompt(category: CategoryConfig): string {
  return `You are generating content for a fun party game inspired by Family Feud, played by young Indians aged 16-35.

Task: ${category.promptTemplate}

Requirements:
- Provide EXACTLY 10 answers
- Answers must be mainstream, widely recognised, and debatable
- The average Indian 20-year-old should recognise 8+ of these
- Rankings should feel intuitive but spark debate ("no way that's above that!")
- Avoid: obscure facts, politics, religion, offensive content, niche references
- Keep answer names short and clear (1-4 words max)

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "category": "Top 10 [Category Name]",
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

export async function generateRanking(category: CategoryConfig): Promise<AIRankingResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = buildPrompt(category);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const ranking = parseResponse(text);

      // Add normalizedAnswer for fuzzy matching
      ranking.answers = ranking.answers.map((a) => ({
        ...a,
        normalizedAnswer: normalize(a.answer),
      })) as AIRankingResult['answers'];

      return ranking;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`AI generation attempt ${attempt} failed:`, lastError.message);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt)); // backoff
      }
    }
  }

  throw new Error(`AI generation failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
