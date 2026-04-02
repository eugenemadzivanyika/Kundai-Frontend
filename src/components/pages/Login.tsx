import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Sparkles, BookOpen, Mail, Lock, GraduationCap, Users } from 'lucide-react';
import { authService } from '../../services/api';

// Define the validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Define the interface to accept the onLogin prop from App.tsx
interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<'staff' | 'student'>('student');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(data.email, data.password);
      const user = response.user;

      // 1. Identify Roles
      const isStudent = user.role === 'student';
      const isStaff = user.role === 'teacher' || user.role === 'admin';

      // 2. Portal Validation: Prevent 'Staff' from entering via 'Student' portal and vice-versa
      if (selectedPortal === 'student' && !isStudent) {
        // authService.logout(); 
        setError('This is a Staff account. Please switch to the Staff portal to sign in.');
        return;
      }

      if (selectedPortal === 'staff' && !isStaff) {
        // authService.logout();
        setError('This is a Student account. Please switch to the Student portal to sign in.');
        return;
      }

      // 3. Success: Trigger the onLogin prop from App.tsx
      // This updates the isAuthenticated state in the parent App.
      onLogin();

      // Note: App.tsx also has navigation logic in its onLogin handler, 
      // but we keep these as secondary fallbacks.
      if (isStaff) {
        navigate('/dashboard', { replace: true });
      } else if (isStudent) {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 font-sans">
      <div className="relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
          <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            
            {/* Left Column: Mission & Context */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                KundAI Learning Platform
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-slate-900 lg:text-5xl leading-tight">
                  Think clearly. <br />Practice deeply. <br />Learn with purpose.
                </h1>
                <p className="text-base text-slate-600 lg:text-lg max-w-md">
                  Your portal is built to strengthen reasoning, mastery, and collaboration—leveraging AI to guide you, not do the work for you.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Guided Practice</p>
                      <p className="text-xs text-slate-500">Focus on gaps, not shortcuts.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">AI Tutor</p>
                      <p className="text-xs text-slate-500">Explain, practice, reflect.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Secure Progress</p>
                      <p className="text-xs text-slate-500">Your learning history stays safe.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Peer Support</p>
                      <p className="text-xs text-slate-500">Learn by teaching others.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
              <div className="mb-8 space-y-4 text-center">
                <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
                
                {/* Portal Selector Toggle */}
                <div className="flex w-full rounded-xl border border-slate-100 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setSelectedPortal('student')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                      selectedPortal === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPortal('staff')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                      selectedPortal === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <Users className="h-4 w-4" /> Staff
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full text-base focus:outline-none"
                      placeholder="name@university.edu"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <Lock className="h-5 w-5 text-slate-400" />
                    <input
                      {...register('password')}
                      type="password"
                      className="w-full text-base focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>

                {error && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 animate-pulse">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : `Sign in as ${selectedPortal.charAt(0).toUpperCase() + selectedPortal.slice(1)}`}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;