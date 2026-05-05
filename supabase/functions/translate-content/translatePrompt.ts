export function translateSystem(): string {
  return `You translate UI strings and lesson content while preserving Markdown, placeholders like {{var}}, and proper nouns (Norse god names: Loki, Þórr, Óðinn, etc.). Output strict JSON: { "translations": [ { "key": "...", "value": "..." } ] }.`;
}

export function translateUser(items: { key: string; source: string }[], targetLocale: string): string {
  return `Translate the following items to ${targetLocale === 'tr' ? 'Turkish' : 'English'}.\n` +
    JSON.stringify({ items }, null, 2);
}
