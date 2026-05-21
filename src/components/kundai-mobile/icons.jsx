// Lucide-style icons inlined as React components (subset used on landing/register)
const ico = (path, props = {}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth ?? 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={props.size ?? 16}
    height={props.size ?? 16}
    className={props.className}
    style={props.style}
  >
    {path}
  </svg>
);

const Brain      = (p) => ico(<><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 19.5z"/><path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1 1.32 4.24 3 3 0 0 1-.34 5.58 2.5 2.5 0 0 1-2.96 3.08 2.5 2.5 0 0 1-4.91.05L12 19.5z"/></>, p);
const BarChart2  = (p) => ico(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6"  y1="20" x2="6"  y2="14"/></>, p);
const BookOpen   = (p) => ico(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>, p);
const Users2     = (p) => ico(<><path d="M14 19a6 6 0 0 0-12 0"/><circle cx="8" cy="9" r="4"/><path d="M22 19a6 6 0 0 0-6-6 4 4 0 1 0 0-8"/></>, p);
const CheckCircle= (p) => ico(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>, p);
const ChevronRight=(p) => ico(<polyline points="9 18 15 12 9 6"/>, p);
const Zap        = (p) => ico(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>, p);
const Mail       = (p) => ico(<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></>, p);
const ArrowRight = (p) => ico(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>, p);
const ArrowLeft  = (p) => ico(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>, p);
const Eye        = (p) => ico(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>, p);
const EyeOff     = (p) => ico(<><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></>, p);
const Loader2    = (p) => ico(<path d="M21 12a9 9 0 1 1-6.219-8.56"/>, p);
const Sparkles   = (p) => ico(<><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4z"/><path d="M19 14l.8 2 2 .8-2 .8L19 20l-.8-1.4-2-.8 2-.8z"/><path d="M5 4l.5 1.4 1.5.6-1.5.6L5 8l-.5-1.4L3 6l1.5-.6z"/></>, p);
const ShieldCheck= (p) => ico(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>, p);
const TrendingUp = (p) => ico(<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>, p);
const AlertTriangle = (p) => ico(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, p);

window.Icons = { Brain, BarChart2, BookOpen, Users2, CheckCircle, ChevronRight, Zap, Mail, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, TrendingUp, AlertTriangle };
