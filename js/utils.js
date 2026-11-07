/**
 * @fileoverview Small, stateless helpers shared across the app.
 */

/**
 * Escape a string so it is safe to place inside HTML text or attribute values.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Decode HTML entities (e.g. "&quot;") coming from the Open Trivia API
 * into plain text. Uses DOMParser, so no scripts are ever executed.
 * @param {string} html
 * @returns {string}
 */
export function decodeHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.documentElement.textContent;
}

/**
 * Return a shuffled copy of an array (Fisher-Yates).
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
export function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
