// App shell — sidebar (visual context), main reports page with three tabs:
// "Generate" (wizard) · "Recent reports" · "Scheduled"
const { useState: useAppState } = React;

function App() {
  const [view, setView] = useAppState('generate'); // 'generate' | 'recent' | 'scheduled'
  const [step, setStep] = useAppState(1);
  const [selectedTypeId, setSelectedTypeId] = useAppState(null);
  const [params, setParams] = useAppState({});
  const [scheduling, setScheduling] = useAppState({ enabled: false, cadence: 'Termly (last Friday)', time: '17:00 (end of day)' });
  const [toast, setToast] = useAppState(null);

  const reportType = window.REPORTS_DATA.REPORT_TYPES.find(rt => rt.id === selectedTypeId);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));
  const startOver = () => { setStep(1); setSelectedTypeId(null); setParams({}); };

  const canProceedToStep2 = !!reportType;
  const canProceedToStep3 = canProceedToStep2 && (reportType.params || []).filter(p => p.required).every(p => params[p.id] && (Array.isArray(params[p.id]) ? params[p.id].length > 0 : true));

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <SchoolAdminSidebar />

      <div className="flex-1 min-w-0">
        <TopBar />
        <main className="p-6 max-w-7xl mx-auto">
          <PageHeader view={view} setView={setView} startOver={startOver} />

          {view === 'generate'  && (
            <GenerateView
              step={step} setStep={setStep}
              reportType={reportType}
              selectedTypeId={selectedTypeId} setSelectedTypeId={setSelectedTypeId}
              params={params} setParams={setParams}
              scheduling={scheduling} setScheduling={setScheduling}
              canProceedToStep2={canProceedToStep2} canProceedToStep3={canProceedToStep3}
              next={next} back={back} startOver={startOver} showToast={showToast}
            />
          )}
          {view === 'recent'    && <RecentReports showToast={showToast} />}
          {view === 'scheduled' && <ScheduledReports showToast={showToast} />}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2">
          <RI.Check size={14} /> {toast}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Sidebar — matches the project's school-admin sidebar style
