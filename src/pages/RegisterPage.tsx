import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { publicService } from '../services/publicService';
import type { SubscriptionPackage } from '../services/sysAdminService';

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

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Registration successful!</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your school account has been created. You can now sign in with your email and password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  const selectedPkg = packages.find((p) => p._id === form.planId);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Topbar */}
      <div className="h-14 border-b border-slate-800 flex items-center px-6 gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={14} /> Back to home
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-slate-900 text-xs">K</div>
          <span className="text-white font-bold text-sm">Kundai</span>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Register your school</h1>
            <p className="text-slate-400 text-sm">Start your 30-day free trial — no credit card required.</p>
          </div>

          {/* Selected plan banner */}
          {selectedPkg && (
            <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <div className="text-sm">
                <span className="text-slate-300">Selected plan: </span>
                <span className="text-emerald-300 font-semibold">{selectedPkg.name}</span>
                <span className="text-slate-500"> · ${selectedPkg.pricePerStudent.toFixed(2)}/student/term</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4 shadow-xl">
            {/* School info */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">School name *</label>
              <input
                required
                placeholder="e.g. Hillside Secondary School"
                {...field('schoolName')}
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Admin name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">First name *</label>
                <input required placeholder="John" {...field('adminFirstName')}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Last name *</label>
                <input required placeholder="Moyo" {...field('adminLastName')}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Work email *</label>
              <input required type="email" placeholder="admin@yourschool.ac.zw" {...field('email')}
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Phone</label>
              <input type="tel" placeholder="+263 77 123 4567" {...field('phone')}
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Password *</label>
              <div className="relative">
                <input required type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" {...field('password')}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3.5 py-2.5 pr-10 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Confirm password *</label>
              <input required type="password" placeholder="Repeat password" {...field('confirmPassword')}
                className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3.5 py-2.5 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
            </div>

            {/* Plan selection */}
            {packages.length > 0 && (
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Subscription plan</label>
                <select {...field('planId')}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors">
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
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create school account'}
            </button>

            <p className="text-center text-slate-500 text-xs">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
