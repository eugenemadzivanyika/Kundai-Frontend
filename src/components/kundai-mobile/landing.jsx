(function () {
const { useState, useEffect, useRef } = React;
const {
  Brain, BarChart2, BookOpen, Users2,
  CheckCircle, ChevronRight, Zap, Mail, ArrowRight,
  Sparkles, ShieldCheck, TrendingUp, AlertTriangle,
} = window.Icons;

const MOCK_PACKAGES = [
  { _id: 'starter',  type: 'Starter',  name: 'Single Class', pricePerStudent: 0.85, studentLimit: 50,   features: ['AI tutor for 1 subject','Automated marking','Basic analytics dashboard','Email support'] },
  { _id: 'school',   type: 'School',   name: 'Whole School', pricePerStudent: 0.65, studentLimit: 800,  features: ['All subjects + units','AI marking + handwriting OCR','Teacher staffroom collaboration','Development plans per student','Priority support'], featured: true },
  { _id: 'district', type: 'District', name: 'Multi-School', pricePerStudent: 0.45, studentLimit: 5000, features: ['Everything in Whole School','District-wide analytics','Custom curriculum mapping','Dedicated success manager'] },
];

const TIER = [
  { eyebrow: 'text-sky-600',     price: 'text-sky-700',     ring: 'ring-sky-200',     hoverRing: 'hover:ring-sky-300',     check: 'text-sky-500',     btnBase: 'bg-sky-600',     btn: 'bg-sky-600 hover:bg-sky-700 text-white' },
  { eyebrow: 'text-blue-600',    price: 'text-blue-700',    ring: 'ring-blue-600',    hoverRing: 'hover:ring-blue-300',    check: 'text-blue-500',    btnBase: 'bg-blue-600',    btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { eyebrow: 'text-emerald-600', price: 'text-emerald-700', ring: 'ring-emerald-200', hoverRing: 'hover:ring-emerald-300', check: 'text-emerald-500', btnBase: 'bg-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
];

const FEATURE_TONES = [
  { bg: 'bg-blue-50',    fg: 'text-blue-600',    ring: 'hover:ring-blue-200' },
  { bg: 'bg-emerald-50', fg: 'text-emerald-600', ring: 'hover:ring-emerald-200' },
  { bg: 'bg-sky-50',     fg: 'text-sky-600',     ring: 'hover:ring-sky-200' },
  { bg: 'bg-indigo-50',  fg: 'text-indigo-600',  ring: 'hover:ring-indigo-200' },
];

const FEATURES = [
  { icon: Brain,     title: 'AI Learning Engine', desc: "Personalised AI tutor that adapts to each student's knowledge level, filling gaps and accelerating mastery." },
  { icon: BarChart2, title: 'Deep Analytics',     desc: 'Real-time dashboards for teachers and admins — track class performance, identify at-risk students early.' },
  { icon: BookOpen,  title: 'Development Plans',  desc: 'Automated personalised learning plans for every student, aligned to the national curriculum and term goals.' },
  { icon: Users2,    title: 'Teacher Tools',      desc: 'AI-assisted marking, handwritten submission scanning, staffroom collaboration and automated feedback.' },
];

// ─── CSS injected once ───
const GLOBAL_CSS = `
  @keyframes kundai-floatA { 0%,100%{transform:translateY(0) rotate(6deg)} 50%{transform:translateY(-7px) rotate(6deg)} }
  @keyframes kundai-floatB { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-6px) rotate(-3deg)} }
  @keyframes kundai-floatC { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-5px) rotate(-2deg)} }
  @keyframes kundai-slideInRight { from{opacity:0;transform:translateX(40px) rotate(6deg)} to{opacity:1;transform:translateX(0) rotate(6deg)} }
  @keyframes kundai-slideInLeft  { from{opacity:0;transform:translateX(-40px) rotate(-3deg)} to{opacity:1;transform:translateX(0) rotate(-3deg)} }
  @keyframes kundai-popIn        { from{opacity:0;transform:scale(0.7) rotate(-2deg)} to{opacity:1;transform:scale(1) rotate(-2deg)} }
  @keyframes kundai-fillBar      { from{width:0%} to{width:86%} }
  @keyframes kundai-blink        { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes kundai-fadeUp       { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes kundai-typingDot    { 0%,80%,100%{opacity:.25} 40%{opacity:1} }
  @keyframes kundai-popMsg       { from{opacity:0;transform:scale(.93) translateY(5px)} to{opacity:1;transform:scale(1) translateY(0)} }

  .kundai-floater-right { animation: kundai-slideInRight .6s cubic-bezier(.34,1.56,.64,1) .3s both, kundai-floatA 4s ease-in-out 1s infinite; }
  .kundai-floater-left  { animation: kundai-slideInLeft  .6s cubic-bezier(.34,1.56,.64,1) .5s both, kundai-floatB 5s ease-in-out 1.5s infinite; }
  .kundai-floater-toast { animation: kundai-popIn .5s cubic-bezier(.34,1.56,.64,1) .8s both, kundai-floatC 3.5s ease-in-out 1.3s infinite; }
  .kundai-bar-fill      { animation: kundai-fillBar 1.3s cubic-bezier(.4,0,.2,1) .5s both; }
  .kundai-cursor        { display:inline-block;width:2px;height:.85em;background:#25D366;vertical-align:middle;margin-left:1px;animation:kundai-blink .85s step-end infinite;border-radius:1px; }
  .kundai-typing-dot    { display:inline-block;width:6px;height:6px;border-radius:50%;background:#adb5bd;animation:kundai-typingDot 1.2s infinite; }
  .kundai-typing-dot:nth-child(2){animation-delay:.2s}
  .kundai-typing-dot:nth-child(3){animation-delay:.4s}
  .kundai-msg-pop       { animation: kundai-popMsg .28s cubic-bezier(.34,1.56,.64,1) both; }
  .kundai-fade-up-1     { animation: kundai-fadeUp .5s ease both; }
  .kundai-fade-up-2     { animation: kundai-fadeUp .5s ease .15s both; }
`;

// ─── Hero floaters ───
function HeroFloaters() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="kundai-floater-right hidden md:block absolute top-12 right-[-40px] w-56 bg-white rounded-lg ring-1 ring-gray-200 shadow-xl shadow-blue-900/10 p-3 opacity-95">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-[10px] font-black grid place-items-center">CN</div>
          <div>
            <p className="text-[10px] font-semibold leading-tight">Ndlovu</p>
            <p className="text-[8px] text-gray-500 uppercase font-bold tracking-tight">Chipo · Form 3</p>
          </div>
          <span className="ml-auto text-lg font-black tracking-tighter text-gray-900">92</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div className="bg-emerald-500 h-1" style={{ width: '92%' }} />
        </div>
        <p className="text-[8px] text-emerald-600 font-black uppercase tracking-tight mt-1.5">Active : Quadratics</p>
      </div>

      <div className="kundai-floater-left hidden lg:block absolute bottom-10 left-[-30px] w-60 bg-white rounded-lg ring-1 ring-gray-200 shadow-xl shadow-blue-900/10 p-3 opacity-95">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] font-black uppercase tracking-tight text-gray-700">Performance · 3B</p>
          <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">LIVE</span>
        </div>
        {[['Farai S.', 81, 'text-emerald-500'], ['Tatenda B.', 64, 'text-blue-500'], ['Rumbi P.', 47, 'text-blue-500']].map(([n, s, c]) => (
          <div key={n} className="flex items-center justify-between py-0.5">
            <p className="text-[10px] font-medium text-gray-700">{n}</p>
            <span className={`text-[10px] font-black ${c}`}>{s}%</span>
          </div>
        ))}
      </div>

      <div className="kundai-floater-toast hidden xl:flex absolute top-[55%] right-8 w-44 items-center gap-2 bg-white rounded-lg ring-1 ring-emerald-200 shadow-lg shadow-emerald-900/5 p-2.5">
        <div className="w-6 h-6 rounded-md bg-emerald-50 grid place-items-center shrink-0">
          <Sparkles size={12} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-900 leading-tight">Plan generated</p>
          <p className="text-[8px] text-gray-500">Algebra · 12 steps</p>
        </div>
      </div>
    </div>
  );
}

// ─── Mini dashboard preview (hero) ───
function DashboardPreview() {
  return (
    <div className="bg-white rounded-xl shadow-2xl shadow-blue-900/10 ring-1 ring-gray-200 p-4 w-full">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 grid place-items-center text-white text-[10px] font-black">K</div>
          <span className="text-[11px] font-bold tracking-tight text-gray-800">FORM 3B · MATHEMATICS</span>
        </div>
        <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wide">Live</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-tighter text-gray-700 text-center mb-2">STUDENT DEVELOPMENT</p>
          <div className="flex items-start mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white text-xs font-black grid place-items-center">TM</div>
            <div className="ml-2">
              <p className="text-[11px] font-semibold leading-tight">Moyo</p>
              <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tight">Tendai</p>
              <div className="flex items-end">
                <span className="text-lg font-black mr-1 tracking-tighter leading-none">78</span>
                <span className="text-[9px] font-bold text-gray-400 leading-none">OVR</span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Form 3</p>
              <p className="text-[8px] text-blue-500 font-black uppercase tracking-tighter mt-0.5">3 Plans</p>
              <p className="text-[8px] text-emerald-500 font-black uppercase tracking-tighter">Active : Algebra</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '86%' }} />
          </div>
          <div className="flex justify-between mt-2">
            {['Algebra', 'Geom', 'Trig', 'Stats'].map((u, i) => {
              const v = [82, 64, 71, 38][i];
              return (
                <div key={u} className="flex flex-col items-center">
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">{u}</p>
                  <p className={`text-[10px] font-black leading-none mt-0.5 ${v > 75 ? 'text-emerald-500' : v > 40 ? 'text-blue-500' : 'text-rose-500'}`}>{v}%</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-tight">Performance</h3>
            <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wide">3B</span>
          </div>
          <p className="text-[9px] font-black text-blue-600 uppercase mb-2">Latest: Quadratics Test</p>
          {[['Chipo Ndlovu', 92], ['Farai Sibanda', 81], ['Tatenda Banda', 64], ['Rumbi Phiri', 47]].map(([n, s]) => (
            <div key={n} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
              <p className="text-[10px] font-medium truncate">{n}</p>
              <span className="text-[10px] font-bold">{s}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── WhatsApp phone mockup ───
const MISSION_MESSAGES = [
  { id: 1, from: 'kundai',  text: 'Hie Tapiwa! 👋', time: '10:42 AM' },
  { id: 2, from: 'kundai',  text: 'Your Kundai AI has flagged something important regarding your Statistics performance. 📊', time: '10:42 AM' },
  { id: 3, from: 'kundai',  text: '🎯 MISSION BRIEFING — CLASSIFIED\n\nAgent Tapiwa, your Statistics score has dropped to 38%. The team at Kundai has assembled a 14-step development plan specifically for you.', time: '10:42 AM' },
  { id: 4, from: 'kundai',  text: 'Your mission, should you choose to accept it:\n\n✅ Probability trees — 5 sessions\n✅ Data interpretation — 4 sessions\n✅ Past paper drills — 5 sessions\n\nTarget: 70%+ by end of term. The fate of your report card rests in your hands. ⏱️', time: '10:43 AM' },
  { id: 5, from: 'tapiwa',  text: '🔥 Mission accepted. Let\'s go!', time: '10:43 AM' },
  { id: 6, from: 'kundai',  text: 'Outstanding. Your plan is now active in the Kundai app. First session unlocks tomorrow at 7AM. Good luck — we believe in you. 💪\n\nThis message will self-destruct in... just kidding 😄', time: '10:44 AM' },
];

function PhoneMockup({ started }) {
  const [messages, setMessages] = useState([
    { ...MISSION_MESSAGES[0], visible: true, typed: MISSION_MESSAGES[0].text, done: true },
  ]);
  const [status, setStatus] = useState('Your academic assistant');
  const [showTyping, setShowTyping] = useState(false);
  const seqRef = useRef(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!started || seqRef.current) return;
    seqRef.current = true;

    const remaining = MISSION_MESSAGES.slice(1);
    let cursor = 0;

    const typeMsg = (idx, fullText, resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setMessages(prev => prev.map(m => m.id === idx + 2
          ? { ...m, typed: fullText.substring(0, i), done: i >= fullText.length }
          : m
        ));
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        if (i >= fullText.length) { clearInterval(interval); resolve(); }
      }, 22);
    };

    const runNext = () => {
      if (cursor >= remaining.length) {
        setStatus('online');
        setShowTyping(false);
        return;
      }
      const cfg = remaining[cursor++];
      setStatus('typing...');
      setShowTyping(true);
      const typingDelay = cfg.from === 'tapiwa' ? 900 : 1300;
      setTimeout(() => {
        setShowTyping(false);
        setMessages(prev => [...prev, { ...cfg, visible: true, typed: '', done: false }]);
        setTimeout(() => {
          new Promise(res => typeMsg(cfg.id - 1, cfg.text, res)).then(() => {
            setTimeout(runNext, cfg.from === 'tapiwa' ? 600 : 800);
          });
        }, 80);
      }, typingDelay);
    };

    setTimeout(runNext, 400);
  }, [started]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, showTyping]);

  return (
    <div style={{ fontFamily: "'Inter Tight', Inter, system-ui, sans-serif" }}>
      <div className="mx-auto" style={{ width: 240, position: 'relative' }}>
        <div style={{ background: '#1a1a2e', borderRadius: '28px 28px 0 0', padding: '10px 16px 6px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 56, height: 5, borderRadius: 4, background: '#333' }} />
        </div>

        <div style={{ background: '#e5ddd5', borderLeft: '3px solid #1a1a2e', borderRight: '3px solid #1a1a2e', display: 'flex', flexDirection: 'column', height: 420, overflow: 'hidden' }}>
          <div style={{ background: '#075e54', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#25D366', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#075e54' }}>K</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.2 }}>KundAI</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', margin: 0 }}>{status}</p>
            </div>
          </div>

          <div ref={bodyRef} style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', scrollbarWidth: 'none' }}>
            <div style={{ textAlign: 'center', margin: '2px 0' }}>
              <span style={{ fontSize: 10, background: 'rgba(0,0,0,.12)', color: '#555', padding: '2px 10px', borderRadius: 20 }}>Today</span>
            </div>

            {messages.map(msg => (
              <div key={msg.id} className="kundai-msg-pop" style={{ display: 'flex', justifyContent: msg.from === 'tapiwa' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '82%' }}>
                  <div style={{
                    background: msg.from === 'tapiwa' ? '#dcf8c6' : 'white',
                    borderRadius: msg.from === 'tapiwa' ? '10px 0 10px 10px' : '0 10px 10px 10px',
                    padding: '7px 10px',
                  }}>
                    <p style={{ fontSize: 11, color: '#111', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                      {msg.typed}{!msg.done && <span className="kundai-cursor" />}
                    </p>
                  </div>
                  <p style={{ fontSize: 9, color: '#94a3b8', margin: '2px 4px 0', textAlign: msg.from === 'tapiwa' ? 'right' : 'left' }}>{msg.time}</p>
                </div>
              </div>
            ))}

            {showTyping && (
              <div className="kundai-msg-pop" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'white', borderRadius: '0 10px 10px 10px', padding: '8px 12px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span className="kundai-typing-dot" />
                  <span className="kundai-typing-dot" />
                  <span className="kundai-typing-dot" />
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#f0f0f0', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, borderTop: '.5px solid #d0d0d0' }}>
            <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: '5px 12px' }}>
              <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>Type a message</p>
            </div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#25D366', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
          </div>
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: '0 0 28px 28px', padding: '8px 16px 14px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 80, height: 4, borderRadius: 4, background: '#444' }} />
        </div>
      </div>
    </div>
  );
}

// ─── How It Works section ───
function HowItWorks() {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [statsScore, setStatsScore] = useState(38);
  const [showAlert, setShowAlert] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t1 = setTimeout(() => setShowAlert(true), 600);
    const t2 = setTimeout(() => {
      setShowAlert(false);
      setTimeout(() => { setShowPlan(true); setPlanGenerated(true); }, 300);
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible]);

  useEffect(() => {
    if (!planGenerated) return;
    const iv = setInterval(() => {
      setStatsScore(s => s < 62 ? s + 1 : s);
    }, 1800);
    return () => clearInterval(iv);
  }, [planGenerated]);

  const scoreColor = (v) => v >= 70 ? 'text-emerald-600' : v >= 50 ? 'text-blue-600' : 'text-red-500';

  return (
    <section ref={sectionRef} className="relative bg-white/70 backdrop-blur-sm border-y border-gray-200/70">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / .25) 1px, transparent 1.2px)', backgroundSize: '24px 24px' }}
      />
      <div className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">How it works</p>
          <h2 className="text-4xl font-black tracking-tighter text-gray-900">From insight to action — instantly.</h2>
          <p className="mt-3 text-gray-600">Kundai spots a gap, builds a plan, and the student gets the brief — right on their phone.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left — dashboard card */}
          <div className={visible ? 'kundai-fade-up-1' : 'opacity-0'}>
            <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 grid place-items-center text-white text-[10px] font-black">K</div>
                  <span className="text-[11px] font-bold tracking-tight text-gray-800">FORM 3B · MATHEMATICS</span>
                </div>
                <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wide">Live</span>
              </div>

              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white text-xs font-black grid place-items-center flex-shrink-0">TM</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-sm font-bold text-gray-900">Tapiwa Moyo</p>
                    <span className="text-xl font-black tracking-tight text-gray-900">78</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-2">
                    <div className="kundai-bar-fill bg-green-500 h-1.5 rounded-full" style={{ width: '86%' }} />
                  </div>
                  <div className="flex justify-between">
                    {[['Algebra', 82], ['Geom', 64], ['Trig', 71], ['Stats', statsScore]].map(([label, val]) => (
                      <div key={label} className="text-center">
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mb-0.5">{label}</p>
                        <p className={`text-[11px] font-black ${scoreColor(val)}`}>{val}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ minHeight: 80 }}>
                {showAlert && !showPlan && (
                  <div className="kundai-fade-up-1 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-wide text-amber-800">Kundai detected a gap</p>
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Stats score dropped to <strong>38%</strong> — below class average of 71%. Weak on probability trees and data interpretation.
                    </p>
                  </div>
                )}
                {showPlan && (
                  <div className="kundai-fade-up-1 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                      <p className="text-[11px] font-black text-emerald-800">Plan generated — 14 steps · Stats focus</p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {['Probability trees', 'Data interpretation', 'Past papers'].map(tag => (
                        <span key={tag} className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      Student notified via WhatsApp <ArrowRight size={10} />
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — phone */}
          <div className={`flex justify-center ${visible ? 'kundai-fade-up-2' : 'opacity-0'}`}>
            <PhoneMockup started={planGenerated} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stat counter hook ───
function useCountUp(target, suffix, started, duration = 1600) {
  const [display, setDisplay] = useState(`0${suffix}`);
  const ran = useRef(false);
  useEffect(() => {
    if (!started || ran.current) return;
    ran.current = true;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * target);
      const formatted = suffix === 'k+' ? (val >= 1000 ? `${Math.round(val / 100) / 10}k+` : `${val}`) : `${val}${suffix}`;
      setDisplay(formatted);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started]);
  return display;
}

// ─── Landing Page ───
function LandingPage() {
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const schools  = useCountUp(28,    '',   statsVisible, 1400);
  const students = useCountUp(12000, 'k+', statsVisible, 1600);
  const passRate = useCountUp(94,    '%',  statsVisible, 1800);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
    }, { threshold: 0.5 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="relative text-gray-900 min-h-screen" style={{ fontFamily: "'Inter Tight', Inter, system-ui, sans-serif", background: '#f1f5f9' }}>
      <style>{GLOBAL_CSS}</style>

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgb(148 163 184 / .35) 1px, transparent 1.2px)', backgroundSize: '24px 24px' }}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-gray-200/70">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 grid place-items-center font-black text-white text-sm">K</div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Kundai</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <a className="hover:text-gray-900 transition-colors" href="#features">Features</a>
            <a className="hover:text-gray-900 transition-colors" href="#how">How it works</a>
            <a className="hover:text-gray-900 transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-gray-900 transition-colors" href="#contact">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 transition-colors">Sign in</button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors">Start free trial</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full bg-sky-200/30 blur-3xl" />
        </div>

        <HeroFloaters />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
              <Zap size={10} className="fill-blue-700" />
              Built for Zimbabwean schools
            </div>
            <h1 className="mt-5 text-5xl sm:text-6xl font-black tracking-tighter leading-[1.02] text-gray-900">
              Every student,<br />
              <span className="text-blue-600">elevated</span> by AI.
            </h1>
            <p className="mt-6 text-gray-600 text-lg max-w-xl leading-relaxed">
              Kundai brings AI-powered tutoring, automated marking and deep analytics to
              primary and secondary schools — all in one platform built for the African classroom.
            </p>
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg text-base transition-colors shadow-md shadow-blue-600/20">
                Start free trial <ArrowRight size={16} />
              </button>
              <button className="flex items-center gap-2 border border-gray-200 bg-white hover:border-gray-300 text-gray-800 font-semibold px-5 py-3 rounded-lg text-base transition-colors">
                See plans <ChevronRight size={16} />
              </button>
            </div>

            <div ref={statsRef} className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { val: schools,  label: 'Schools',        c: 'text-blue-600' },
                { val: students, label: 'Students',       c: 'text-emerald-500' },
                { val: passRate, label: 'Pass-rate lift', c: 'text-blue-600' },
              ].map(({ val, label, c }) => (
                <div key={label}>
                  <p className={`text-3xl font-black tracking-tighter leading-none ${c}`}>{val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -top-3 left-4 text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-2 py-1 rounded-md ring-1 ring-blue-200 shadow-sm z-10">
              A glimpse of your dashboard
            </div>
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative bg-white/70 backdrop-blur-sm border-y border-gray-200/70">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-12">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">What's inside</p>
            <h2 className="text-4xl font-black tracking-tighter text-gray-900">Everything your school needs.</h2>
            <p className="mt-3 text-gray-600">Powerful tools for teachers, students, and administrators — all in one calm, fast interface.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => {
              const t = FEATURE_TONES[i % FEATURE_TONES.length];
              return (
                <div key={title} className={`bg-white rounded-lg shadow-sm ring-1 ring-gray-100 p-5 hover:shadow-md transition-all ${t.ring}`}>
                  <div className={`w-10 h-10 rounded-lg ${t.bg} grid place-items-center mb-4`}>
                    <Icon size={20} className={t.fg} />
                  </div>
                  <h3 className="text-gray-900 font-bold tracking-tight mb-1.5">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <div id="how"><HowItWorks /></div>

      {/* Pricing */}
      <section id="pricing" className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Pricing</p>
          <h2 className="text-4xl font-black tracking-tighter text-gray-900">Pay per student. No surprises.</h2>
          <p className="mt-3 text-gray-600">One transparent termly fee. Start free for 30 days — no card required.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {MOCK_PACKAGES.map((pkg, idx) => {
            const featured = pkg.featured;
            const t = TIER[idx % TIER.length];
            const termlyMax = pkg.studentLimit * pkg.pricePerStudent;
            return (
              <div key={pkg._id} className={`relative rounded-xl p-6 flex flex-col transition-all bg-white ${featured ? `shadow-xl shadow-blue-600/15 ring-2 ${t.ring}` : `shadow-sm ring-1 ring-gray-100 ${t.hoverRing} hover:shadow-md`}`}>
                {featured && (
                  <span className={`absolute -top-2.5 right-5 text-[9px] font-black ${t.btnBase} text-white px-2 py-0.5 rounded uppercase tracking-widest shadow-sm`}>Most popular</span>
                )}
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${t.eyebrow}`}>{pkg.type}</p>
                <p className="text-gray-900 text-xl font-bold tracking-tight">{pkg.name}</p>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className={`text-5xl font-black tracking-tighter ${t.price}`}>${pkg.pricePerStudent.toFixed(2)}</span>
                  <span className="text-gray-500 text-sm">/ student / term</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-tight text-gray-500 mt-1">Up to {pkg.studentLimit.toLocaleString()} students · ${termlyMax.toLocaleString()} max/term</p>
                <div className="my-5 border-t border-gray-100" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle size={14} className={`mt-0.5 shrink-0 ${t.check}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${t.btn} shadow-sm`}>
                  Start free trial <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div id="contact" className="mt-10 bg-white/70 backdrop-blur-sm rounded-xl ring-1 ring-gray-200/70 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-gray-900 font-bold tracking-tight">Need a custom plan?</h3>
            <p className="text-gray-600 text-sm mt-1">District pricing from $0.45/student for multi-school groups and large institutions.</p>
          </div>
          <a href="mailto:hello@kundai.ac.zw" className="inline-flex items-center gap-2 bg-white ring-1 ring-gray-200 hover:ring-blue-300 text-blue-700 hover:text-blue-800 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
            <Mail size={14} /> hello@kundai.ac.zw
          </a>
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative bg-white/70 backdrop-blur-sm border-y border-gray-200/70">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { Icon: ShieldCheck, t: 'POPIA-aligned',     s: 'Data stays in-country',     c: 'text-blue-600',    bg: 'bg-blue-50' },
            { Icon: TrendingUp,  t: '+18% pass rate',    s: 'Avg. across pilot schools', c: 'text-emerald-600', bg: 'bg-emerald-50' },
            { Icon: Sparkles,    t: 'Setup in 1 day',    s: 'No IT team required',       c: 'text-sky-600',     bg: 'bg-sky-50' },
            { Icon: Mail,        t: '30-day free trial', s: 'No credit card',            c: 'text-indigo-600',  bg: 'bg-indigo-50' },
          ].map(({ Icon, t, s, c, bg }) => (
            <div key={t} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} grid place-items-center shrink-0`}>
                <Icon size={16} className={c} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 tracking-tight">{t}</p>
                <p className="text-xs text-gray-500">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-blue-600 px-10 py-14 text-center" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.18), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.12), transparent 40%)' }}>
          <h2 className="text-4xl font-black tracking-tighter text-white">Ready to transform your school?</h2>
          <p className="mt-3 text-blue-100">Start a 30-day free trial. No credit card required.</p>
          <button className="mt-7 bg-white hover:bg-gray-50 text-blue-700 font-semibold px-6 py-3 rounded-lg text-base transition-colors inline-flex items-center gap-2 shadow-lg shadow-blue-900/20">
            Get started for free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-200/70 py-8 bg-white/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 grid place-items-center font-black text-white text-[10px]">K</div>
            <span>© 2026 Kundai Education Technologies</span>
          </div>
          <div className="flex gap-5">
            <a className="hover:text-gray-900 transition-colors" href="#">Sign in</a>
            <a className="hover:text-gray-900 transition-colors" href="#">Register</a>
            <a className="hover:text-gray-900 transition-colors" href="mailto:hello@kundai.ac.zw">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

window.LandingPage = LandingPage;
})();
