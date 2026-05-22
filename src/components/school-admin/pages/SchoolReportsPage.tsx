import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../../ui/use-toast';
import {
  reportAdminService,
  ReportType, ReportRecord, ReportSchedule, ReportJob,
  ClassOption, SubjectOption, TeacherOption,
} from '../../../services/reportAdminService';

// ── Shared helpers ────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ── Icon helpers ──────────────────────────────────────────────────────────────

function Ico({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  chevronLeft:  'M10 12L6 8l4-4',
  chevronRight: 'M6 12l4-4-4-4',
  check:        'M2 8l4 4 8-8',
  refresh:      'M2 8a6 6 0 1 0 1-3.3M2 2v4h4',
  download:     'M8 3v8M5 8l3 3 3-3M2 13h12',
  trash:        'M3 4h10M6 2h4M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4',
  eye:          'M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5zM8 6a2 2 0 100 4 2 2 0 000-4z',
  sparkles:     'M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5l3.5-.5z',
  calendar:     'M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zM1 6h14M5 1v2M11 1v2',
  clock:        'M8 1a7 7 0 100 14A7 7 0 008 1zM8 4v4l3 2',
  plus:         'M8 2v12M2 8h12',
  pause:        'M5 3h2v10H5zM9 3h2v10H9z',
  play:         'M4 2l10 6-10 6z',
  edit:         'M2 12l8-8 2 2-8 8H2v-2zM10 4l2-2 2 2-2 2z',
  x:            'M3 3l10 10M13 3L3 13',
};

// Map typeId icon key → path
function typeIconPath(icon: string): string {
  const map: Record<string, string> = {
    'file-text':      'M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zM6 5h4M6 8h3M6 11h1',
    'graduation-cap': 'M8 2L2 6l6 4 6-4-6-4zM2 6v5M8 10l-3.5 2.5M8 10l3.5 2.5',
    'building':       'M3 14V5l5-3 5 3v9H3zM6 14v-4h4v4M6 8h4',
    'book':           'M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zM6 5h4M6 8h4M6 11h2',
    'users':          'M6 7.5a2.5 2.5 0 100-5 2.5 2.5 0 000 0M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5M12 7l2 2-2 2M14 9h-3',
  };
  return map[icon] || map['file-text'];
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    ready:      { color: 'var(--forest)', background: 'var(--forest-soft)', border: '1px solid color-mix(in srgb, var(--forest) 22%, transparent)' },
    queued:     { color: 'var(--gold)',   background: 'var(--gold-soft)',   border: '1px solid color-mix(in srgb, var(--gold) 22%, transparent)' },
    generating: { color: 'var(--gold)',   background: 'var(--gold-soft)',   border: '1px solid color-mix(in srgb, var(--gold) 22%, transparent)' },
    failed:     { color: 'var(--terracotta)', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 22%, transparent)' },
  };
  const labels: Record<string, string> = { ready: 'Ready', queued: 'Queued', generating: 'Generating…', failed: 'Failed' };
  const s = styles[status] || styles.queued;
  return (
    <span style={{ ...s, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {labels[status] || status}
    </span>
  );
}

// ── Input / Select primitives ─────────────────────────────────────────────────

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ width: '100%', padding: '7px 10px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 12.5, outline: 'none', boxSizing: 'border-box', ...props.style }}
    />
  );
}
function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ width: '100%', padding: '7px 10px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 12.5, outline: 'none', cursor: 'pointer', ...props.style }}
    />
  );
}
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 6 }}>
      {label}{required && <span style={{ color: 'var(--terracotta)', marginLeft: 2 }}>*</span>}
    </label>
  );
}

// ── Param controls ────────────────────────────────────────────────────────────

function ParamSelect({ label, options = [], value, onChange, required }: any) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <SelectBase value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose…</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </SelectBase>
    </div>
  );
}

function ParamToggle({ label, value, onChange }: any) {
  const on = !!value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{label}</span>
      <button
        onClick={() => onChange(!on)}
        style={{ position: 'relative', width: 36, height: 20, borderRadius: 999, border: 0, cursor: 'pointer', background: on ? 'var(--forest)' : 'var(--rule)', transition: 'background 0.15s' }}
      >
        <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );
}

