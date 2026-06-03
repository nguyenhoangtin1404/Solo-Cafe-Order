export function sanitizeText(input: string, maxLength: number): string {
  if (!input || maxLength <= 0) return "";
  // Strip null bytes first — PostgreSQL rejects \x00 in text columns
  let text = input.replace(/\0/g, "");
  // Multi-pass strip — handles nested tags like <<script>script>
  let prev: string;
  do {
    prev = text;
    text = text.replace(/<[^>]*>/g, "");
  } while (text !== prev);
  // Strip dangling < without a closing > (e.g. <script with no >)
  text = text.replace(/</g, "");
  // Spread to Unicode codepoints — .slice() on UTF-16 would split emoji surrogate pairs
  return [...text.trim()].slice(0, maxLength).join("");
}
