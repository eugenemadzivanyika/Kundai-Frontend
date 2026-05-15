import React from 'react';
import { TeacherUser } from '../types/schoolAdmin';

interface Props {
  open: boolean;
  teacher: TeacherUser | null;
  onClose: () => void;
  onEdit: (teacher: TeacherUser) => void;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink-1)' }}>{value}</span>
    </div>
  );
}

const TeacherDetailView: React.FC<Props> = ({ open, teacher, onClose, onEdit }) => {
  if (!open || !teacher) return null;

  const tp = teacher.teacherProfile;
  const name = `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim();
  const TONES = ['forest', 'plum', 'sky', 'gold', 'terracotta'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const tone = TONES[h % TONES.length];
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, zIndex: 50,
        background: 'var(--paper)', borderLeft: '1px solid var(--rule)',
        display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `var(--${tone}-soft)`, color: `var(--${tone})`, display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>{name}</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>{tp?.position || 'Teacher'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => onEdit(teacher)}
              style={{ padding: '6px 14px', background: 'var(--forest-soft)', border: '1px solid color-mix(in srgb, var(--forest) 25%, transparent)', borderRadius: 5, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--forest)', fontFamily: 'inherit' }}>
              Edit
            </button>
            <button onClick={onClose} style={{ padding: 6, background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', color: 'var(--ink-2)', lineHeight: 0 }}>
              <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14" /></svg>
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Contact */}
          <section>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>Contact</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InfoRow label="Email" value={teacher.email} />
              <InfoRow label="Phone" value={teacher.phoneNumber} />
              <InfoRow label="Gender" value={tp?.gender} />
            </div>
          </section>

          {/* Professional */}
          {tp && (
            <section>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>Professional</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InfoRow label="Staff number" value={tp.staffNumber} />
                <InfoRow label="Position" value={tp.position} />
                <InfoRow label="Department" value={tp.department} />
                <InfoRow label="Years of experience" value={tp.yearsOfExperience ? `${tp.yearsOfExperience} years` : undefined} />
                <InfoRow label="Qualifications" value={tp.qualifications} />
                <InfoRow label="Teaching certificate" value={tp.teachingCertificate} />
              </div>
            </section>
          )}

          {/* Class teacher of */}
          {tp?.classTeacherOf && (
            <section>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>Homeroom class</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--forest-soft)', border: '1px solid color-mix(in srgb, var(--forest) 20%, transparent)', borderRadius: 5 }}>
                <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--forest)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1" /><path d="M8 3V1M5 7h6M5 10h4" /></svg>
                <span style={{ fontSize: 12.5, color: 'var(--forest)', fontWeight: 600 }}>
                  {typeof tp.classTeacherOf === 'object' ? tp.classTeacherOf.name : tp.classTeacherOf}
                </span>
              </div>
            </section>
          )}

          {/* Subject assignments */}
          {tp?.subjectAssignments && tp.subjectAssignments.length > 0 && (
            <section>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>
                Teaching assignments · {tp.subjectAssignments.length} subject{tp.subjectAssignments.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tp.subjectAssignments.map((sa, i) => {
                  const subjectName = typeof sa.subject === 'object' ? `${(sa.subject as any).code ?? ''} · ${(sa.subject as any).name ?? ''}` : sa.subject;
                  return (
                    <div key={i} style={{ background: 'var(--paper-shade)', border: '1px solid var(--rule-soft)', borderRadius: 5, padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink-1)', fontSize: 12.5, marginBottom: 6 }}>{subjectName}</div>
                      {sa.classes && sa.classes.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {sa.classes.map((c, j) => (
                            <span key={j} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'var(--plum-soft)', color: 'var(--plum)' }}>
                              {typeof c === 'object' ? (c as any).name : c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Account status */}
          <section>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--rule-soft)' }}>Account</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: teacher.active !== false ? 'var(--forest)' : 'var(--terracotta)', fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />
                {teacher.active !== false ? 'Active' : 'Inactive'}
              </span>
              {teacher.createdAt && (
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                  Joined {new Date(teacher.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default TeacherDetailView;
