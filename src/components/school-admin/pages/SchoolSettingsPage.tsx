import React, { useEffect, useState, CSSProperties } from 'react';
import { adminService } from '../../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface StudentIdConfig {
  prefix: string;
  numberLength: number;
  startLetter: string;
}

interface SchoolData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  type: string;
  established: string;
  motto: string;
  primaryContact: { name: string; email: string; phone: string };
  termSettings: { currentTerm: string; termWeek: number; termTotalWeeks: number };
  studentIdConfig?: StudentIdConfig;
}

// ── Tiny icon helper ──────────────────────────────────────────────────────────
function Icon({ d, size = 14, style }: { d: string; size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}
const D = {
  edit:     'M11 2l3 3-8 8H3v-3L11 2z',
  check:    'M2 8l4 4 8-8',
  x:        'M3 3l10 10M13 3L3 13',
  link:     'M7 4H4a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V9M10 2h4v4M14 2L7 9',
  refresh:  'M1 8a7 7 0 001 3.7M15 8a7 7 0 00-1-3.7M2.3 4A7 7 0 0113.7 12',
  alert:    'M8 1l7 14H1L8 1zM8 6v4M8 11.5v.5',
};

// ── Field display ─────────────────────────────────────────────────────────────
function FieldView({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: value ? 'var(--ink-1)' : 'var(--ink-3)', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Not set'}
      </div>
    </div>
  );
}

// ── Field edit ────────────────────────────────────────────────────────────────
function FieldEdit({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '7px 10px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }}
      />
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, padding: '22px 24px', ...style }}>
      {children}
    </div>
  );
}

