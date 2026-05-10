// Packages — tiered cards + custom builder + per-package adoption.
const { useState: useStatePkg } = React;

function PagePackages({ goto }) {
  const { PACKAGES, SCHOOLS } = window.KUNDAI_DATA;
  const [seats, setSeats] = useStatePkg(1500);
  const [billing, setBilling] = useStatePkg('termly');

  // Custom price calculation — tiered: <500 $0.80, <1000 $0.65, <2500 $0.55, <5000 $0.50, else $0.45
  const tier = seats < 500 ? 0.80 : seats < 1000 ? 0.65 : seats < 2500 ? 0.55 : seats < 5000 ? 0.50 : 0.45;
  const termlyTotal = Math.round(seats * tier);
  const annualTotal = Math.round(termlyTotal * 3 * 0.93); // 7% off annual
  const monthlyTotal = Math.round(seats * tier / 3 * 1.08); // 8% premium for monthly
  const total = billing === 'monthly' ? monthlyTotal : billing === 'termly' ? termlyTotal : annualTotal;

  // Schools per package
  const schoolsByPackage = (pkgName) => SCHOOLS.filter(s => s.pkg === pkgName);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Packages & pricing</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-lo)' }}>4 packages live · {SCHOOLS.length} schools subscribed across all tiers</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm" icon={I.Edit}>Edit pricing rules</Btn>
          <Btn variant="primary" size="sm" icon={I.Plus}>New package</Btn>
        </div>
      </div>

      {/* Tiered package cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {PACKAGES.filter(p => p.type === 'prepaid').map(pkg => {
          const onIt = pkg.schoolsOn;
          return (
            <div key={pkg.id} style={{
              position: 'relative',
              background: pkg.highlight
                ? 'linear-gradient(180deg, rgba(16,185,129,0.10) 0%, #111a2c 60%)'
                : 'linear-gradient(180deg, #131e35 0%, #111a2c 100%)',
              border: pkg.highlight ? '1px solid rgba(16,185,129,.45)' : '1px solid var(--line)',
              borderRadius: 14, padding: 22, overflow: 'hidden',
              boxShadow: pkg.highlight ? '0 8px 32px -16px rgba(16,185,129,.45)' : '0 8px 24px -16px rgba(0,0,0,.6)',
            }}>
              {pkg.highlight && (
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  <Pill tone="emerald" sm>★ Most popular</Pill>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-lo)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{pkg.name}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-mid)' }}>{pkg.tagline}</p>
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="tnum" style={{ fontSize: 36, fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-.03em', lineHeight: 1 }}>${pkg.pricePerStudent.toFixed(2)}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-lo)' }}>/ student / term</span>
              </div>
              <div className="tnum" style={{ marginTop: 6, fontSize: 13, color: pkg.highlight ? '#34d399' : 'var(--ink-mid)', fontWeight: 600 }}>
                Up to {pkg.studentLimit.toLocaleString()} students · ${(pkg.studentLimit * pkg.pricePerStudent).toLocaleString()}/term max
              </div>
              <div style={{ height: 1, background: 'var(--line-soft)', margin: '18px 0 14px' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {pkg.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--ink-mid)' }}>
                    <span style={{ width: 16, height: 16, borderRadius: 999, background: pkg.highlight ? 'rgba(16,185,129,.18)' : 'var(--bg-elev-2)', display: 'grid', placeItems: 'center', marginTop: 1, flexShrink: 0 }}>
                      <I.Check size={10} style={{ color: pkg.highlight ? '#34d399' : 'var(--ink-lo)' }} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Adoption</div>
                  <div className="tnum" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-hi)', marginTop: 2 }}>{pkg.schoolsOn} schools</div>
                </div>
                <Btn variant={pkg.highlight ? 'primary' : 'dark'} size="sm" icon={I.Edit}>Edit</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom package builder + District tier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Pill tone="amber" sm>Custom · District tier</Pill>
          </div>
          <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700 }}>Custom package builder</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-lo)' }}>Quote a school based on the number of students they need to accommodate.</p>

          <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: 'var(--ink-lo)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Students to accommodate</label>
                <span className="tnum" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-hi)' }}>{seats.toLocaleString()}</span>
              </div>
              <input type="range" min={100} max={10000} step={50} value={seats} onChange={e => setSeats(parseInt(e.target.value))}
                style={{
                  width: '100%', appearance: 'none', height: 6, background: `linear-gradient(90deg, #34d399 ${(seats-100)/9900*100}%, var(--bg-elev-2) ${(seats-100)/9900*100}%)`,
                  borderRadius: 999, outline: 'none', cursor: 'pointer',
                }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: 'var(--ink-faint)' }}>
                <span>100</span><span>2,500</span><span>5,000</span><span>10,000</span>
              </div>

              <div style={{ marginTop: 22 }}>
                <label style={{ fontSize: 11, color: 'var(--ink-lo)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Billing cycle</label>
                <div style={{ display: 'inline-flex', background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 10, padding: 3 }}>
                  {[['monthly','Monthly','+8%'],['termly','Termly','—'],['annually','Annually','−7%']].map(([k, l, badge]) => (
                    <button key={k} onClick={() => setBilling(k)} style={{
                      border: 0, padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: billing === k ? 'var(--bg-elev-2)' : 'transparent',
                      color: billing === k ? 'var(--ink-hi)' : 'var(--ink-lo)',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {l}
                      <span style={{ fontSize: 9.5, color: billing === k ? (k === 'annually' ? '#34d399' : k === 'monthly' ? '#fbbf24' : 'var(--ink-faint)') : 'var(--ink-faint)' }}>{badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 22, padding: 14, background: 'var(--bg-elev-1)', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Tiered pricing</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, fontFamily: "'JetBrains Mono',monospace" }}>
                  {[['< 500','$0.80', 0.80],['500–999','$0.65',0.65],['1,000–2,499','$0.55',0.55],['2,500–4,999','$0.50',0.50],['5,000+','$0.45',0.45]].map(([range, price, t]) => (
                    <div key={range} style={{ display: 'flex', justifyContent: 'space-between', color: tier === t ? 'var(--ink-hi)' : 'var(--ink-faint)', fontWeight: tier === t ? 700 : 500 }}>
                      <span>{range} students</span>
                      <span style={{ color: tier === t ? '#34d399' : 'var(--ink-faint)' }}>{price}/student</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live quote */}
            <div style={{ background: 'linear-gradient(180deg, rgba(16,185,129,.10) 0%, var(--bg-elev-1) 100%)', border: '1px solid rgba(16,185,129,.30)', borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 10.5, color: '#34d399', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Live quote</div>
              <div className="tnum" style={{ fontSize: 38, fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-.03em', lineHeight: 1.1, marginTop: 6 }}>${total.toLocaleString()}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-lo)', marginTop: 2 }}>USD · per {billing === 'monthly' ? 'month' : billing === 'termly' ? 'term' : 'year'}</div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(16,185,129,.20)', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-lo)' }}>
                  <span>Per student</span>
                  <span className="tnum" style={{ color: 'var(--ink-mid)', fontWeight: 600 }}>${tier.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-lo)' }}>
                  <span>Students</span>
                  <span className="tnum" style={{ color: 'var(--ink-mid)', fontWeight: 600 }}>{seats.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-lo)' }}>
                  <span>Annualized</span>
                  <span className="tnum" style={{ color: 'var(--ink-mid)', fontWeight: 600 }}>${(billing === 'annually' ? total : billing === 'termly' ? total * 3 : total * 12).toLocaleString()}</span>
                </div>
              </div>
              <Btn variant="primary" size="md" icon={I.Plus} style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>Save as quote</Btn>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="District tier active" sub="Custom contracts" />
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-mid)', marginBottom: 14 }}>4 multi-school districts on bespoke contracts. Volume pricing from $0.45/student.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { name: 'Mashonaland West Province', schools: 12, students: 8420, value: 11340 },
                { name: 'Bulawayo Metro Group',     schools: 7,  students: 4180, value: 5641 },
                { name: 'Manicaland Mission Schools', schools: 9, students: 3260, value: 4400 },
                { name: 'CHISCO (Catholic Schools)', schools: 14, students: 7110, value: 9590 },
              ].map((d, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--bg-elev-1)', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-hi)' }}>{d.name}</span>
                    <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>${d.value.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 11, color: 'var(--ink-lo)' }}>
                    <span>{d.schools} schools</span>
                    <span>{d.students.toLocaleString()} students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Per-package school list */}
      <Card padded={false}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Schools by package</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-lo)' }}>Adoption breakdown across the prepaid tiers</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {['Starter','Classroom','Campus'].map((pkgName, idx, arr) => {
            const list = schoolsByPackage(pkgName);
            return (
              <div key={pkgName} style={{ padding: 18, borderRight: idx < arr.length-1 ? '1px solid var(--line-soft)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-mid)' }}>{pkgName}</span>
                  <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>{list.length} of {SCHOOLS.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {list.slice(0, 5).map(s => (
                    <div key={s.id} onClick={() => goto('school', s.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 6, borderRadius: 6, cursor: 'pointer' }}
                         onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,.04)'}
                         onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <SchoolLogo name={s.name} tone={s.logoTone} size={26} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      </div>
                      <span className="tnum" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{s.seatsUsed}</span>
                    </div>
                  ))}
                  {list.length > 5 && (
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', padding: '4px 6px' }}>+ {list.length - 5} more…</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

window.PagePackages = PagePackages;
