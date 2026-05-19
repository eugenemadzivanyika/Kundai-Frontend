// Client-side Gemini marking is disabled — wired up via backend proxy in Phase 3.
interface MarkingResult {
  marks: number;
  feedback: string;
  criteria: Array<{
    criterion: string;
    score: number;
    comments: string;
  }>;
}

export const markingService = {
  async markDocument(_file: File): Promise<MarkingResult> {
    throw new Error('AI marking is temporarily unavailable. Please use manual marking.');
  },
};

export default markingService;