// ── Integration row ───────────────────────────────────────────────────────────
function IntegrationRow({ name, sub, status }: { name: string; sub: string; status: 'connected' | 'pending' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--paper-shade)', border: '1px solid var(--rule-soft)', borderRadius: 5 }}>
      <div style={{ width: 32, height: 32, borderRadius: 5, background: 'var(--paper)', border: '1px solid var(--rule)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon d={D.link} size={13} style={{ color: 'var(--ink-3)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{sub}</div>
      </div>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
        background: status === 'connected' ? 'var(--forest-soft)' : 'var(--gold-soft)',
        color: status === 'connected' ? 'var(--forest)' : 'var(--gold-deep)',
      }}>
        <span style={{ width: 5, height: 5, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />
        {status === 'connected' ? 'Connected' : 'Action needed'}
      </span>
      <button style={{ padding: '5px 12px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
        Manage
      </button>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function deriveDefaultPrefix(schoolName: string): string {
  const words = (schoolName || '').trim().split(/\s+/).filter(w => /[A-Za-z]/.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'K';
  return 'K';
}

// ── Student ID preview ────────────────────────────────────────────────────────
function StudentIdPreview({ prefix, numberLength, startLetter }: { prefix: string; numberLength: number; startLetter: string }) {
  const p = (prefix || 'K').toUpperCase().slice(0, 2);
  const n = Math.max(1, Math.min(8, numberLength || 4));
  const sl = (startLetter || 'A').toUpperCase().charAt(0);
  const maxNum = Math.pow(10, n) - 1;
  const nextLetter = String.fromCharCode(sl.charCodeAt(0) + 1);
  const first = `${p}${'0'.repeat(n - 1)}1${sl}`;
  const rollover = `${p}${String(maxNum).padStart(n, '9')}${sl} → ${p}${'0'.repeat(n - 1)}1${nextLetter}`;
  return (
    <div style={{ background: 'var(--paper-shade)', border: '1px solid var(--rule-soft)', borderRadius: 6, padding: '12px 16px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>First student</div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: 'var(--forest)', letterSpacing: '.04em' }}>{first}</span>
      </div>
      <div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Letter rollover</div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--ink-2)', letterSpacing: '.03em' }}>{rollover}</span>
      </div>
      <div>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Capacity per letter</div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--ink-2)' }}>{maxNum.toLocaleString()} students</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const SchoolSettingsPage: React.FC = () => {
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedSection, setSavedSection] = useState('');

  // edit state per section
  const [editProfile, setEditProfile] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [editTerm, setEditTerm] = useState(false);
  const [editStudentId, setEditStudentId] = useState(false);

  // draft buffers
  const [profileDraft, setProfileDraft] = useState<Partial<SchoolData>>({});
  const [contactDraft, setContactDraft] = useState<SchoolData['primaryContact']>({ name: '', email: '', phone: '' });
  const [termDraft, setTermDraft] = useState<SchoolData['termSettings']>({ currentTerm: '', termWeek: 1, termTotalWeeks: 13 });
  const [studentIdDraft, setStudentIdDraft] = useState<StudentIdConfig>({ prefix: 'K', numberLength: 4, startLetter: 'A' });

  useEffect(() => {
    adminService.getSchoolSettings().then((d: any) => {
      setSchool(d.school);
      if (d.school) {
        setProfileDraft({
          name: d.school.name,
          email: d.school.email,
          phone: d.school.phone,
          address: d.school.address,
          registrationNumber: d.school.registrationNumber,
          type: d.school.type,
          established: d.school.established,
          motto: d.school.motto,
        });
        setContactDraft(d.school.primaryContact || { name: '', email: '', phone: '' });
        setTermDraft(d.school.termSettings || { currentTerm: '', termWeek: 1, termTotalWeeks: 13 });
        const sid = d.school.studentIdConfig || {};
        setStudentIdDraft({
          prefix: sid.prefix || deriveDefaultPrefix(d.school.name),
          numberLength: sid.numberLength ?? 4,
          startLetter: sid.startLetter || 'A',
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const save = async (section: string, payload: Record<string, unknown>) => {
    setSaving(true);
    setSaveError('');
    try {
      const updated = await adminService.updateSchoolSettings(payload);
      setSchool(updated.school);
      setSavedSection(section);
      setTimeout(() => setSavedSection(''), 2500);
      if (section === 'profile') setEditProfile(false);
      if (section === 'contact') setEditContact(false);
      if (section === 'term') setEditTerm(false);
      if (section === 'studentId') {
        setEditStudentId(false);
        const sid = updated.school?.studentIdConfig || {};
        setStudentIdDraft({
          prefix: sid.prefix || deriveDefaultPrefix(updated.school?.name || ''),
          numberLength: sid.numberLength ?? 4,
          startLetter: sid.startLetter || 'A',
        });
      }
    } catch {
      setSaveError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--ink-3)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  if (!school) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>School profile, integrations, and platform preferences</p>
        </div>
        <Card>
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
            <Icon d={D.alert} size={28} style={{ display: 'block', margin: '0 auto 12px' }} />
            No school is linked to this account. Contact your Kundai administrator.
          </div>
        </Card>
      </div>
    );
  }

  const sectionSaved = (key: string) => savedSection === key;

  const EditBar = ({ section, isEditing, onEdit, onSave, onCancel }: { section: string; isEditing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void }) => (
    <div style={{ display: 'flex', gap: 8 }}>
      {sectionSaved(section) && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
          <Icon d={D.check} size={12} /> Saved
        </span>
      )}
      {isEditing ? (
        <>
          <button onClick={onCancel} disabled={saving} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Icon d={D.check} size={12} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      ) : (
        <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Icon d={D.edit} size={12} /> Edit
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>School Admin</div>
        <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>School profile, integrations, and platform preferences</p>
      </div>

      {saveError && (
        <div style={{ padding: '10px 16px', background: 'var(--terracotta-soft)', border: '1px solid var(--terracotta)', borderRadius: 6, fontSize: 13, color: 'var(--terracotta)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon d={D.alert} size={14} /> {saveError}
        </div>
      )}

      {/* ── School Profile ──────────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>School profile</div>
            <h2 style={{ margin: '4px 0 0', fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.015em' }}>{school.name}</h2>
            {school.motto && <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--ink-3)', fontStyle: 'italic' }}>{school.motto}</p>}
          </div>
          <EditBar
            section="profile"
            isEditing={editProfile}
            onEdit={() => setEditProfile(true)}
            onSave={() => save('profile', profileDraft)}
            onCancel={() => { setEditProfile(false); setProfileDraft({ name: school.name, email: school.email, phone: school.phone, address: school.address, registrationNumber: school.registrationNumber, type: school.type, established: school.established, motto: school.motto }); }}
          />
        </div>

        {editProfile ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <FieldEdit label="School name" value={profileDraft.name ?? ''} onChange={v => setProfileDraft(p => ({ ...p, name: v }))} />
            <FieldEdit label="Type" value={profileDraft.type ?? ''} onChange={v => setProfileDraft(p => ({ ...p, type: v }))} />
            <FieldEdit label="Established (year)" value={profileDraft.established ?? ''} onChange={v => setProfileDraft(p => ({ ...p, established: v }))} />
            <FieldEdit label="Registration number" value={profileDraft.registrationNumber ?? ''} onChange={v => setProfileDraft(p => ({ ...p, registrationNumber: v }))} />
            <FieldEdit label="Address" value={profileDraft.address ?? ''} onChange={v => setProfileDraft(p => ({ ...p, address: v }))} />
            <FieldEdit label="Phone" value={profileDraft.phone ?? ''} onChange={v => setProfileDraft(p => ({ ...p, phone: v }))} />
            <FieldEdit label="Email" value={profileDraft.email ?? ''} onChange={v => setProfileDraft(p => ({ ...p, email: v }))} type="email" />
            <FieldEdit label="Motto / tagline" value={profileDraft.motto ?? ''} onChange={v => setProfileDraft(p => ({ ...p, motto: v }))} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <FieldView label="School name"        value={school.name} />
            <FieldView label="Type"               value={school.type} />
            <FieldView label="Established"        value={school.established} />
            <FieldView label="Registration no."   value={school.registrationNumber} />
            <FieldView label="Address"            value={school.address} />
            <FieldView label="Phone"              value={school.phone} />
            <FieldView label="Email"              value={school.email} />
            <FieldView label="Motto / tagline"    value={school.motto} />
          </div>
        )}
      </Card>

      {/* ── Primary Contact ─────────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Primary contact</div>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>The person Kundai contacts for billing and platform issues</p>
          </div>
          <EditBar
            section="contact"
            isEditing={editContact}
            onEdit={() => setEditContact(true)}
            onSave={() => save('contact', { primaryContact: contactDraft })}
            onCancel={() => { setEditContact(false); setContactDraft(school.primaryContact || { name: '', email: '', phone: '' }); }}
          />
        </div>

        {editContact ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <FieldEdit label="Contact name" value={contactDraft.name} onChange={v => setContactDraft(p => ({ ...p, name: v }))} />
            <FieldEdit label="Contact email" value={contactDraft.email} onChange={v => setContactDraft(p => ({ ...p, email: v }))} type="email" />
            <FieldEdit label="Contact phone" value={contactDraft.phone} onChange={v => setContactDraft(p => ({ ...p, phone: v }))} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <FieldView label="Contact name"  value={school.primaryContact?.name} />
            <FieldView label="Contact email" value={school.primaryContact?.email} />
            <FieldView label="Contact phone" value={school.primaryContact?.phone} />
          </div>
        )}
      </Card>

      {/* ── Term & Academic Year ────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Term & academic year</div>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>Used across dashboards and reporting to scope term-level data</p>
          </div>
          <EditBar
            section="term"
            isEditing={editTerm}
            onEdit={() => setEditTerm(true)}
            onSave={() => save('term', { termSettings: termDraft })}
            onCancel={() => { setEditTerm(false); setTermDraft(school.termSettings || { currentTerm: '', termWeek: 1, termTotalWeeks: 13 }); }}
          />
        </div>

        {editTerm ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <FieldEdit label="Current term (e.g. Term 2 2025)" value={termDraft.currentTerm} onChange={v => setTermDraft(p => ({ ...p, currentTerm: v }))} />
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Current week</label>
              <input type="number" min={1} max={termDraft.termTotalWeeks} value={termDraft.termWeek} onChange={e => setTermDraft(p => ({ ...p, termWeek: Number(e.target.value) }))}
                style={{ width: '100%', padding: '7px 10px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Total weeks in term</label>
              <input type="number" min={1} max={20} value={termDraft.termTotalWeeks} onChange={e => setTermDraft(p => ({ ...p, termTotalWeeks: Number(e.target.value) }))}
                style={{ width: '100%', padding: '7px 10px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <FieldView label="Current term"       value={school.termSettings?.currentTerm} />
            <FieldView label="Term progress"      value={school.termSettings ? `Week ${school.termSettings.termWeek} of ${school.termSettings.termTotalWeeks}` : undefined} />
            <FieldView label="Forms supported"    value="Form 1 – Form 6 (O-Level + A-Level)" />
          </div>
        )}

        {/* Week progress bar */}
        {!editTerm && school.termSettings?.termTotalWeeks > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--rule-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>
              <span>Week {school.termSettings.termWeek}</span>
              <span>{Math.round(school.termSettings.termWeek / school.termSettings.termTotalWeeks * 100)}% complete</span>
              <span>Week {school.termSettings.termTotalWeeks}</span>
            </div>
            <div style={{ height: 6, background: 'var(--paper-shade)', border: '1px solid var(--rule-soft)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, school.termSettings.termWeek / school.termSettings.termTotalWeeks * 100)}%`, background: 'var(--forest)', borderRadius: 999, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </Card>

      {/* ── Student ID Format ───────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Student ID format</div>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>
              Auto-generated IDs assigned to new students. Changing the prefix starts a fresh sequence; existing IDs are not affected.
            </p>
          </div>
          <EditBar
            section="studentId"
            isEditing={editStudentId}
            onEdit={() => setEditStudentId(true)}
            onSave={() => save('studentId', { studentIdConfig: studentIdDraft })}
            onCancel={() => { setEditStudentId(false); setStudentIdDraft({ prefix: school.studentIdConfig?.prefix || deriveDefaultPrefix(school.name), numberLength: school.studentIdConfig?.numberLength ?? 4, startLetter: school.studentIdConfig?.startLetter || 'A' }); }}
          />
        </div>

        {editStudentId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Prefix (1–2 letters)</label>
                <input
                  value={studentIdDraft.prefix}
                  maxLength={2}
                  onChange={e => setStudentIdDraft(p => ({ ...p, prefix: e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase() }))}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Number of digits (1–8)</label>
                <input
                  type="number" min={1} max={8}
                  value={studentIdDraft.numberLength}
                  onChange={e => setStudentIdDraft(p => ({ ...p, numberLength: Math.max(1, Math.min(8, Number(e.target.value) || 1)) }))}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, marginBottom: 4 }}>Starting letter</label>
                <select
                  value={studentIdDraft.startLetter}
                  onChange={e => setStudentIdDraft(p => ({ ...p, startLetter: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 5, color: 'var(--ink-1)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                >
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <StudentIdPreview prefix={studentIdDraft.prefix} numberLength={studentIdDraft.numberLength} startLetter={studentIdDraft.startLetter} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <FieldView label="Prefix"          value={school.studentIdConfig?.prefix || deriveDefaultPrefix(school.name)} />
              <FieldView label="Digit count"     value={String(school.studentIdConfig?.numberLength ?? 4)} />
              <FieldView label="Starting letter" value={school.studentIdConfig?.startLetter || 'A'} />
            </div>
            <StudentIdPreview
              prefix={school.studentIdConfig?.prefix || deriveDefaultPrefix(school.name)}
              numberLength={school.studentIdConfig?.numberLength ?? 4}
              startLetter={school.studentIdConfig?.startLetter || 'A'}
            />
          </div>
        )}
      </Card>

      {/* ── Integrations ────────────────────────────────────────────────────── */}
      <Card>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Integrations</div>
          <h3 style={{ margin: '4px 0 0', fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 700, color: 'var(--ink-1)' }}>Connected systems and data sources</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <IntegrationRow name="EcoCash + ZIPIT for fees" sub="Bursar account · last sync 2h ago" status="connected" />
          <IntegrationRow name="Microsoft 365 — staff email" sub="Connected to school domain · staff mailboxes active" status="connected" />
          <IntegrationRow name="WhatsApp Business — parent broadcasts" sub="Verified parent numbers synced" status="connected" />
          <IntegrationRow name="Government MoPSE reporting" sub="Term report submission pending" status="pending" />
        </div>
      </Card>

    </div>
  );
};

export default SchoolSettingsPage;
