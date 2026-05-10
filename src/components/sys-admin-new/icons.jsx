// Inline SVG icons — outlined, 1.6 stroke. Stroke-based for crispness.
const Icon = ({ d, size = 16, stroke = 1.6, fill = 'none', children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children || <path d={d} />}
  </svg>
);

const I = {
  Dashboard: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></Icon>,
  Building:  (p) => <Icon {...p}><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M9 7h2"/><path d="M9 11h2"/><path d="M9 15h2"/></Icon>,
  Package:   (p) => <Icon {...p}><path d="m7.5 4.27 9 5.15"/><path d="M21 8 12 13 3 8"/><path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8"/><path d="m3 8 9-5 9 5"/><path d="M12 22V13"/></Icon>,
  Card:      (p) => <Icon {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Icon>,
  ShieldCheck:(p)=> <Icon {...p}><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="m9 12 2 2 4-4"/></Icon>,
  Search:    (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>,
  Bell:      (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>,
  ChevronDown:(p)=> <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  ChevronRight:(p)=><Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  ChevronLeft:(p)=> <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>,
  ArrowUp:   (p) => <Icon {...p}><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></Icon>,
  Plus:      (p) => <Icon {...p}><path d="M12 5v14"/><path d="M5 12h14"/></Icon>,
  Filter:    (p) => <Icon {...p}><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></Icon>,
  Download:  (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></Icon>,
  Users:     (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>,
  GradCap:   (p) => <Icon {...p}><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></Icon>,
  Sparkles:  (p) => <Icon {...p}><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m5.6 5.6 2.1 2.1"/><path d="m16.3 16.3 2.1 2.1"/><path d="m5.6 18.4 2.1-2.1"/><path d="m16.3 7.7 2.1-2.1"/></Icon>,
  TrendUp:   (p) => <Icon {...p}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></Icon>,
  Alert:     (p) => <Icon {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></Icon>,
  Check:     (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>,
  Clock:     (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  School:    (p) => <Icon {...p}><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17"/><path d="m4 6 8-4 8 4"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></Icon>,
  Settings:  (p) => <Icon {...p}><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></Icon>,
  TrendDown: (p) => <Icon {...p}><path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/></Icon>,
  X:         (p) => <Icon {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Icon>,
  More:      (p) => <Icon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icon>,
  Mail:      (p) => <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></Icon>,
  Phone:     (p) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>,
  MapPin:    (p) => <Icon {...p}><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  Calendar:  (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></Icon>,
  Server:    (p) => <Icon {...p}><rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><path d="M6 7h.01"/><path d="M6 17h.01"/></Icon>,
  Receipt:   (p) => <Icon {...p}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 2V2L19 4l-3-2-3 2-3-2-3 2L4 2z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></Icon>,
  Slider:    (p) => <Icon {...p}><path d="M4 6h16"/><circle cx="9" cy="6" r="2.5" fill="#0b1220"/><path d="M4 12h16"/><circle cx="15" cy="12" r="2.5" fill="#0b1220"/><path d="M4 18h16"/><circle cx="7" cy="18" r="2.5" fill="#0b1220"/></Icon>,
  Star:      (p) => <Icon {...p}><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></Icon>,
  Edit:      (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z"/></Icon>,
  Trash:     (p) => <Icon {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Icon>,
  Eye:       (p) => <Icon {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Logout:    (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></Icon>,
  Refresh:   (p) => <Icon {...p}><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/></Icon>,
  Pulse:     (p) => <Icon {...p}><path d="M22 12h-4l-3 9-6-18-3 9H2"/></Icon>,
  Cpu:       (p) => <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></Icon>,
};
window.I = I;
