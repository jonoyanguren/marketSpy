import * as Diff from "diff";

const MAX_EXCERPTS = 6;
const MAX_CHARS_PER_EXCERPT = 120;

/**
 * Extracts meaningful added/removed excerpts from a word-level diff.
 * Skips very short changes (single chars, punctuation only).
 */
export function computeVisibleTextDiff(
  oldText: string,
  newText: string,
): { added: string[]; removed: string[] } {
  const changes = Diff.diffWords(oldText, newText);
  const added: string[] = [];
  const removed: string[] = [];

  for (const part of changes) {
    const trimmed = part.value.trim();
    if (!trimmed) continue;
    if (trimmed.length < 4) continue;
    const excerpt =
      trimmed.length > MAX_CHARS_PER_EXCERPT
        ? trimmed.slice(0, MAX_CHARS_PER_EXCERPT) + "…"
        : trimmed;

    if (part.added && added.length < MAX_EXCERPTS) {
      added.push(excerpt);
    } else if (part.removed && removed.length < MAX_EXCERPTS) {
      removed.push(excerpt);
    }
  }

  return { added, removed };
}
