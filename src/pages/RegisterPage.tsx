import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle, ArrowLeft, Eye, EyeOff, Loader2,
  Brain, ShieldCheck, Sparkles,
} from 'lucide-react';
import { publicService } from '../services/publicService';
import type { SubscriptionPackage } from '../services/sysAdminService';

/**
 * RegisterPage — refreshed to share the teacher dashboard's visual language.
 * Same submit flow, same validation, same package fetch — only look & feel changes.
 */

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [form, setForm] = useState({
    schoolName: '',
    adminFirstName: '',
    adminLastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    planId: searchParams.get('plan') ?? '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    publicService.getPackages().then(setPackages).catch(() => {});
  }, []);

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await publicService.registerSchool({
        schoolName: form.schoolName,
        adminFirstName: form.adminFirstName,
        adminLastName: form.adminLastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        planId: form.planId || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- success state ----------
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter Tight', Inter, system-ui, sans-serif" }}>
        <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-gray-900 text-xl font-bold tracking-tight mb-2">Registration successful!</h2>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Your school account has been created. You can now sign in with your email and password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  const selectedPkg = packages.find((p) => p._id === form.planId);

  // ---------- shared input styling ----------
  const labelCls = 'block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5';
  const inputCls =
    'w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg px-3.5 py-2.5 ' +
    'placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all';

  return (
    <div className="min-h-screen relative text-gray-900" style={{ fontFamily: "'Inter Tight', Inter, system-ui, sans-serif", background: '#f1f5f9' }}>
      {/* Page-wide dot grid — matches the landing page */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / .35) 1px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Soft brand washes */}
      <div aria-hidden className="absolute inset-0 -z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      {/* Topbar */}
      <div className="relative h-14 bg-white/85 backdrop-blur-md border-b border-gray-200/70 flex items-center px-6 gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
        >
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

          <form onSubmit={handleSubmit} className="bg-white rounded-xl ring-1 ring-gray-100 shadow-sm p-6 space-y-4">
            {/* School name */}
            <div>
              <label className={labelCls}>School name *</label>
              <input required placeholder="e.g. Hillside Secondary School" {...field('schoolName')} className={inputCls} />
            </div>

            {/* Admin name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First name *</label>
                <input required placeholder="John" {...field('adminFirstName')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last name *</label>
                <input required placeholder="Moyo" {...field('adminLastName')} className={inputCls} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>Work email *</label>
              <input required type="email" placeholder="admin@yourschool.ac.zw" {...field('email')} className={inputCls} />
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" placeholder="+263 77 123 4567" {...field('phone')} className={inputCls} />
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>Password *</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  {...field('password')}
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Confirm password *</label>
              <input required type="password" placeholder="Repeat password" {...field('confirmPassword')} className={inputCls} />
            </div>

            {/* Plan selection */}
            {packages.length > 0 && (
              <div>
                <label className={labelCls}>Subscription plan</label>
                <select {...field('planId')} className={inputCls}>
                  <option value="">— Select a plan (optional) —</option>
                  {packages.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} · ${p.pricePerStudent.toFixed(2)}/student/term · up to {p.studentLimit.toLocaleString()} students
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-50 ring-1 ring-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Creating account…</>
              ) : (
                'Create school account'
              )}
            </button>

            <p className="text-center text-gray-500 text-xs pt-1">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-700 hover:text-blue-800 font-bold transition-colors"
              >
                Sign in
              </button>
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
                { Icon: Brain,       t: 'AI tutor for every subject',   s: 'Adapts to each learner in real time.' },
                { Icon: CheckCircle, t: 'Automated marking & feedback', s: 'Reclaim 6+ hours every week.' },
                { Icon: ShieldCheck, t: 'Data stays in-country',        s: 'POPIA-aligned, hosted in Africa.' },
                { Icon: Sparkles,    t: 'Live in 1 day',                s: 'No IT team needed to set up.' },
              ].map(({ Icon, t, s }) => (
                <div key={t} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 grid place-items-center shrink-0">
                    <Icon size={15} className="text-blue-600" />
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
              {['Full teacher dashboard', 'AI marking + analytics', 'Up to 200 students', 'Priority email support'].map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-blue-200" /> {s}
                </li>
              ))}
            </ul>
            <p className="text-blue-100 text-xs mt-4">No credit card. Cancel any time during the trial.</p>
          </div>

          <div className="text-center text-xs text-gray-500">
            Questions?{' '}
            <a href="mailto:hello@kundai.ac.zw" className="text-blue-700 font-bold hover:text-blue-800">
              hello@kundai.ac.zw
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
