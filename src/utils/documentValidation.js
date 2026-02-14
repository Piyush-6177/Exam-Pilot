/**
 * Keywords that indicate academic/syllabus content.
 * Used for Layer 1 (quick check) and Layer 2 (gatekeeper).
 */
export const ACADEMIC_KEYWORDS = [
  'syllabus',
  'university',
  'semester',
  'unit',
  'marks',
  'question',
  'exam',
  'paper',
  'course',
  'module',
  'credit',
  'curriculum',
  'assessment',
  'topic',
  'chapter',
];

/**
 * Count how many distinct keywords appear in text (case-insensitive).
 * @param {string} text
 * @returns {{ count: number, found: string[] }}
 */
export function countKeywordsInText(text) {
  if (!text || typeof text !== 'string') return { count: 0, found: [] };
  const lower = text.toLowerCase();
  const found = ACADEMIC_KEYWORDS.filter((kw) => lower.includes(kw));
  return { count: found.length, found: [...new Set(found)] };
}

/**
 * Layer 1: Quick check - does the first N characters contain at least minKeywords?
 * @param {string} text
 * @param {number} firstNChars
 * @param {number} minKeywords
 * @returns {boolean}
 */
export function hasMinimumAcademicKeywords(text, firstNChars = 1000, minKeywords = 2) {
  const slice = (text || '').slice(0, firstNChars);
  const { count } = countKeywordsInText(slice);
  return count >= minKeywords;
}

/**
 * Layer 2: Gatekeeper - compute a "Relevance Score" based on keyword density.
 * Score = (keyword occurrences in text) / (total words) * 100, with a cap.
 * @param {string} text
 * @returns {{ score: number, passed: boolean, keywordCount: number }}
 */
export function validateDocumentContent(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, passed: false, keywordCount: 0 };
  }

  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let keywordOccurrences = 0;
  for (const keyword of ACADEMIC_KEYWORDS) {
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex);
    if (matches) keywordOccurrences += matches.length;
  }

  // Density: occurrences per 100 words, capped at 100
  const score = wordCount > 0
    ? Math.min(100, (keywordOccurrences / wordCount) * 100)
    : 0;

  // Require at least 2 distinct keywords AND a minimum density (e.g. 0.5%)
  const { count: distinctCount } = countKeywordsInText(text);
  const passed = distinctCount >= 2 && score >= 0.3;

  return {
    score,
    passed,
    keywordCount: keywordOccurrences,
    distinctKeywords: distinctCount,
  };
}
