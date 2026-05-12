import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, BarChart2, BookOpen, Users2,
  CheckCircle, ChevronRight, Zap, Mail,
  ArrowRight,
} from 'lucide-react';
import { publicService } from '../services/publicService';
import type { SubscriptionPackage } from '../services/sysAdminService';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Learning Engine',
    desc: 'Personalised AI tutor that adapts to each student\'s knowledge level, filling gaps and accelerating mastery.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: BarChart2,
    title: 'Deep Analytics',
    desc: 'Real-time dashboards for teachers and school admins — track class performance, identify at-risk students early.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  {
    icon: BookOpen,
    title: 'Development Plans',
    desc: 'Automated personalised learning plans for every student, aligned to the national curriculum and term goals.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Users2,
    title: 'Teacher Tools',
    desc: 'AI-assisted marking, handwritten submission scanning, staffroom collaboration and automated feedback.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
];

const ACCENT = ['text-sky-400', 'text-emerald-400', 'text-violet-400', 'text-amber-400'];
const RING   = ['ring-sky-500/30', 'ring-emerald-500/40', 'ring-violet-500/30', 'ring-amber-500/30'];
const CHECK  = ['text-sky-400', 'text-emerald-400', 'text-violet-400', 'text-amber-400'];
const BTN    = [
  'bg-sky-600 hover:bg-sky-500',
  'bg-emerald-600 hover:bg-emerald-500',
  'bg-violet-600 hover:bg-violet-500',
  'bg-amber-600 hover:bg-amber-500',
];

const LandingPage: React.FC = () => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    publicService.getPackages()
      .then(setPackages)
      .catch(() => {/* silently skip if backend unavailable */})
      .finally(() => setPkgLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-extrabold text-slate-900 text-sm">
              K
            </div>
            <span className="font-bold text-white text-base">Kundai</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Start free trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap size={11} />
          Built for Zimbabwean schools
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          The AI platform that<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
            elevates every student
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Kundai brings AI-powered tutoring, automated marking, and deep analytics to
          primary and secondary schools — all in one platform built for the African classroom.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl text-base transition-colors shadow-lg shadow-emerald-900/40"
          >
            Start free trial <ArrowRight size={16} />
          </button>
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-semibold px-6 py-3 rounded-xl text-base transition-colors"
          >
            See plans <ChevronRight size={16} />
          </button>
        </div>
        {/* Social proof */}
        <p className="text-slate-500 text-sm mt-8">
          Trusted by schools across Zimbabwe · No credit card required
        </p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything your school needs</h2>
          <p className="text-slate-400">Powerful tools for teachers, students, and administrators.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className={`${bg} border rounded-xl p-5`}>
              <div className={`w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-4`}>
                <Icon size={20} className={color} />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Simple, transparent pricing</h2>
          <p className="text-slate-400">Pay per student, per term. No hidden fees.</p>
        </div>

        {pkgLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            Pricing plans coming soon. <button onClick={() => navigate('/register')} className="text-emerald-400 hover:underline">Contact us</button> for details.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {packages.map((pkg, idx) => {
              const accent = ACCENT[idx % ACCENT.length];
              const ring = RING[idx % RING.length];
              const checkColor = CHECK[idx % CHECK.length];
              const btnColor = BTN[idx % BTN.length];
              const termlyMax = pkg.studentLimit * pkg.pricePerStudent;
              return (
                <div
                  key={pkg._id}
                  className={`relative bg-slate-900 rounded-xl ring-1 ${ring} p-6 flex flex-col`}
                >
                  <h3 className={`text-xs font-bold uppercase tracking-widest mb-1 ${accent}`}>{pkg.type}</h3>
                  <p className="text-white text-xl font-bold mb-1">{pkg.name}</p>
                  <div className="flex items-baseline gap-1.5 mt-3">
                    <span className={`text-4xl font-extrabold tracking-tight ${accent}`}>
                      ${pkg.pricePerStudent.toFixed(2)}
                    </span>
                    <span className="text-slate-400 text-sm">/ student / term</span>
                  </div>
                  <p className={`text-xs font-semibold ${accent} mt-1`}>
                    Up to {pkg.studentLimit.toLocaleString()} students · ${termlyMax.toLocaleString()} max/term
                  </p>
                  <div className="my-5 border-t border-slate-800" />
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle size={14} className={`mt-0.5 shrink-0 ${checkColor}`} />
                        {f}
                      </li>
                    ))}
                    {pkg.features.length === 0 && (
                      <li className="text-slate-500 text-sm italic">Feature details coming soon.</li>
                    )}
                  </ul>
                  <button
                    onClick={() => navigate(`/register?plan=${pkg._id}`)}
                    className={`${btnColor} text-white text-sm font-semibold w-full py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2`}
                  >
                    Start free trial <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
          <h3 className="text-white font-semibold mb-1">Need a custom plan?</h3>
          <p className="text-slate-400 text-sm mb-4">District pricing from $0.45/student for multi-school groups and large institutions.</p>
          <a href="mailto:hello@kundai.ac.zw" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-colors">
            <Mail size={14} /> Contact us
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center border-t border-slate-800">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your school?</h2>
        <p className="text-slate-400 mb-8">Start a 30-day free trial. No credit card required.</p>
        <button
          onClick={() => navigate('/register')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-emerald-900/40 inline-flex items-center gap-2"
        >
          Get started for free <ArrowRight size={16} />
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-slate-900 text-[10px]">K</div>
            <span>© 2026 Kundai Education Technologies</span>
          </div>
          <div className="flex gap-5">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Sign in</button>
            <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Register</button>
            <a href="mailto:hello@kundai.ac.zw" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
