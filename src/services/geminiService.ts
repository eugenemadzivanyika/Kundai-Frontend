// Client-side Gemini resource finder is disabled — wired up via backend proxy in Phase 3.
export const findResources = async (_query: string, _subject: string): Promise<string[]> => {
  return [];
};
