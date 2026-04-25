export type MathPaperType = 'paper1' | 'paper2' | 'both' | null | undefined;

interface TypeLabel {
  label: string;   // full label for headings / detail views
  short: string;   // abbreviated label for badges / chips
  bg: string;      // badge background colour
  color: string;   // badge text colour
}

const BASE: Record<string, TypeLabel> = {
  multiple_choice: { label: 'Multiple Choice', short: 'MCQ',    bg: '#ede9fe', color: '#6d28d9' },
  true_false:      { label: 'True / False',    short: 'T/F',    bg: '#fef3c7', color: '#92400e' },
  short_answer:    { label: 'Short Answer',    short: 'SA',     bg: '#dcfce7', color: '#166534' },
  essay:           { label: 'Essay',           short: 'Essay',  bg: '#fce7f3', color: '#9d174d' },
};

const MATH_PAPER2: Partial<Record<string, TypeLabel>> = {
  short_answer: { label: 'Section A — Structured',      short: 'Sec A', bg: '#dbeafe', color: '#1d4ed8' },
  essay:        { label: 'Section B — Long Structured', short: 'Sec B', bg: '#fef3c7', color: '#92400e' },
};

const MATH_PAPER1: Partial<Record<string, TypeLabel>> = {
  short_answer: { label: 'Short Answer (No Calculator)', short: 'P1',  bg: '#dcfce7', color: '#166534' },
};

export function getQuestionTypeInfo(type: string, mathPaperType?: MathPaperType): TypeLabel {
  if (mathPaperType === 'paper2' || mathPaperType === 'both') {
    const override = MATH_PAPER2[type];
    if (override) return override;
  }
  if (mathPaperType === 'paper1') {
    const override = MATH_PAPER1[type];
    if (override) return override;
  }
  return BASE[type] ?? { label: type, short: type, bg: '#f1f5f9', color: '#475569' };
}

export function getQuestionTypeLabel(type: string, mathPaperType?: MathPaperType): string {
  return getQuestionTypeInfo(type, mathPaperType).label;
}