// ───────────────────────────────────────────────────────────────
function SchoolAdminSidebar() {
  const nav = [
    { label: 'Dashboard',     icon: 'TrendUp' },
    { label: 'Teachers',      icon: 'Users' },
    { label: 'Students',      icon: 'GradCap' },
    { label: 'Classes',       icon: 'Book' },
    { label: 'Subjects',      icon: 'Book' },
    { label: 'Reports',       icon: 'FileText', active: true },
    { label: 'Settings',      icon: 'Settings' },
  ];
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen shrink-0">
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-emerald-700 text-white grid place-items-center font-bold text-sm">G</div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate">Goromonzi High</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">School Admin</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map((n, i) => {
          const Icon = RI[n.icon];
          return (
            <button key={i} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium ${
              n.active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
            }`}>
              <Icon size={15} className={n.active ? 'text-blue-700' : 'text-slate-500'} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-bold">RC</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 truncate">Mrs. R. Chigumba</div>
            <div className="text-[10px] text-slate-500">Headmistress</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center gap-4 sticky top-0 z-10">
      <div className="flex-1 max-w-md relative">
        <RI.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Search reports, classes, students…" className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex-1" />
      <span className="text-xs text-slate-500">Term 2 · Week 7 of 13</span>
      <button className="w-8 h-8 rounded-md hover:bg-slate-100 grid place-items-center relative">
        <RI.RefreshCw size={15} className="text-slate-600" />
      </button>
    </header>
  );
}

function PageHeader({ view, setView, startOver }) {
  const tabs = [
    { id: 'generate',  label: 'Generate a report' },
    { id: 'recent',    label: 'Recent reports', badge: 6 },
    { id: 'scheduled', label: 'Scheduled', badge: 4 },
  ];
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Generate, schedule, and share reports across the school.</p>
        </div>
        {view === 'generate' && (
          <button onClick={startOver} className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5">
            <RI.RefreshCw size={13} /> Start over
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition flex items-center gap-2 ${
              view === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
            {t.badge && <span className={`tnum text-[10px] px-1.5 py-0.5 rounded ${view === t.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{t.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Generate view — the wizard
// ───────────────────────────────────────────────────────────────
function GenerateView({ step, setStep, reportType, selectedTypeId, setSelectedTypeId, params, setParams, scheduling, setScheduling, canProceedToStep2, canProceedToStep3, next, back, startOver, showToast }) {
  const { StepPick, StepConfigure, StepExport } = window.WizardSteps;
  const { StepPreview } = window;

  const steps = [
    { n: 1, label: 'Pick',      sub: 'Report type' },
    { n: 2, label: 'Configure', sub: 'Parameters' },
    { n: 3, label: 'Preview',   sub: 'Sample render' },
    { n: 4, label: 'Export',    sub: 'Deliver / schedule' },
  ];

  const handleGenerate = () => {
    showToast(scheduling.enabled
      ? `Report scheduled · runs ${scheduling.cadence}`
      : 'Report generation queued · you\'ll be notified when ready');
    startOver();
  };

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12 lg:col-span-3">
        {/* Stepper */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sticky top-20">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Steps</div>
          <ol className="space-y-1">
            {steps.map((s, i) => {
              const active = step === s.n;
              const done = step > s.n;
              const reachable = s.n === 1 || (s.n === 2 && canProceedToStep2) || (s.n >= 3 && canProceedToStep3);
              return (
                <li key={s.n}>
                  <button onClick={() => reachable && setStep(s.n)} disabled={!reachable}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition ${
                      active ? 'bg-blue-50' : done ? 'hover:bg-slate-50' : reachable ? 'hover:bg-slate-50' : 'opacity-50 cursor-not-allowed'
                    }`}>
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                      done ? 'bg-emerald-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {done ? <RI.Check size={11} /> : s.n}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold ${active ? 'text-blue-900' : done ? 'text-slate-900' : 'text-slate-700'}`}>{s.label}</div>
                      <div className="text-[11px] text-slate-500">{s.sub}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {reportType && step > 1 && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Selected</div>
              <div className="text-sm font-semibold text-slate-900">{reportType.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{reportType.tagline}</div>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-9">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {step === 1 && <StepPick selectedTypeId={selectedTypeId} onSelect={setSelectedTypeId} />}
          {step === 2 && reportType && <StepConfigure reportType={reportType} params={params} setParams={setParams} />}
          {step === 3 && reportType && <StepPreview reportType={reportType} params={params} />}
          {step === 4 && reportType && <StepExport reportType={reportType} params={params} scheduling={scheduling} setScheduling={setScheduling} />}

          {/* Footer nav */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-200">
            <button onClick={back} disabled={step === 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold ${
                step === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'
              }`}>
              <RI.ChevronLeft size={14} /> Back
            </button>

            <div className="text-xs text-slate-500">Step {step} of 4</div>

            {step < 4 && (
              <button onClick={next} disabled={(step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold ${
                  (step === 1 && !canProceedToStep2) || (step === 2 && !canProceedToStep3)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                Continue <RI.ChevronRight size={14} />
              </button>
            )}
            {step === 4 && (
              <button onClick={handleGenerate}
                className="flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white">
                <RI.Sparkles size={13} /> {scheduling.enabled ? 'Schedule report' : 'Generate now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Recent reports
// ───────────────────────────────────────────────────────────────
function RecentReports({ showToast }) {
  const { RECENT_REPORTS, REPORT_TYPES } = window.REPORTS_DATA;
  const typeById = Object.fromEntries(REPORT_TYPES.map(rt => [rt.id, rt]));
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Recently generated</h3>
          <p className="text-xs text-slate-500 mt-0.5">Reports stored for 90 days · then archived to school filesystem</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5">
          <RI.Filter size={13} /> Filter
        </button>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left py-2.5 px-5 text-xs font-bold uppercase tracking-wider text-slate-500">Report</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Generated</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">By</th>
            <th className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Pages</th>
            <th className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Size</th>
            <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
            <th className="text-right py-2.5 px-5"></th>
          </tr>
        </thead>
        <tbody>
          {RECENT_REPORTS.map((r, i) => {
            const t = typeById[r.type];
            const a = window.REPORTS_DATA.ACCENT[t.accent];
            const Icon = RI[t.icon];
            return (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded ${a.iconBg} text-white grid place-items-center shrink-0`}><Icon size={13} /></div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm">{r.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-xs text-slate-600">{t.name}</td>
                <td className="py-3 px-3 text-xs text-slate-600">
                  <div>{new Date(r.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  <div className="text-[10px] text-slate-400">{new Date(r.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="py-3 px-3 text-xs text-slate-600">{r.generatedBy}</td>
                <td className="py-3 px-3 text-xs text-right tnum text-slate-600">{r.pages}</td>
                <td className="py-3 px-3 text-xs text-right tnum text-slate-600">{r.size}</td>
                <td className="py-3 px-3">
                  {r.status === 'ready' && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Ready</span>}
                  {r.status === 'generating' && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Generating…</span>}
                </td>
                <td className="py-3 px-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => showToast(`Opening ${r.name}`)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="View">
                      <RI.Eye size={14} />
                    </button>
                    <button onClick={() => showToast('Download started')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Download">
                      <RI.Download size={14} />
                    </button>
                    <button onClick={() => showToast('Share link copied')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Share">
                      <RI.Link size={14} />
                    </button>
                    <button onClick={() => showToast('Email sent')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Email">
                      <RI.Mail size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Scheduled reports
// ───────────────────────────────────────────────────────────────
function ScheduledReports({ showToast }) {
  const { SCHEDULED_REPORTS, REPORT_TYPES, ACCENT } = window.REPORTS_DATA;
  const typeById = Object.fromEntries(REPORT_TYPES.map(rt => [rt.id, rt]));

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <RI.RefreshCw size={18} className="text-blue-700 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-slate-900 text-sm">Automated reports keep stakeholders informed</div>
          <div className="text-xs text-slate-600 mt-0.5">Scheduled reports generate and deliver automatically. Pause any schedule to stop future runs — past runs stay in "Recent reports".</div>
        </div>
        <button className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 shrink-0">
          <RI.Plus size={13} /> New schedule
        </button>
      </div>

      <div className="space-y-2.5">
        {SCHEDULED_REPORTS.map((s) => {
          const t = typeById[s.type];
          const a = ACCENT[t.accent];
          const Icon = RI[t.icon];
          return (
            <div key={s.id} className={`bg-white border rounded-lg p-4 ${s.enabled ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-md ${a.iconBg} text-white grid place-items-center shrink-0`}><Icon size={16} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900">{s.name}</h4>
                    {s.enabled
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Active</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Paused</span>}
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-500">{t.name}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Cadence</div>
                      <div className="text-slate-800 mt-0.5 flex items-center gap-1.5"><RI.Calendar size={11} className="text-slate-400" />{s.cadence}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Next run</div>
                      <div className="text-slate-800 mt-0.5 flex items-center gap-1.5"><RI.Clock size={11} className="text-slate-400" />{new Date(s.nextRun).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Recipients</div>
                      <div className="text-slate-800 mt-0.5">{s.recipients}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2.5">Last ran on {new Date(s.lastRun).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => showToast(s.enabled ? 'Schedule paused' : 'Schedule resumed')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title={s.enabled ? 'Pause' : 'Resume'}>
                    {s.enabled
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                  </button>
                  <button onClick={() => showToast('Running now…')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Run now">
                    <RI.RefreshCw size={14} />
                  </button>
                  <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit">
                    <RI.Edit size={14} />
                  </button>
                  <button onClick={() => showToast('Schedule deleted')} className="p-1.5 hover:bg-rose-50 hover:text-rose-700 rounded text-slate-500" title="Delete">
                    <RI.Trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
