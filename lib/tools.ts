import type { Tool } from "./types";

let toolsCache: Tool[] | null = null;

export function getTools(): Tool[] {
  if (toolsCache) return toolsCache;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tools = require("@/app/data/tools-generated.json") as Tool[];
    toolsCache = tools;
    return tools;
  } catch {
    return [];
  }
}

export function getToolBySlug(slug: string): Tool | null {
  const tools = getTools();
  return tools.find((t) => t.slug === slug) || null;
}

export function getToolsByCategory(category: string): Tool[] {
  const tools = getTools();
  return tools.filter((t) => t.category === category);
}

export function getCategories(): string[] {
  const tools = getTools();
  return Array.from(new Set(tools.map((t) => t.category)));
}

export function searchTools(query: string): Tool[] {
  const tools = getTools();
  const q = query.toLowerCase();
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}
