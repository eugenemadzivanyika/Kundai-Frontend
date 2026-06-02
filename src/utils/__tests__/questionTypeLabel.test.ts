import { describe, it, expect } from 'vitest';
import { getQuestionTypeInfo, getQuestionTypeLabel } from '../questionTypeLabel';

describe('getQuestionTypeInfo', () => {
  it('returns correct info for multiple_choice', () => {
    const info = getQuestionTypeInfo('multiple_choice');
    expect(info.label).toBe('Multiple Choice');
    expect(info.short).toBe('MCQ');
  });

  it('returns correct info for true_false', () => {
    const info = getQuestionTypeInfo('true_false');
    expect(info.label).toBe('True / False');
    expect(info.short).toBe('T/F');
  });

  it('returns a fallback for unknown types', () => {
    const info = getQuestionTypeInfo('unknown_type');
    expect(info.label).toBe('unknown_type');
    expect(info.short).toBe('unknown_type');
    expect(info.bg).toBe('#f1f5f9');
  });

  it('applies math paper2 override for short_answer', () => {
    const info = getQuestionTypeInfo('short_answer', 'paper2');
    expect(info.label).toBe('Section A — Structured');
    expect(info.short).toBe('Sec A');
  });

  it('applies math paper2 override for essay', () => {
    const info = getQuestionTypeInfo('essay', 'paper2');
    expect(info.label).toBe('Section B — Long Structured');
  });

  it('applies math paper1 override for short_answer', () => {
    const info = getQuestionTypeInfo('short_answer', 'paper1');
    expect(info.short).toBe('P1');
  });

  it('applies paper2 overrides when mathPaperType is "both"', () => {
    const info = getQuestionTypeInfo('short_answer', 'both');
    expect(info.short).toBe('Sec A');
  });

  it('uses base type when mathPaperType is null', () => {
    const info = getQuestionTypeInfo('short_answer', null);
    expect(info.label).toBe('Short Answer');
  });
});

describe('getQuestionTypeLabel', () => {
  it('returns the full label string', () => {
    expect(getQuestionTypeLabel('essay')).toBe('Essay');
  });

  it('applies paper overrides', () => {
    expect(getQuestionTypeLabel('essay', 'paper2')).toBe('Section B — Long Structured');
  });
});
