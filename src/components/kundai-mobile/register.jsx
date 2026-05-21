(function () {
const { useState } = React;
const {
  CheckCircle, ArrowLeft, Eye, EyeOff,
  ShieldCheck, Sparkles, Brain,
} = window.Icons;

const REG_PACKAGES = [
  { _id: 'starter',  name: 'Single Class', pricePerStudent: 0.85, studentLimit: 50 },
  { _id: 'school',   name: 'Whole School', pricePerStudent: 0.65, studentLimit: 800 },
  { _id: 'district', name: 'Multi-School', pricePerStudent: 0.45, studentLimit: 5000 },
];

function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const [planId, setPlanId] = useState('school');
  const selectedPkg = REG_PACKAGES.find(p => p._id === planId);

  const labelCls = "block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5";
  const inputCls = "w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg px-3.5 py-2.5 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <div className="min-h-screen text-gray-900 relative" style={{ fontFamily: "'Inter Tight', Inter, system-ui, sans-serif", background: '#f1f5f9' }}>
      {/* Page-wide dot grid */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / .35) 1px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }} />
      {/* Soft brand washes */}
      <div aria-hidden className="absolute inset-0 -z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-blue-200/40 blur-3xl"/>
        <div className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full bg-emerald-200/40 blur-3xl"/>
      </div>

      {/* Topbar */}
      <div className="relative h-14 bg-white/85 backdrop-blur-md border-b border-gray-200/70 flex items-center px-6 gap-4 sticky top-0 z-10">
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
          <ArrowLeft size={14} /> Back to home
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 grid place-items-center font-black text-white text-xs">K</div>
          <span className="text-gray-900 font-bold text-sm tracking-tight">Kundai</span>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-10">
        {/* LEFT — Form */}
        <div className="lg:col-span-7">
          <div className="mb-7">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Get started</p>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900">Register your school</h1>
            <p className="text-gray-600 text-sm mt-2">Start your 30-day free trial — no credit card required.</p>
          </div>

          {selectedPkg && (
            <div className="mb-5 flex items-center gap-3 bg-blue-50 ring-1 ring-blue-100 rounded-lg px-4 py-3">
              <CheckCircle size={16} className="text-blue-600 shrink-0" />
              <div className="text-sm">
                <span className="text-gray-700">Selected plan: </span>
                <span className="text-blue-700 font-bold">{selectedPkg.name}</span>
                <span className="text-gray-500"> · ${selectedPkg.pricePerStudent.toFixed(2)}/student/term</span>
              </div>
            </div>
          )}

          <form className="bg-white rounded-xl ring-1 ring-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className={labelCls}>School name *</label>
              <input className={inputCls} placeholder="e.g. Hillside Secondary School" defaultValue="Hillside Secondary School"/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First name *</label>
                <input className={inputCls} placeholder="John" defaultValue="Tendai"/>
              </div>
              <div>
                <label className={labelCls}>Last name *</label>
                <input className={inputCls} placeholder="Moyo" defaultValue="Moyo"/>
              </div>
            </div>

            <div>
              <label className={labelCls}>Work email *</label>
              <input className={inputCls} type="email" placeholder="admin@yourschool.ac.zw" defaultValue="admin@hillside.ac.zw"/>
            </div>

            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} type="tel" placeholder="+263 77 123 4567"/>
            </div>

            <div>
              <label className={labelCls}>Password *</label>
              <div className="relative">
                <input className={inputCls + " pr-10"} type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" defaultValue="supersecret"/>
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Confirm password *</label>
              <input className={inputCls} type="password" placeholder="Repeat password" defaultValue="supersecret"/>
            </div>

            <div>
              <label className={labelCls}>Subscription plan</label>
              <select className={inputCls} value={planId} onChange={(e) => setPlanId(e.target.value)}>
                <option value="">— Select a plan (optional) —</option>
                {REG_PACKAGES.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} · ${p.pricePerStudent.toFixed(2)}/student/term · up to {p.studentLimit.toLocaleString()} students
                  </option>
                ))}
              </select>
            </div>

            <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm">
              Create school account
            </button>

            <p className="text-center text-gray-500 text-xs pt-1">
              Already have an account?{' '}
              <button type="button" className="text-blue-700 hover:text-blue-800 font-bold transition-colors">Sign in</button>
            </p>
          </form>
        </div>

        {/* RIGHT — Reassurance / brand panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl ring-1 ring-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">What you get</p>
            <h3 className="text-lg font-bold tracking-tight text-gray-900 mb-4">A teacher dashboard, not another spreadsheet.</h3>
            <div className="space-y-3">
              {[
                [Brain,        'AI tutor for every subject',     'Adapts to each learner in real time.'],
                [CheckCircle,  'Automated marking & feedback',   'Reclaim 6+ hours every week.'],
                [ShieldCheck,  'Data stays in-country',          'POPIA-aligned, hosted in Africa.'],
                [Sparkles,     'Live in 1 day',                  'No IT team needed to set up.'],
              ].map(([Icon, t, s], i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 grid place-items-center shrink-0">
                    <Icon size={15} className="text-blue-600"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 tracking-tight">{t}</p>
                    <p className="text-xs text-gray-500">{s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-600 rounded-xl p-5 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">Trial includes</p>
            <ul className="space-y-2 text-sm">
              {['Full teacher dashboard', 'AI marking + analytics', 'Up to 200 students', 'Priority email support'].map(s => (
                <li key={s} className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-blue-200"/>
                  {s}
                </li>
              ))}
            </ul>
            <p className="text-blue-100 text-xs mt-4">No credit card. Cancel any time during the trial.</p>
          </div>

          <div className="text-center text-xs text-gray-500">
            Questions? <a href="mailto:hello@kundai.ac.zw" className="text-blue-700 font-bold hover:text-blue-800">hello@kundai.ac.zw</a>
          </div>
        </div>
      </div>
    </div>
  );
}

window.RegisterPage = RegisterPage;
})();
