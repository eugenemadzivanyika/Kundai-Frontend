// Wizard step components — pick type, configure params, schedule
const { useState: useWState } = React;
const { RI, REPORTS_DATA } = window;
const { REPORT_TYPES, ACCENT, CLASSES, SUBJECTS, TEACHERS } = REPORTS_DATA;

// ───────────────────────────────────────────────────────────────
// STEP 1 — Pick report type
// ───────────────────────────────────────────────────────────────
function StepPick({ selectedTypeId, onSelect }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">What kind of report?</h2>
        <p className="text-sm text-slate-500 mt-1">Pick a template — you'll configure it on the next step.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REPORT_TYPES.map((rt) => {
          const a = ACCENT[rt.accent];
          const Icon = RI[rt.icon];
          const selected = selectedTypeId === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => onSelect(rt.id)}
              className={`text-left bg-white border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                selected ? `${a.border} ring-2 ${a.ring} ring-offset-1` : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-md ${a.iconBg} text-white grid place-items-center shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{rt.name}</h3>
                    {selected && <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${a.text} ${a.bg} px-1.5 py-0.5 rounded`}>Selected</span>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{rt.tagline}</p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{rt.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><RI.Clock size={10} /> {rt.avgTime}</span>
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

// ───────────────────────────────────────────────────────────────
// Parameter controls
// ───────────────────────────────────────────────────────────────
function ParamSelect({ label, options, value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}{required && <span className="text-rose-600">*</span>}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        <option value="">Choose…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ParamToggle({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      <span className="text-sm text-slate-700">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative w-9 h-5 rounded-full transition ${value ? 'bg-blue-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${value ? 'left-[18px]' : 'left-0.5'}`}></span>
      </button>
    </label>
  );
}

function ParamMultiClass({ value = [], onChange, required }) {
  const byForm = CLASSES.reduce((acc, c) => { (acc[c.form] = acc[c.form] || []).push(c); return acc; }, {});
  const toggle = (id) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  const allInForm = (form) => byForm[form].every(c => value.includes(c.id));
  const toggleForm = (form) => {
    if (allInForm(form)) onChange(value.filter(v => !byForm[form].some(c => c.id === v)));
    else onChange([...new Set([...value, ...byForm[form].map(c => c.id)])]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700">Classes{required && <span className="text-rose-600">*</span>}</label>
        <span className="text-xs text-slate-500">{value.length} of {CLASSES.length} selected</span>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
        {Object.entries(byForm).map(([form, classes]) => (
          <div key={form}>
            <button onClick={() => toggleForm(form)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 mb-1">
              <span className={`w-3.5 h-3.5 rounded border ${allInForm(form) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'} grid place-items-center`}>
                {allInForm(form) && <RI.Check size={9} className="text-white" />}
              </span>
              {form}
            </button>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 ml-5">
              {classes.map(c => {
                const checked = value.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggle(c.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs transition ${
                      checked ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}>
                    <span className={`w-3 h-3 rounded-sm border ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'} grid place-items-center shrink-0`}>
                      {checked && <RI.Check size={8} className="text-white" />}
                    </span>
                    <span>{c.form.replace('Form ','')}{c.stream} <span className="text-slate-400">·{c.students}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParamClassPicker({ value, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Class{required && <span className="text-rose-600">*</span>}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Choose a class…</option>
        {CLASSES.map(c => <option key={c.id} value={c.id}>{c.form} {c.stream} · {c.students} students</option>)}
      </select>
    </div>
  );
}

function ParamMultiSubject({ value = [], onChange, required }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700">Subjects{required && <span className="text-rose-600">*</span>}</label>
        <div className="flex gap-2">
          <button onClick={() => onChange(SUBJECTS.map(s => s.id))} className="text-xs text-blue-600 hover:text-blue-700 font-medium">All</button>
          <button onClick={() => onChange([])} className="text-xs text-slate-500 hover:text-slate-700">None</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {SUBJECTS.map(s => {
          const checked = value.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggle(s.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs ${
                checked ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
              <span className={`w-3 h-3 rounded-sm border ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'} grid place-items-center shrink-0`}>
                {checked && <RI.Check size={8} className="text-white" />}
              </span>
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ParamMultiForm({ value = [], onChange }) {
  const forms = ['Form 1','Form 2','Form 3','Form 4','Form 5','Form 6'];
  const toggle = (f) => onChange(value.includes(f) ? value.filter(v => v !== f) : [...value, f]);
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Forms</label>
      <div className="flex flex-wrap gap-1.5">
        {forms.map(f => {
          const checked = value.includes(f);
          return (
            <button key={f} onClick={() => toggle(f)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
                checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>{f}</button>
          );
        })}
      </div>
    </div>
  );
}

function ParamMultiTeacher({ value, onChange }) {
  const [showAll, setShowAll] = useWState(false);
  const isAll = value === 'all' || value === undefined;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700">Teachers</label>
        <div className="flex gap-2">
          <button onClick={() => onChange('all')} className={`text-xs font-medium ${isAll ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>All teachers ({TEACHERS.length})</button>
          <button onClick={() => onChange([])} className="text-xs text-slate-500 hover:text-slate-700">Select specific</button>
        </div>
      </div>
      {!isAll && (
        <div className="grid grid-cols-2 gap-1.5">
          {TEACHERS.map(t => {
            const sel = Array.isArray(value) && value.includes(t.id);
            return (
              <button key={t.id} onClick={() => onChange(sel ? value.filter(v => v !== t.id) : [...(Array.isArray(value) ? value : []), t.id])}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs ${
                  sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                <span className="w-5 h-5 rounded-full bg-slate-200 grid place-items-center text-[9px] font-bold text-slate-600">{t.avatar}</span>
                <span className="truncate">{t.name}</span>
              </button>
            );
          })}
        </div>
      )}
      {isAll && (
        <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-600">All {TEACHERS.length} teachers will be included in the report.</div>
      )}
    </div>
  );
}

function ParamMultiSelect({ label, options, value = [], onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o]);
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => {
          const sel = value.includes(o);
          return (
            <button key={o} onClick={() => toggle(o)}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
                sel ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>{o}</button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// STEP 2 — Configure parameters
// ───────────────────────────────────────────────────────────────
function StepConfigure({ reportType, params, setParams }) {
  const setParam = (id, v) => setParams({ ...params, [id]: v });
  const renderParam = (p) => {
    switch (p.kind) {
      case 'select':       return <ParamSelect label={p.label} options={p.options} value={params[p.id]} onChange={(v) => setParam(p.id, v)} required={p.required} />;
      case 'toggle':       return <ParamToggle label={p.label} value={params[p.id] ?? p.default} onChange={(v) => setParam(p.id, v)} />;
      case 'multi-class':  return <ParamMultiClass value={params[p.id]} onChange={(v) => setParam(p.id, v)} required={p.required} />;
      case 'class-picker': return <ParamClassPicker value={params[p.id]} onChange={(v) => setParam(p.id, v)} required={p.required} />;
      case 'multi-subject':return <ParamMultiSubject value={params[p.id]} onChange={(v) => setParam(p.id, v)} required={p.required} />;
      case 'multi-form':   return <ParamMultiForm value={params[p.id] ?? p.default} onChange={(v) => setParam(p.id, v)} />;
      case 'multi-teacher':return <ParamMultiTeacher value={params[p.id] ?? p.default} onChange={(v) => setParam(p.id, v)} />;
      case 'multi-select': return <ParamMultiSelect label={p.label} options={p.options} value={params[p.id] ?? p.default} onChange={(v) => setParam(p.id, v)} />;
      default: return null;
    }
  };

  const a = ACCENT[reportType.accent];
  const Icon = RI[reportType.icon];

  return (
    <div>
      {/* Selected type banner */}
      <div className={`flex items-center gap-3 ${a.bg} border ${a.border} rounded-lg px-4 py-3 mb-5`}>
        <div className={`w-9 h-9 rounded-md ${a.iconBg} text-white grid place-items-center shrink-0`}><Icon size={16} /></div>
        <div className="flex-1">
          <div className="font-semibold text-slate-900">{reportType.name}</div>
          <div className="text-xs text-slate-600">{reportType.tagline}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-900 mb-1">Configure</h2>
      <p className="text-sm text-slate-500 mb-5">Choose what to include in this report.</p>

      <div className="space-y-5">
        {reportType.params.map((p) => <div key={p.id}>{renderParam(p)}</div>)}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// STEP 4 — Export
// ───────────────────────────────────────────────────────────────
function StepExport({ reportType, params, onSchedule, onGenerate, scheduling, setScheduling }) {
  const [format, setFormat] = useWState('pdf');
  const [recipients, setRecipients] = useWState('');
  const [delivery, setDelivery] = useWState('download');

  const formats = [
    { id: 'pdf',   label: 'PDF',   icon: 'FileText', note: 'A4, print-ready' },
    { id: 'excel', label: 'Excel / CSV', icon: 'FileText', note: 'For pivoting / analysis' },
    { id: 'print', label: 'Print',  icon: 'Print',    note: 'Send to printer now' },
  ];

  const deliveries = [
    { id: 'download', label: 'Download to my computer', icon: 'Download' },
    { id: 'email',    label: 'Email to recipients',     icon: 'Mail' },
    { id: 'link',     label: 'Generate shareable link', icon: 'Link', note: 'Requires authentication to open' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Export &amp; deliver</h2>
      <p className="text-sm text-slate-500 mb-5">Choose how this report should be packaged and shared.</p>

      <div className="space-y-5">
        {/* Format */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Format</label>
          <div className="grid grid-cols-3 gap-2">
            {formats.map(f => {
              const Icon = RI[f.icon];
              const sel = format === f.id;
              return (
                <button key={f.id} onClick={() => setFormat(f.id)}
                  className={`flex items-start gap-2 p-3 rounded-md border text-left ${sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <Icon size={16} className={sel ? 'text-blue-700' : 'text-slate-500'} />
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold ${sel ? 'text-blue-900' : 'text-slate-900'}`}>{f.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{f.note}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Delivery</label>
          <div className="space-y-2">
            {deliveries.map(d => {
              const Icon = RI[d.icon];
              const sel = delivery === d.id;
              return (
                <label key={d.id} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer ${sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="delivery" checked={sel} onChange={() => setDelivery(d.id)} className="mt-0.5 accent-blue-600" />
                  <Icon size={16} className={`mt-0.5 ${sel ? 'text-blue-700' : 'text-slate-500'}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${sel ? 'text-blue-900' : 'text-slate-900'}`}>{d.label}</div>
                    {d.note && <div className="text-[11px] text-slate-500 mt-0.5">{d.note}</div>}
                  </div>
                </label>
              );
            })}
          </div>
          {delivery === 'email' && (
            <div className="mt-2">
              <input
                value={recipients} onChange={(e) => setRecipients(e.target.value)}
                placeholder="recipients@email.com, another@email.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Or pick by role: <a className="text-blue-600 hover:underline cursor-pointer">All form teachers</a> · <a className="text-blue-600 hover:underline cursor-pointer">All parents in selected classes</a> · <a className="text-blue-600 hover:underline cursor-pointer">School board</a></p>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <RI.RefreshCw size={16} className="text-amber-700 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900 text-sm">Run this on a schedule?</div>
                <ParamToggle label="" value={scheduling.enabled} onChange={(v) => setScheduling({ ...scheduling, enabled: v })} />
              </div>
              <p className="text-xs text-slate-600 mt-1">Auto-generate this report on a recurring basis. We'll deliver each run to the recipients above.</p>
              {scheduling.enabled && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ParamSelect label="Cadence" options={['Daily','Weekly (Monday)','Bi-weekly','Monthly (1st)','Termly (last Friday)']} value={scheduling.cadence} onChange={(v) => setScheduling({ ...scheduling, cadence: v })} />
                  <ParamSelect label="Time of day" options={['07:00 (school open)','12:00 (midday)','17:00 (end of day)','23:00 (overnight)']} value={scheduling.time} onChange={(v) => setScheduling({ ...scheduling, time: v })} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.WizardSteps = { StepPick, StepConfigure, StepExport };
