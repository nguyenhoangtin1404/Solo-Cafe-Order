// Safe for React text content only — NOT safe for HTML attribute context (href, title, data-*).
// React auto-escapes text nodes; attribute values need a separate escaping strategy.
export function sanitizeText(input: string, maxLength: number): string {
  if (!input || maxLength <= 0) return "";
  // Strip null bytes — PostgreSQL rejects \x00 in text columns
  let text = input.replace(/\0/g, "");
  // Multi-pass strip — handles nested tags like <<script>script>
  let prev: string;
  do {
    prev = text;
    text = text.replace(/<[^>]*>/g, "");
  } while (text !== prev);
  // Strip orphaned < (e.g. <script with no >) and orphaned > (e.g. <<script>script> → "script>")
  text = text.replace(/</g, "").replace(/>/g, "");
  // Spread to Unicode codepoints — .slice() on UTF-16 would split emoji surrogate pairs
  return [...text.trim()].slice(0, maxLength).join("");
}