function ParamMultiClass({ value = [], onChange, required, classes }: any) {
  const byForm: Record<string, ClassOption[]> = {};
  for (const c of (classes || [])) {
    const key = `Form ${c.form}`;
    if (!byForm[key]) byForm[key] = [];
    byForm[key].push(c);
  }
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v: string) => v !== id) : [...value, id]);
  const allIn = (form: string) => byForm[form].every((c: ClassOption) => value.includes(c.id));
  const toggleForm = (form: string) => {
    if (allIn(form)) onChange(value.filter((v: string) => !byForm[form].some((c: ClassOption) => c.id === v)));
    else onChange([...new Set([...value, ...byForm[form].map((c: ClassOption) => c.id)])]);
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <FieldLabel label="Classes" required={required} />
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{value.length} selected</span>
      </div>
      <div style={{ background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, padding: '8px 10px', maxHeight: 240, overflowY: 'auto' }}>
        {Object.entries(byForm).map(([form, cls]) => (
          <div key={form} style={{ marginBottom: 8 }}>
            <button onClick={() => toggleForm(form)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', padding: '2px 0', marginBottom: 4 }}>
              <span style={{ width: 13, height: 13, border: `1.5px solid ${allIn(form) ? 'var(--forest)' : 'var(--rule)'}`, borderRadius: 2, background: allIn(form) ? 'var(--forest)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {allIn(form) && <Ico d={ICONS.check} size={9} />}
              </span>
              {form}
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 4, marginLeft: 18 }}>
              {cls.map((c: ClassOption) => {
                const checked = value.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggle(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', border: `1px solid ${checked ? 'color-mix(in srgb, var(--forest) 40%, transparent)' : 'var(--rule)'}`, borderRadius: 4, background: checked ? 'var(--forest-soft)' : 'var(--paper)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, color: checked ? 'var(--forest)' : 'var(--ink-2)' }}>
                    <span style={{ width: 11, height: 11, border: `1.5px solid ${checked ? 'var(--forest)' : 'var(--rule)'}`, borderRadius: 2, background: checked ? 'var(--forest)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {checked && <Ico d={ICONS.check} size={7} />}
                    </span>
                    Form {c.form}{c.stream} <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>· {c.students} students</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {(classes || []).length === 0 && <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: 8 }}>Loading classes…</div>}
      </div>
    </div>
  );
}

function ParamClassPicker({ value, onChange, required, classes }: any) {
  return (
    <div>
      <FieldLabel label="Class" required={required} />
      <SelectBase value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose a class…</option>
        {(classes || []).map((c: ClassOption) => (
          <option key={c.id} value={c.id}>Form {c.form}{c.stream} · {c.students} students</option>
        ))}
      </SelectBase>
    </div>
  );
}

function ParamMultiSubject({ value = [], onChange, required, subjects }: any) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v: string) => v !== id) : [...value, id]);
  const all = (subjects || []).map((s: SubjectOption) => s.id);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <FieldLabel label="Subjects" required={required} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onChange(all)} style={{ fontSize: 11, color: 'var(--forest)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>All</button>
          <button onClick={() => onChange([])} style={{ fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>None</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 4 }}>
        {(subjects || []).map((s: SubjectOption) => {
          const sel = value.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggle(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', border: `1px solid ${sel ? 'color-mix(in srgb, var(--forest) 40%, transparent)' : 'var(--rule)'}`, borderRadius: 4, background: sel ? 'var(--forest-soft)' : 'var(--paper)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, color: sel ? 'var(--forest)' : 'var(--ink-2)' }}>
              <span style={{ width: 11, height: 11, border: `1.5px solid ${sel ? 'var(--forest)' : 'var(--rule)'}`, borderRadius: 2, background: sel ? 'var(--forest)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {sel && <Ico d={ICONS.check} size={7} />}
              </span>
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ParamMultiForm({ value = [], onChange }: any) {
  const forms = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
  const toggle = (f: string) => onChange(value.includes(f) ? value.filter((v: string) => v !== f) : [...value, f]);
  return (
    <div>
      <FieldLabel label="Forms" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {forms.map(f => {
          const sel = value.includes(f);
          return (
            <button key={f} onClick={() => toggle(f)}
              style={{ padding: '5px 12px', border: `1px solid ${sel ? 'var(--forest)' : 'var(--rule)'}`, borderRadius: 4, background: sel ? 'var(--forest)' : 'var(--paper)', color: sel ? '#fbf8f1' : 'var(--ink-2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: sel ? 600 : 400 }}>
              {f}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ParamMultiTeacher({ value, onChange, teachers }: any) {
  const isAll = value === 'all' || value === undefined;
  const toggle = (id: string) => {
    const arr: string[] = Array.isArray(value) ? value : [];
    onChange(arr.includes(id) ? arr.filter(v => v !== id) : [...arr, id]);
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <FieldLabel label="Teachers" />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onChange('all')} style={{ fontSize: 11, color: isAll ? 'var(--forest)' : 'var(--ink-3)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontWeight: isAll ? 600 : 400 }}>All</button>
          <button onClick={() => onChange([])} style={{ fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>Select specific</button>
        </div>
      </div>
      {isAll ? (
        <div style={{ padding: '8px 12px', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 5, fontSize: 12.5, color: 'var(--ink-3)' }}>
          All {(teachers || []).length} teachers will be included.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 4 }}>
          {(teachers || []).map((t: TeacherOption) => {
            const sel = Array.isArray(value) && value.includes(t.id);
            return (
              <button key={t.id} onClick={() => toggle(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', border: `1px solid ${sel ? 'color-mix(in srgb, var(--forest) 40%, transparent)' : 'var(--rule)'}`, borderRadius: 4, background: sel ? 'var(--forest-soft)' : 'var(--paper)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--paper-shade)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: 'var(--ink-3)', flexShrink: 0 }}>
                  {t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: sel ? 'var(--forest)' : 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t.department}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ParamMultiSelect({ label, options = [], value = [], onChange }: any) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v: string) => v !== o) : [...value, o]);
  return (
    <div>
      <FieldLabel label={label} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {options.map((o: string) => {
          const sel = value.includes(o);
          return (
            <button key={o} onClick={() => toggle(o)}
              style={{ padding: '5px 10px', border: `1px solid ${sel ? 'color-mix(in srgb, var(--forest) 40%, transparent)' : 'var(--rule)'}`, borderRadius: 4, background: sel ? 'var(--forest-soft)' : 'var(--paper)', color: sel ? 'var(--forest)' : 'var(--ink-2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Preview panel (A4 sample) ─────────────────────────────────────────────────

function StepPreview({ reportType, params }: { reportType: ReportType; params: Record<string, any> }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>Preview</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>Sample of what the report will look like. Page 1 only.</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 11, padding: '3px 8px', background: 'var(--paper-shade)', color: 'var(--ink-3)', borderRadius: 4 }}>Sample data</span>
          <span style={{ fontSize: 11, padding: '3px 8px', background: 'var(--sky-soft)', color: 'var(--sky)', borderRadius: 4 }}>A4 · Portrait</span>
        </div>
      </div>
      <div style={{ background: 'var(--paper-shade)', borderRadius: 6, padding: 20, maxHeight: 560, overflowY: 'auto' }}>
        <div style={{ background: '#fff', maxWidth: 760, margin: '0 auto', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', padding: 32, fontFamily: 'Georgia, serif', fontSize: 12, color: '#333', lineHeight: 1.5 }}>
          <PreviewContent typeId={reportType.id} params={params} reportType={reportType} />
        </div>
      </div>
    </div>
  );
}

function PreviewContent({ typeId, params, reportType }: any) {
  const header = (
    <div style={{ borderBottom: '2px solid #1a1814', paddingBottom: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, background: '#1f4d36', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20, fontFamily: "'Source Serif 4', serif", borderRadius: 5 }}>G</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1814', fontFamily: "'Source Serif 4', serif" }}>Goromonzi High School</div>
          <div style={{ fontSize: 11, color: '#7a7062' }}>P.O. Box 12, Goromonzi, Zimbabwe · +263 270 245 100</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 10, color: '#7a7062' }}>
          <div style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Generated</div>
          <div>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a443a' }}>
        {reportType.name} {params.term ? `— ${params.term}` : ''}
      </div>
    </div>
  );

  const paramRows = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== '');

  return (
    <>
      {header}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[{ l: 'Report type', v: reportType.name }, { l: 'Est. pages', v: reportType.pages }, { l: 'Format', v: 'HTML Preview' }].map((k, i) => (
          <div key={i} style={{ border: '1px solid #d9cfb8', borderRadius: 4, padding: 10 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7a7062', fontWeight: 700 }}>{k.l}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1814', marginTop: 4, fontFamily: "'Source Serif 4', serif" }}>{k.v}</div>
          </div>
        ))}
      </div>
      {paramRows.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1a1814', borderBottom: '1px solid #d9cfb8', paddingBottom: 4, marginBottom: 8 }}>Selected parameters</div>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', marginBottom: 16 }}>
            <tbody>
              {paramRows.map(([k, v], i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e6dcc4' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 600, color: '#4a443a', width: '35%' }}>{k}</td>
                  <td style={{ padding: '4px 8px', color: '#1a1814' }}>{Array.isArray(v) ? v.join(', ') : String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p style={{ color: '#7a7062', fontStyle: 'italic', fontSize: 11, borderTop: '1px solid #d9cfb8', paddingTop: 12 }}>
        This is a Phase 13 HTML report preview. Full PDF generation with live student data is scoped to Phase 14.
      </p>
    </>
  );
}

// ── Step 1: Pick ──────────────────────────────────────────────────────────────

function StepPick({ reportTypes, selectedTypeId, onSelect }: { reportTypes: ReportType[]; selectedTypeId: string | null; onSelect: (id: string) => void }) {
  const typeAccentColor = (id: string) => ({ 'term-report': 'var(--sky)', 'class-performance': 'var(--forest)', 'school-summary': 'var(--plum)', 'subject-performance': 'var(--gold)', 'teacher-activity': 'var(--terracotta)' } as any)[id] || 'var(--ink-2)';
  const typeAccentSoft = (id: string) => ({ 'term-report': 'var(--sky-soft)', 'class-performance': 'var(--forest-soft)', 'school-summary': 'var(--plum-soft)', 'subject-performance': 'var(--gold-soft)', 'teacher-activity': 'var(--terracotta-soft)' } as any)[id] || 'var(--paper-shade)';

  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>What kind of report?</h2>
      <p style={{ margin: '0 0 18px', fontSize: 12.5, color: 'var(--ink-3)' }}>Pick a template — configure it on the next step.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {reportTypes.map(rt => {
          const sel = selectedTypeId === rt.id;
          const accentColor = typeAccentColor(rt.id);
          const accentSoft = typeAccentSoft(rt.id);
          return (
            <button key={rt.id} onClick={() => onSelect(rt.id)}
              style={{ textAlign: 'left', background: sel ? accentSoft : 'var(--paper)', border: `2px solid ${sel ? accentColor : 'var(--rule)'}`, borderRadius: 7, padding: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 5, background: sel ? accentColor : 'var(--paper-shade)', color: sel ? '#fbf8f1' : accentColor, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={typeIconPath(rt.icon)} />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)' }}>{rt.name}</span>
                    {sel && <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accentColor, background: 'color-mix(in srgb, currentColor 15%, transparent)', padding: '1px 5px', borderRadius: 3 }}>Selected</span>}
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--ink-2)' }}>{rt.tagline}</p>
                  <p style={{ margin: '0 0 8px', fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{rt.description}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'var(--ink-3)' }}>
                    <span>⏱ {rt.avgTime}</span>
                    <span>·</span>
                    <span>{rt.pages}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Configure ─────────────────────────────────────────────────────────

function StepConfigure({ reportType, params, setParams, optionsCache, loadOption }: any) {
  const set = (id: string, v: any) => setParams((p: any) => ({ ...p, [id]: v }));

  const renderParam = (p: any) => {
    switch (p.kind) {
      case 'select':        return <ParamSelect key={p.id} label={p.label} options={p.options} value={params[p.id]} onChange={(v: any) => set(p.id, v)} required={p.required} />;
      case 'toggle':        return <ParamToggle key={p.id} label={p.label} value={params[p.id] ?? p.default ?? false} onChange={(v: any) => set(p.id, v)} />;
      case 'multi-class':   return <ParamMultiClass key={p.id} value={params[p.id] ?? []} onChange={(v: any) => set(p.id, v)} required={p.required} classes={optionsCache.classes} />;
      case 'class-picker':  return <ParamClassPicker key={p.id} value={params[p.id]} onChange={(v: any) => set(p.id, v)} required={p.required} classes={optionsCache.classes} />;
      case 'multi-subject': return <ParamMultiSubject key={p.id} value={params[p.id] ?? []} onChange={(v: any) => set(p.id, v)} required={p.required} subjects={optionsCache.subjects} />;
      case 'multi-form':    return <ParamMultiForm key={p.id} value={params[p.id] ?? p.default ?? []} onChange={(v: any) => set(p.id, v)} />;
      case 'multi-teacher': return <ParamMultiTeacher key={p.id} value={params[p.id] ?? p.default ?? 'all'} onChange={(v: any) => set(p.id, v)} teachers={optionsCache.teachers} />;
      case 'multi-select':  return <ParamMultiSelect key={p.id} label={p.label} options={p.options} value={params[p.id] ?? p.default ?? []} onChange={(v: any) => set(p.id, v)} />;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--paper-shade)', border: '1px solid var(--rule)', borderRadius: 6, marginBottom: 18 }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={typeIconPath(reportType.icon)} />
        </svg>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)' }}>{reportType.name}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 8 }}>{reportType.tagline}</span>
        </div>
      </div>
      <h2 style={{ margin: '0 0 4px', fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>Configure</h2>
      <p style={{ margin: '0 0 18px', fontSize: 12.5, color: 'var(--ink-3)' }}>Choose what to include in this report.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {reportType.params.map((p: any) => renderParam(p))}
      </div>
    </div>
  );
}

// ── Step 4: Export ────────────────────────────────────────────────────────────

function StepExport({ reportType, params, scheduling, setScheduling, activeJob, onGenerate }: any) {
  const [delivery, setDelivery] = useState('download');
  const [recipients, setRecipients] = useState('');

  const CADENCE_CRON: Record<string, string> = {
    'Daily':             '0 7 * * *',
    'Weekly (Monday)':   '0 7 * * 1',
    'Bi-weekly':         '0 7 */14 * *',
    'Monthly (1st)':     '0 7 1 * *',
    'Termly (last Fri)': '0 7 * * 5',
  };

  const handleGenerate = () => {
    const schedPayload = scheduling.enabled ? {
      cadence: scheduling.cadence,
      cronExpression: CADENCE_CRON[scheduling.cadence] || '0 7 * * 1',
      delivery: delivery === 'email' ? recipients : delivery,
      recipients: delivery === 'email' ? recipients.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    } : undefined;
    onGenerate(schedPayload);
  };

  if (activeJob) {
    return (
      <div>
        <h2 style={{ margin: '0 0 16px', fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>
          {activeJob.status === 'ready' ? 'Report ready' : activeJob.status === 'failed' ? 'Generation failed' : 'Generating…'}
        </h2>
        {activeJob.status === 'failed' ? (
          <div style={{ padding: '12px 16px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 6, color: 'var(--terracotta)', fontSize: 13 }}>
            {activeJob.errorMessage || 'Generation failed. Please try again.'}
          </div>
        ) : activeJob.status === 'ready' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--forest-soft)', display: 'grid', placeItems: 'center' }}>
              <Ico d={ICONS.check} size={22} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--forest)', marginBottom: 4 }}>Report generated successfully</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Your report is ready to download.</div>
            </div>
            <a href={reportAdminService.getDownloadUrl(activeJob.reportId)} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--forest)', color: '#fbf8f1', borderRadius: 5, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              <Ico d={ICONS.download} size={13} /> Download report
            </a>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-2)' }}>
              <span>{activeJob.currentStep || 'Processing…'}</span>
              <span style={{ fontFeatureSettings: "'tnum' 1" }}>{Math.round((activeJob.progress || 0) * 100)}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--paper-shade)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(activeJob.progress || 0) * 100}%`, background: 'var(--forest)', borderRadius: 999, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 4px', fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>Export &amp; deliver</h2>
      <p style={{ margin: '0 0 18px', fontSize: 12.5, color: 'var(--ink-3)' }}>Choose how this report should be packaged and shared.</p>

      {/* Delivery options */}
      <div style={{ marginBottom: 18 }}>
        <FieldLabel label="Delivery" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { id: 'download', label: 'Download to my computer',  icon: ICONS.download },
            { id: 'email',    label: 'Email to recipients',       icon: 'M1 3h14l-7 7L1 3zM1 3v10h14V3' },
            { id: 'link',     label: 'Generate shareable link',   icon: 'M6 8a3 3 0 014 0l2-2a3 3 0 00-4.24-4.24L5.63 4M10 8a3 3 0 01-4 0L4 10a3 3 0 004.24 4.24L10.37 12' },
          ].map(d => (
            <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1px solid ${delivery === d.id ? 'color-mix(in srgb, var(--forest) 40%, transparent)' : 'var(--rule)'}`, borderRadius: 5, background: delivery === d.id ? 'var(--forest-soft)' : 'var(--paper)', cursor: 'pointer' }}>
              <input type="radio" name="delivery" value={d.id} checked={delivery === d.id} onChange={() => setDelivery(d.id)} style={{ accentColor: 'var(--forest)' }} />
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={delivery === d.id ? 'var(--forest)' : 'var(--ink-3)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d.icon}/></svg>
              <span style={{ fontSize: 12.5, color: delivery === d.id ? 'var(--forest)' : 'var(--ink-2)', fontWeight: delivery === d.id ? 600 : 400 }}>{d.label}</span>
            </label>
          ))}
        </div>
        {delivery === 'email' && (
          <div style={{ marginTop: 8 }}>
            <InputBase placeholder="recipients@email.com, another@email.com" value={recipients} onChange={e => setRecipients(e.target.value)} />
          </div>
        )}
      </div>

      {/* Schedule toggle */}
      <div style={{ background: 'var(--gold-soft)', border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)', borderRadius: 6, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Ico d={ICONS.refresh} size={15} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>Run on a schedule?</span>
              <ParamToggle label="" value={scheduling.enabled} onChange={(v: boolean) => setScheduling((s: any) => ({ ...s, enabled: v }))} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--ink-2)' }}>Auto-generate this report on a recurring basis.</p>
            {scheduling.enabled && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <FieldLabel label="Cadence" />
                  <SelectBase value={scheduling.cadence || ''} onChange={e => setScheduling((s: any) => ({ ...s, cadence: e.target.value }))}>
                    <option value="">Choose…</option>
                    {Object.keys(CADENCE_CRON).map(c => <option key={c} value={c}>{c}</option>)}
                  </SelectBase>
                </div>
                <div>
                  <FieldLabel label="Time of day" />
                  <SelectBase value={scheduling.time || ''} onChange={e => setScheduling((s: any) => ({ ...s, time: e.target.value }))}>
                    {['07:00 (school open)','12:00 (midday)','17:00 (end of day)','23:00 (overnight)'].map(t => <option key={t} value={t}>{t}</option>)}
                  </SelectBase>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 0 }} /> {/* spacer handled by footer nav */}
    </div>
  );
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

function GenerateView({ reportTypes, optionsCache, loadOption }: {
  reportTypes: ReportType[];
  optionsCache: Record<string, any[]>;
  loadOption: (type: string) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [scheduling, setScheduling] = useState({ enabled: false, cadence: '', time: '07:00 (school open)' });
  const [activeJob, setActiveJob] = useState<ReportJob | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reportType = reportTypes.find(rt => rt.id === selectedTypeId) ?? null;

  const canStep2 = !!reportType;
  const canStep3 = canStep2 && (reportType!.params || []).filter(p => p.required).every(p => {
    const v = params[p.id];
    return v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true);
  });

  // Lazy-load option lists when entering step 2
  useEffect(() => {
    if (step === 2 && reportType) {
      for (const p of reportType.params) {
        if (p.kind === 'multi-class' || p.kind === 'class-picker') loadOption('classes');
        if (p.kind === 'multi-subject') loadOption('subjects');
        if (p.kind === 'multi-teacher') loadOption('teachers');
      }
    }
  }, [step, reportType]);

  const handleGenerate = async (schedPayload?: any) => {
    if (!reportType) return;
    setGenError(null);
    try {
      const resp = await reportAdminService.generate({
        typeId: reportType.id,
        params,
        schedule: schedPayload,
      });
      setActiveJob({ jobId: resp.jobId, reportId: resp.reportId, status: 'queued', progress: 0, currentStep: 'Queued' });
      // Poll every 4 seconds
      pollRef.current = setInterval(async () => {
        try {
          const job = await reportAdminService.pollJob(resp.jobId);
          setActiveJob(job);
          if (job.status === 'ready' || job.status === 'failed') {
            clearInterval(pollRef.current!);
            if (job.status === 'ready') {
              toast({ title: 'Report ready', description: 'Your report has been generated.' });
              setTimeout(() => { setStep(1); setSelectedTypeId(null); setParams({}); setActiveJob(null); }, 5000);
            }
          }
        } catch {
          // ignore poll errors
        }
      }, 4000);
    } catch (err: any) {
      setGenError(err.message ?? 'Failed to generate report');
    }
  };

  // Cleanup on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startOver = () => { setStep(1); setSelectedTypeId(null); setParams({}); setActiveJob(null); setGenError(null); if (pollRef.current) clearInterval(pollRef.current); };

  const STEPS = [
    { n: 1, label: 'Pick',      sub: 'Report type' },
    { n: 2, label: 'Configure', sub: 'Parameters' },
    { n: 3, label: 'Preview',   sub: 'Sample render' },
    { n: 4, label: 'Export',    sub: 'Deliver / schedule' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
      {/* Stepper sidebar */}
      <div>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: 14, position: 'sticky', top: 76 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 10 }}>Steps</div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {STEPS.map(s => {
              const active = step === s.n;
              const done = step > s.n;
              const reachable = s.n === 1 || (s.n === 2 && canStep2) || (s.n >= 3 && canStep3);
              return (
                <li key={s.n}>
                  <button onClick={() => reachable && setStep(s.n)} disabled={!reachable}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', border: 0, borderRadius: 5, cursor: reachable ? 'pointer' : 'not-allowed', background: active ? 'var(--paper-shade)' : 'transparent', fontFamily: 'inherit', opacity: reachable ? 1 : 0.45, textAlign: 'left' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: done ? 'var(--forest)' : active ? 'var(--forest)' : 'var(--paper-shade)', color: (done || active) ? '#fbf8f1' : 'var(--ink-3)' }}>
                      {done ? <Ico d={ICONS.check} size={10} /> : s.n}
                    </span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? 'var(--ink-1)' : 'var(--ink-2)' }}>{s.label}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{s.sub}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
          {reportType && step > 1 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--rule-soft)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 4 }}>Selected</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-1)' }}>{reportType.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{reportType.tagline}</div>
            </div>
          )}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: 24 }}>
        {genError && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 5, fontSize: 12.5, color: 'var(--terracotta)' }}>
            {genError}
          </div>
        )}

        {step === 1 && <StepPick reportTypes={reportTypes} selectedTypeId={selectedTypeId} onSelect={setSelectedTypeId} />}
        {step === 2 && reportType && <StepConfigure reportType={reportType} params={params} setParams={setParams} optionsCache={optionsCache} loadOption={loadOption} />}
        {step === 3 && reportType && <StepPreview reportType={reportType} params={params} />}
        {step === 4 && reportType && (
          <StepExport reportType={reportType} params={params} scheduling={scheduling} setScheduling={setScheduling} activeJob={activeJob} onGenerate={handleGenerate} />
        )}

        {/* Footer nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--rule-soft)' }}>
          <button onClick={() => step === 1 ? startOver() : setStep(s => Math.max(1, s - 1))}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'inherit' }}>
            <Ico d={ICONS.chevronLeft} size={13} /> {step === 1 ? 'Start over' : 'Back'}
          </button>
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFeatureSettings: "'tnum' 1" }}>Step {step} of 4</span>
          {step < 4 ? (
            <button onClick={() => setStep(s => Math.min(4, s + 1))}
              disabled={(step === 1 && !canStep2) || (step === 2 && !canStep3)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: (step === 1 && !canStep2) || (step === 2 && !canStep3) ? 'not-allowed' : 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', opacity: (step === 1 && !canStep2) || (step === 2 && !canStep3) ? 0.45 : 1 }}>
              Continue <Ico d={ICONS.chevronRight} size={13} />
            </button>
          ) : !activeJob ? (
            <button onClick={() => handleGenerate()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
              <Ico d={ICONS.sparkles} size={13} />
              {scheduling.enabled ? 'Schedule report' : 'Generate now'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Recent reports tab ────────────────────────────────────────────────────────

function RecentReportsTab({ reports, loading, error, onDelete, downloadUrl }: any) {
  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading reports…</div>;
  if (error) return <div style={{ padding: '12px 16px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 6, color: 'var(--terracotta)', fontSize: 13 }}>{error}</div>;

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 14.5, fontWeight: 700, color: 'var(--ink-1)' }}>Recently generated</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--ink-3)' }}>Reports stored for 90 days</p>
        </div>
      </div>
      {reports.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No reports yet. Generate your first report from the Generate tab.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--paper-shade)', borderBottom: '1px solid var(--rule)' }}>
              {['Report', 'Type', 'Generated', 'By', 'Pages', 'Size', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: h === 'Pages' || h === 'Size' || h === '' ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((r: ReportRecord) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--rule-soft)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-shade)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)' }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'monospace' }}>{r.id}</div>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink-2)' }}>{(r.typeId ?? '').replace(/-/g, ' ')}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{fmtDate(r.generatedAt)}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{fmtTime(r.generatedAt)}</div>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink-2)' }}>{r.generatedBy || '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink-2)', textAlign: 'right', fontFeatureSettings: "'tnum' 1" }}>{r.pages ?? '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink-2)', textAlign: 'right', fontFeatureSettings: "'tnum' 1" }}>{fmtSize(r.sizeBytes)}</td>
                <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                    {r.status === 'ready' && (
                      <a href={downloadUrl(r.id)} target="_blank" rel="noreferrer"
                        style={{ padding: 5, display: 'grid', placeItems: 'center', borderRadius: 4, color: 'var(--ink-2)', background: 'transparent', border: 0, cursor: 'pointer', textDecoration: 'none' }}
                        title="Download">
                        <Ico d={ICONS.download} size={13} />
                      </a>
                    )}
                    <button onClick={() => onDelete(r.id)} title="Delete"
                      style={{ padding: 5, display: 'grid', placeItems: 'center', borderRadius: 4, color: 'var(--ink-3)', background: 'transparent', border: 0, cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--terracotta)'; (e.currentTarget as HTMLElement).style.background = 'var(--terracotta-soft)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <Ico d={ICONS.trash} size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Scheduled tab ─────────────────────────────────────────────────────────────

function ScheduledTab({ schedules, loading, error, onToggle, onRunNow, onDelete }: any) {
  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading schedules…</div>;
  if (error) return <div style={{ padding: '12px 16px', background: 'var(--terracotta-soft)', border: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', borderRadius: 6, color: 'var(--terracotta)', fontSize: 13 }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Info banner */}
      <div style={{ background: 'var(--sky-soft)', border: '1px solid color-mix(in srgb, var(--sky) 25%, transparent)', borderRadius: 7, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Ico d={ICONS.refresh} size={15} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>Automated reports keep stakeholders informed</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>Scheduled reports generate and deliver automatically. Pause any schedule to stop future runs.</div>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '32px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          No schedules yet. Create one via the Generate wizard (Step 4).
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {schedules.map((s: ReportSchedule) => (
            <div key={s.id} style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '14px 16px', opacity: s.enabled ? 1 : 0.65 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 5, background: 'var(--paper-shade)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="var(--ink-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={typeIconPath(s.typeId)} />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)' }}>{s.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1px 6px', borderRadius: 3, border: '1px solid', ...(s.enabled ? { color: 'var(--forest)', background: 'var(--forest-soft)', borderColor: 'color-mix(in srgb, var(--forest) 25%, transparent)' } : { color: 'var(--ink-3)', background: 'var(--paper-shade)', borderColor: 'var(--rule)' }) }}>
                      {s.enabled ? 'Active' : 'Paused'}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>· {(s.typeId ?? '').replace(/-/g, ' ')}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 2 }}>Cadence</div>
                      <div style={{ color: 'var(--ink-2)' }}>{s.cadence}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 2 }}>Next run</div>
                      <div style={{ color: 'var(--ink-2)' }}>{fmtDate(s.nextRunAt)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 2 }}>Delivery</div>
                      <div style={{ color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.delivery || s.recipients?.join(', ') || '—'}</div>
                    </div>
                  </div>
                  {s.lastRunAt && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-3)' }}>Last ran {fmtDate(s.lastRunAt)}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                  <button onClick={() => onToggle(s.id, !s.enabled)} title={s.enabled ? 'Pause' : 'Resume'}
                    style={{ padding: 5, display: 'grid', placeItems: 'center', borderRadius: 4, color: 'var(--ink-2)', background: 'transparent', border: 0, cursor: 'pointer' }}>
                    {s.enabled
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      : <Ico d={ICONS.play} size={13} />}
                  </button>
                  <button onClick={() => onRunNow(s.id)} title="Run now"
                    style={{ padding: 5, display: 'grid', placeItems: 'center', borderRadius: 4, color: 'var(--ink-2)', background: 'transparent', border: 0, cursor: 'pointer' }}>
                    <Ico d={ICONS.refresh} size={13} />
                  </button>
                  <button onClick={() => onDelete(s.id)} title="Delete"
                    style={{ padding: 5, display: 'grid', placeItems: 'center', borderRadius: 4, color: 'var(--ink-3)', background: 'transparent', border: 0, cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--terracotta)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-3)'; }}>
                    <Ico d={ICONS.trash} size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page header (tabs) ────────────────────────────────────────────────────────

function PageHeader({ view, setView, recentCount, schedCount }: any) {
  const tabs = [
    { id: 'generate',  label: 'Generate a report', badge: null },
    { id: 'recent',    label: 'Recent reports',     badge: recentCount },
    { id: 'scheduled', label: 'Scheduled',          badge: schedCount },
  ];
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ margin: '0 0 4px', fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>Reports</h1>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-3)' }}>Generate, schedule, and share reports across the school.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid var(--rule)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 0, borderBottom: `2px solid ${view === t.id ? 'var(--forest)' : 'transparent'}`, marginBottom: -1, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: view === t.id ? 'var(--forest)' : 'var(--ink-3)', transition: 'color 0.1s' }}>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, fontFeatureSettings: "'tnum' 1", background: view === t.id ? 'var(--forest-soft)' : 'var(--paper-shade)', color: view === t.id ? 'var(--forest)' : 'var(--ink-3)' }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────

const SchoolReportsPage: React.FC = () => {
  const { toast } = useToast();
  const [view, setView] = useState<'generate' | 'recent' | 'scheduled'>('generate');

  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const [recentReports, setRecentReports] = useState<ReportRecord[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedError, setSchedError] = useState<string | null>(null);

  const [optionsCache, setOptionsCache] = useState<Record<string, any[]>>({});

  const loadOption = (type: string) => {
    if (optionsCache[type]) return;
    reportAdminService.getOptions(type as any)
      .then(data => setOptionsCache(c => ({ ...c, [type]: data })))
      .catch(() => {});
  };

  useEffect(() => {
    reportAdminService.getReportTypes()
      .then(setReportTypes)
      .catch(() => {})
      .finally(() => setTypesLoading(false));
  }, []);

  useEffect(() => {
    if (view === 'recent') {
      setRecentLoading(true); setRecentError(null);
      reportAdminService.listReports()
        .then(setRecentReports)
        .catch((err: Error) => setRecentError(err.message))
        .finally(() => setRecentLoading(false));
    }
  }, [view]);

  useEffect(() => {
    if (view === 'scheduled') {
      setSchedLoading(true); setSchedError(null);
      reportAdminService.listSchedules()
        .then(setSchedules)
        .catch((err: Error) => setSchedError(err.message))
        .finally(() => setSchedLoading(false));
    }
  }, [view]);

  const handleDeleteReport = async (id: string) => {
    try {
      await reportAdminService.deleteReport(id);
      setRecentReports(r => r.filter(x => x.id !== id));
      toast({ title: 'Report deleted' });
    } catch (err: any) {
      toast({ title: 'Failed to delete', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      const updated = await reportAdminService.updateSchedule(id, { enabled });
      setSchedules(s => s.map(x => x.id === id ? { ...x, ...updated } : x));
      toast({ title: enabled ? 'Schedule resumed' : 'Schedule paused' });
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      await reportAdminService.runScheduleNow(id);
      toast({ title: 'Running now', description: 'Report queued. Check Recent reports in a moment.' });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await reportAdminService.deleteSchedule(id);
      setSchedules(s => s.filter(x => x.id !== id));
      toast({ title: 'Schedule deleted' });
    } catch (err: any) {
      toast({ title: 'Failed to delete', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <PageHeader
        view={view} setView={setView}
        recentCount={recentReports.length}
        schedCount={schedules.length}
      />

      {view === 'generate' && (
        typesLoading
          ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading report types…</div>
          : <GenerateView reportTypes={reportTypes} optionsCache={optionsCache} loadOption={loadOption} />
      )}
      {view === 'recent' && (
        <RecentReportsTab
          reports={recentReports}
          loading={recentLoading}
          error={recentError}
          onDelete={handleDeleteReport}
          downloadUrl={reportAdminService.getDownloadUrl}
        />
      )}
      {view === 'scheduled' && (
        <ScheduledTab
          schedules={schedules}
          loading={schedLoading}
          error={schedError}
          onToggle={handleToggleSchedule}
          onRunNow={handleRunNow}
          onDelete={handleDeleteSchedule}
        />
      )}
    </div>
  );
};

export default SchoolReportsPage;
