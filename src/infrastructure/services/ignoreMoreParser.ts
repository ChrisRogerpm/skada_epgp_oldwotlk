export interface IgnoreEntry {
  name: string;
  reason: string | null;
}

export function parseIgnoreMoreText(content: string): IgnoreEntry[] {
  const entries: IgnoreEntry[] = [];
  
  // Regex to find the name key: ["PlayerName"] =
  const nameRegex = /\["([^"]+)"\]\s*=\s*\{/g;
  let match;

  const ignoredKeys = new Set(["date", "reason", "notes", "list", "ignores", "version"]);

  while ((match = nameRegex.exec(content)) !== null) {
    const name = match[1];
    
    // Validate if it looks like a character name (Starts with uppercase, no spaces, etc.)
    if (ignoredKeys.has(name.toLowerCase()) || !/^[A-Z][a-zÀ-ÿ]+$/.test(name)) {
      continue;
    }

    const startIdx = nameRegex.lastIndex;
    const endIdx = content.indexOf("}", startIdx);
    if (endIdx === -1) continue;

    const blockContent = content.substring(startIdx, endIdx);

    // Extract reason: ["reason"] = "some reason"
    const reasonMatch = /\["reason"\]\s*=\s*"([^"]*)"/.exec(blockContent);
    const reason = reasonMatch ? reasonMatch[1] : null;

    entries.push({ name, reason });
  }

  // Fallback: If the format is simple key-value pairs
  if (entries.length === 0) {
    const simpleRegex = /\["([^"]+)"\]\s*=\s*"([^"]+)"/g;
    while ((match = simpleRegex.exec(content)) !== null) {
      const name = match[1];
      const reason = match[2];
      if (!ignoredKeys.has(name.toLowerCase()) && /^[A-Z][a-zÀ-ÿ]+$/.test(name)) {
        entries.push({ name, reason });
      }
    }
  }

  return entries;
}
