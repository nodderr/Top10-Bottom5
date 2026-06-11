// ============================================================
// Fuzzy matching engine for answer guesses
// Handles case, punctuation, spacing, hyphens, common aliases
// ============================================================

/**
 * Normalize a string for comparison:
 * - Lowercase
 * - Remove punctuation (hyphens, apostrophes, dots, etc.)
 * - Collapse multiple spaces
 * - Trim
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[-_'".!?,;:()&]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
}

/**
 * Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Check if a guess matches a target answer using fuzzy logic.
 *
 * Matching rules:
 * 1. Exact match after normalization → always true
 * 2. One string is a substring of the other (min 4 chars) → true
 * 3. Levenshtein distance ≤ 2 for short strings (≤8 chars) → true
 * 4. Levenshtein distance ≤ 3 for medium strings (≤14 chars) → true
 * 5. Levenshtein distance ≤ 4 for longer strings → true
 */
export function isMatch(guess: string, target: string): boolean {
  const g = normalize(guess);
  const t = normalize(target);

  if (!g || !t) return false;

  // Exact match
  if (g === t) return true;

  // Substring match (both directions, min 4 chars to avoid false positives)
  if (g.length >= 4 && t.includes(g)) return true;
  if (t.length >= 4 && g.includes(t)) return true;

  // Levenshtein distance — scale threshold with length
  const dist = levenshtein(g, t);
  const maxLen = Math.max(g.length, t.length);

  if (maxLen <= 5) return dist <= 1;
  if (maxLen <= 8) return dist <= 2;
  if (maxLen <= 14) return dist <= 3;
  return dist <= 4;
}

/**
 * Find the rank of a matching answer from a list of ranked answers.
 * Returns the rank (1-10) if found, or null if no match.
 * Skips already-revealed ranks.
 */
export function findMatchingRank(
  guess: string,
  answers: Array<{ rank: number; normalizedAnswer: string; answer: string }>,
  alreadyFoundRanks: Set<number>
): number | null {
  for (const answer of answers) {
    if (alreadyFoundRanks.has(answer.rank)) continue;
    if (isMatch(guess, answer.answer) || isMatch(guess, answer.normalizedAnswer)) {
      return answer.rank;
    }
  }
  return null;
}
