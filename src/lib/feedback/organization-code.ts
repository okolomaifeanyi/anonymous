const ORGANIZATION_CODE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

export function normalizeOrganizationCode(code: string) {
  return code.trim().toUpperCase();
}

export function buildOrganizationCodePrefix(name: string) {
  const words = name
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const significantWords = words.filter(
    (word) => !ORGANIZATION_CODE_STOP_WORDS.has(word.toLowerCase()),
  );
  const sourceWords = significantWords.length > 0 ? significantWords : words;
  const prefix = sourceWords.map((word) => word[0]?.toUpperCase() ?? "").join("");

  return prefix.replace(/[^A-Z0-9]/g, "");
}
