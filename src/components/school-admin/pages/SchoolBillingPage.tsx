import React, { useEffect, useRef, useState } from 'react';
import { fetchData } from '../../../services/apiClient';

// ── Types ────────────────────────────────────────────────────────────────────
interface BillingPackage {
  _id: string;
  name: string;
  type: 'prepaid' | 'custom';
  studentLimit: number;
  pricePerStudent: number;
  totalPrice: number;
  billingCycle: 'monthly' | 'termly' | 'annually';
  features: string[];
}

interface BillingSubscription {
  _id: string;
  status: 'trial' | 'active' | 'suspended' | 'expired' | 'cancelled' | 'pending_payment';
  billingCycle: 'monthly' | 'termly' | 'annually';
  studentLimit: number;
  startDate: string;
  endDate: string;
  amountDue: number;
  amountPaid: number;
  paymentRef?: string;
  lastPaynowStatus?: string;
  notes?: string;
  package: BillingPackage | null;
}

interface BillingData {
  school: { _id: string; name: string; email: string; phone?: string; address?: string } | null;
  subscription: BillingSubscription | null;
  studentCount: number;
  packages: BillingPackage[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function cycleLong(c: string) {
  return c === 'termly' ? 'per term' : c === 'annually' ? 'per year' : 'per month';
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  trial:           { color: 'var(--gold-deep)',    bg: 'var(--gold-soft)',       label: 'Free Trial' },
  active:          { color: 'var(--forest)',        bg: 'var(--forest-soft)',     label: 'Active' },
  suspended:       { color: 'var(--terracotta)',    bg: 'var(--terracotta-soft)', label: 'Suspended' },
  expired:         { color: 'var(--terracotta)',    bg: 'var(--terracotta-soft)', label: 'Expired' },
  cancelled:       { color: 'var(--ink-3)',         bg: 'var(--paper-shade)',     label: 'Cancelled' },
  pending_payment: { color: 'var(--gold-deep)',     bg: 'var(--gold-soft)',       label: 'Awaiting Payment' },
};

// ── Seat capacity bar ────────────────────────────────────────────────────────
function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const accent = pct > 90 ? 'terracotta' : pct > 75 ? 'gold' : 'forest';
  return (
    <div>
      <div style={{ height: 8, background: 'var(--paper-shade)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--rule-soft)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `var(--${accent})`, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11.5, color: 'var(--ink-3)' }}>
        <span><b style={{ color: 'var(--ink-1)', fontFeatureSettings: "'tnum' 1" }}>{used.toLocaleString()}</b> students enrolled</span>
        <span style={{ fontFeatureSettings: "'tnum' 1" }}>{total.toLocaleString()} seat limit · {Math.round(pct)}% used</span>
      </div>
    </div>
  );
}

// ── Payment modal ─────────────────────────────────────────────────────────────
type PayStep = 'method' | 'phone' | 'processing' | 'polling' | 'innbucks' | 'otp' | 'done';

const PAY_METHODS = [
  { id: 'ecocash',   label: 'EcoCash',            group: 'mobile' },
  { id: 'onemoney',  label: 'OneMoney',           group: 'mobile' },
  { id: 'innbucks',  label: 'InnBucks',           group: 'mobile' },
  { id: 'omari',     label: "O'mari",             group: 'mobile' },
  { id: 'vmc',       label: 'Visa / Mastercard',  group: 'card'   },
  { id: 'zimswitch', label: 'Zimswitch',          group: 'card'   },
  { id: 'web',       label: 'Paynow web checkout',group: 'web'    },
] as const;

function Spinner() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function PaymentModal({ pkg, onClose, onPaid }: { pkg: BillingPackage; onClose: () => void; onPaid: () => void }) {
  const [step, setStep]               = useState<PayStep>('method');
  const [method, setMethod]           = useState('');
  const [phone, setPhone]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [err, setErr]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [reference, setReference]     = useState('');
  const [subscriptionId, setSubId]    = useState('');
  // InnBucks
  const [authCode, setAuthCode]       = useState('');
  const [deepLink, setDeepLink]       = useState('');
  const [qrCode, setQrCode]           = useState('');
  // O'mari
  const [remoteotpurl, setRemoteOtpUrl]   = useState('');
  const [otpreference, setOtpReference]   = useState('');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (ref: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const r: any = await fetchData(`/paynow/status?ref=${encodeURIComponent(ref)}`);
        if (r.paid) {
          stopPolling();
          setStep('done');
        } else if (r.status === 'cancelled' || r.status === 'failed') {
          stopPolling();
          setErr('Payment was cancelled. You can try again with a different method or number.');
          setStep('phone');
        }
      } catch {
        // silently retry
      }
    }, 3000);
  };

  // Calls /admin/billing/initiate to create the pending subscription and returns
  // { redirectUrl, reference, subscriptionId }.
  const initiate = async () => {
    const res: any = await fetchData('/admin/billing/initiate', {
      method: 'POST',
      body: JSON.stringify({ packageId: pkg._id }),
    });
    setReference(res.reference);
    setSubId(res.subscriptionId);
    return res as { redirectUrl: string; reference: string; subscriptionId: string };
  };

  const handleSelectMethod = async (m: string) => {
    setMethod(m);
    setErr('');

    if (m === 'web') {
      setLoading(true);
      setStep('processing');
      try {
        const res = await initiate();
        window.location.href = res.redirectUrl;
      } catch (e: any) {
        setErr(e.message ?? 'Failed to initiate payment');
        setStep('method');
        setLoading(false);
      }
      return;
    }

    if (m === 'vmc' || m === 'zimswitch') {
      setStep('processing');
      setLoading(true);
      try {
        const { reference: ref, subscriptionId: subId } = await initiate();
        await fetchData('/paynow/express/card', {
          method: 'POST',
          body: JSON.stringify({ method: m, subscriptionId: subId }),
        });
        setStep('polling');
        startPolling(ref);
      } catch (e: any) {
        setErr(e.message ?? 'Card payment failed');
        setStep('method');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mobile methods: go to phone input step
    setStep('phone');
  };

  const handleMobilePay = async () => {
    if (!phone.trim()) { setErr('Phone number is required'); return; }
    setLoading(true);
    setErr('');
    setStep('processing');

    try {
      const { reference: ref, subscriptionId: subId } = await initiate();

      if (method === 'ecocash' || method === 'onemoney') {
        await fetchData('/paynow/express/mobile', {
          method: 'POST',
          body: JSON.stringify({ phone: phone.trim(), method, subscriptionId: subId }),
        });
        setStep('polling');
        startPolling(ref);

      } else if (method === 'innbucks') {
        const r: any = await fetchData('/paynow/express/innbucks', {
          method: 'POST',
          body: JSON.stringify({ phone: phone.trim(), subscriptionId: subId }),
        });
        setAuthCode(r.authorizationCode ?? '');
        setDeepLink(r.deepLinkUrl ?? '');
        setQrCode(r.qrCode ?? '');
        setStep('innbucks');
        startPolling(ref);

      } else if (method === 'omari') {
        const r: any = await fetchData('/paynow/express/omari', {
          method: 'POST',
          body: JSON.stringify({ phone: phone.trim(), subscriptionId: subId }),
        });
        setRemoteOtpUrl(r.remoteotpurl ?? '');
        setOtpReference(r.otpreference ?? '');
        setStep('otp');
      }
    } catch (e: any) {
      setErr(e.message ?? 'Payment initiation failed');
      setStep('phone');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim()) { setErr('OTP is required'); return; }
    setLoading(true);
    setErr('');
    setStep('processing');
    try {
      await fetchData('/paynow/express/omari/otp', {
        method: 'POST',
        body: JSON.stringify({ remoteotpurl, otp: otp.trim() }),
      });
      setStep('polling');
      startPolling(reference);
    } catch (e: any) {
      setErr(e.message ?? 'Invalid OTP');
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopPolling();
    onClose();
  };

  const handleDone = () => {
    onPaid();
    onClose();
  };

  // ── Shared modal shell ────────────────────────────────────────────────────
  const canClose = !loading && step !== 'processing';

  const shell = (title: string, subtitle: string, body: React.ReactNode) => (
    <>
      <div onClick={canClose ? handleClose : undefined} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 460, background: 'var(--paper)', borderRadius: 8, border: '1px solid var(--rule)', zIndex: 50, boxShadow: '0 8px 40px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>{title}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>{subtitle}</p>
          </div>
          {canClose && (
            <button onClick={handleClose} style={{ padding: 6, background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', color: 'var(--ink-2)', lineHeight: 0 }}>
              <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14" /></svg>
            </button>
          )}
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {body}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </>
  );

  // ── Order summary reused across steps ────────────────────────────────────
  const orderSummary = (
    <div style={{ padding: '12px 14px', background: 'var(--paper-shade)', borderRadius: 6, border: '1px solid var(--rule-soft)' }}>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>Order summary</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 700, color: 'var(--ink-1)' }}>{pkg.name}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 700, color: 'var(--forest)' }}>${pkg.totalPrice.toFixed(2)}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
        {pkg.studentLimit.toLocaleString()} students · ${pkg.pricePerStudent}/student · {cycleLong(pkg.billingCycle)}
      </div>
    </div>
  );

  const errBanner = err ? (
    <div style={{ padding: '8px 12px', background: 'var(--terracotta-soft)', borderRadius: 5, color: 'var(--terracotta)', fontSize: 12 }}>{err}</div>
  ) : null;

  // ── Step: method selection ────────────────────────────────────────────────
  if (step === 'method') {
    const groups = [
      { label: 'Mobile wallets', ids: ['ecocash', 'onemoney', 'innbucks', 'omari'] },
      { label: 'Card (saved token required)', ids: ['vmc', 'zimswitch'] },
      { label: 'Web checkout', ids: ['web'] },
    ];

    return shell(
      `Upgrade to ${pkg.name}`,
      'Choose a payment method to continue',
      <>
        {orderSummary}
        {errBanner}
        {groups.map(grp => (
          <div key={grp.label}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>{grp.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {PAY_METHODS.filter(m => grp.ids.includes(m.id)).map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMethod(m.id)}
                  style={{ padding: '10px 12px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', fontFamily: 'inherit', textAlign: 'left', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--forest)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          Card express checkout requires a saved card token. If you haven't paid by card before, choose <b>Paynow web checkout</b> first — your card will be saved for future express payments.
        </p>
      </>
    );
  }

  // ── Step: phone input ─────────────────────────────────────────────────────
  if (step === 'phone') {
    const methodLabel = PAY_METHODS.find(m => m.id === method)?.label ?? method;
    return shell(
      methodLabel,
      'Enter the mobile number registered with this wallet',
      <>
        {orderSummary}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Mobile number</label>
          <input
            type="tel"
            placeholder="e.g. 0771234567"
            value={phone}
            onChange={e => { setPhone(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handleMobilePay()}
            autoFocus
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${err ? 'var(--terracotta)' : 'var(--rule)'}`, borderRadius: 5, fontSize: 14, fontFamily: 'inherit', background: 'var(--paper)', color: 'var(--ink-1)', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        {errBanner}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => { setStep('method'); setErr(''); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'inherit' }}>Back</button>
          <button onClick={handleMobilePay} disabled={loading} style={{ padding: '8px 22px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading && <Spinner />}
            {loading ? 'Starting…' : 'Pay now'}
          </button>
        </div>
      </>
    );
  }

  // ── Step: processing ──────────────────────────────────────────────────────
  if (step === 'processing') {
    return shell(
      'Processing…',
      'Please wait while we connect to Paynow',
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 0' }}>
        <Spinner />
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Connecting to payment gateway…</span>
      </div>
    );
  }

  // ── Step: polling (EcoCash / OneMoney / Card) ─────────────────────────────
  if (step === 'polling') {
    const methodLabel = PAY_METHODS.find(m => m.id === method)?.label ?? method;
    return shell(
      'Waiting for payment',
      `${methodLabel} · ${reference}`,
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--forest-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s ease-in-out infinite' }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 4 }}>Awaiting confirmation</div>
          {phone && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>A payment prompt was sent to <b style={{ color: 'var(--ink-2)' }}>{phone}</b></div>}
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>Approve the prompt on your phone. This page will update automatically.</div>
        </div>
        <button onClick={handleClose} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'inherit' }}>
          Close and check later
        </button>
      </div>
    );
  }

  // ── Step: innbucks code display ───────────────────────────────────────────
  if (step === 'innbucks') {
    return shell(
      'InnBucks payment',
      `Reference: ${reference}`,
      <>
        <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 8 }}>Open InnBucks and enter this authorization code</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '0.15em', padding: '12px 16px', background: 'var(--paper-shade)', borderRadius: 7, border: '1px solid var(--rule-soft)', display: 'inline-block' }}>
            {authCode}
          </div>
        </div>

        {qrCode && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src={qrCode} alt="QR code" width={120} height={120} style={{ borderRadius: 6, border: '1px solid var(--rule-soft)' }} />
          </div>
        )}

        {deepLink && (
          <a
            href={deepLink}
            style={{ display: 'block', textAlign: 'center', padding: '9px 14px', background: 'var(--forest)', color: '#fbf8f1', borderRadius: 5, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            Open InnBucks app
          </a>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--paper-shade)', borderRadius: 5 }}>
          <Spinner />
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Waiting for payment confirmation…</span>
        </div>

        <button onClick={handleClose} style={{ padding: '7px 0', background: 'transparent', border: 0, cursor: 'pointer', fontSize: 12, color: 'var(--ink-3)', fontFamily: 'inherit', textAlign: 'center', width: '100%' }}>
          Close and check later
        </button>
      </>
    );
  }

  // ── Step: O'mari OTP ──────────────────────────────────────────────────────
  if (step === 'otp') {
    return shell(
      "O'mari — enter OTP",
      'A one-time password has been sent to your phone',
      <>
        {otpreference && (
          <div style={{ padding: '10px 12px', background: 'var(--paper-shade)', borderRadius: 5, fontSize: 12, color: 'var(--ink-3)' }}>
            OTP reference: <b style={{ color: 'var(--ink-2)', fontFamily: "'JetBrains Mono', monospace" }}>{otpreference}</b>
          </div>
        )}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Enter the OTP from your SMS</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 123456"
            value={otp}
            onChange={e => { setOtp(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handleOtpSubmit()}
            autoFocus
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${err ? 'var(--terracotta)' : 'var(--rule)'}`, borderRadius: 5, fontSize: 18, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.2em', background: 'var(--paper)', color: 'var(--ink-1)', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        {errBanner}
        <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          After 5 failed attempts Paynow will cancel this transaction and you will need to restart.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => { setStep('phone'); setErr(''); setOtp(''); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--rule)', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'inherit' }}>Back</button>
          <button onClick={handleOtpSubmit} disabled={loading} style={{ padding: '8px 22px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading && <Spinner />}
            {loading ? 'Verifying…' : 'Confirm OTP'}
          </button>
        </div>
      </>
    );
  }

  // ── Step: done ────────────────────────────────────────────────────────────
  if (step === 'done') {
    return shell(
      'Payment confirmed',
      'Your subscription is now active',
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--forest-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={24} height={24} viewBox="0 0 16 16" fill="none" stroke="var(--forest)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8l4 4 8-8" /></svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--forest)', marginBottom: 4 }}>Payment successful</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Your school now has full access to <b style={{ color: 'var(--ink-2)' }}>{pkg.name}</b>.</div>
        </div>
        <button onClick={handleDone} style={{ padding: '9px 28px', background: 'var(--forest)', color: '#fbf8f1', border: 0, borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          Done
        </button>
      </div>
    );
  }

  return null;
}

// ── Payment result banner ─────────────────────────────────────────────────────
function PaymentResultBanner({ paid, onDismiss }: { paid: boolean; onDismiss: () => void }) {
  if (paid) {
    return (
      <div style={{ padding: '14px 20px', background: 'var(--forest-soft)', border: '1px solid color-mix(in srgb, var(--forest) 30%, transparent)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--forest)', flexShrink: 0 }}><path d="M2 8l4 4 8-8" /></svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--forest)' }}>Payment successful — subscription activated!</div>
          <div style={{ fontSize: 12, color: 'var(--forest)', opacity: 0.8, marginTop: 2 }}>Your school now has full access to the new package.</div>
        </div>
        <button onClick={onDismiss} style={{ padding: 4, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--forest)', lineHeight: 0 }}>
          <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14" /></svg>
        </button>
      </div>
    );
  }
  return (
    <div style={{ padding: '14px 20px', background: 'var(--gold-soft)', border: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width={18} height={18} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold-deep)', flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" /><path d="M8 5v3M8 11v.5" />
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gold-deep)' }}>Payment not yet confirmed</div>
        <div style={{ fontSize: 12, color: 'var(--gold-deep)', opacity: 0.8, marginTop: 2 }}>If you completed payment, please wait a moment and refresh. Contact support if this persists.</div>
      </div>
      <button onClick={onDismiss} style={{ padding: 4, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--gold-deep)', lineHeight: 0 }}>
        <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l12 12M14 2L2 14" /></svg>
      </button>
    </div>
  );
}

// ── Package card ─────────────────────────────────────────────────────────────
function PackageCard({ pkg, isCurrent, onSelect }: { pkg: BillingPackage; isCurrent: boolean; onSelect: () => void }) {
  const accent = isCurrent ? 'forest' : 'plum';
  return (
    <div style={{ background: 'var(--paper)', border: `1px solid ${isCurrent ? 'var(--forest)' : 'var(--rule)'}`, borderRadius: 7, padding: '20px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}>
      {isCurrent && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--forest)' }} />
      )}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 17, fontWeight: 700, color: 'var(--ink-1)' }}>{pkg.name}</span>
          {isCurrent && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 700, background: 'var(--forest-soft)', color: 'var(--forest)' }}>Current plan</span>}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: `var(--${accent})`, letterSpacing: '-0.02em' }}>
          ${pkg.pricePerStudent}
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)', fontFamily: 'inherit', letterSpacing: 0 }}>/student/{cycleLong(pkg.billingCycle)}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
          Up to <b style={{ color: 'var(--ink-2)' }}>{pkg.studentLimit.toLocaleString()}</b> students · total ~<b style={{ color: 'var(--ink-2)' }}>${pkg.totalPrice}</b>/{cycleLong(pkg.billingCycle)}
        </div>
      </div>

      {pkg.features.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pkg.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--ink-2)' }}>
              <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: `var(--${accent})`, marginTop: 2, flexShrink: 0 }}><path d="M2 8l4 4 8-8" /></svg>
              {f}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onSelect}
        disabled={isCurrent}
        style={{ marginTop: 'auto', padding: '9px 14px', background: isCurrent ? 'var(--paper-shade)' : `var(--${accent})`, color: isCurrent ? 'var(--ink-3)' : '#fbf8f1', border: isCurrent ? '1px solid var(--rule)' : 0, borderRadius: 5, cursor: isCurrent ? 'default' : 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}
      >
        {isCurrent ? 'Your current plan' : `Upgrade to ${pkg.name}`}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const SchoolBillingPage: React.FC = () => {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentPkg, setPaymentPkg] = useState<BillingPackage | null>(null);
  const [paymentResult, setPaymentResult] = useState<{ paid: boolean } | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Load billing data
  const loadBilling = async () => {
    setLoading(true);
    setError('');
    try {
      const d: any = await fetchData('/admin/billing');
      setData(d);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load billing info');
    } finally {
      setLoading(false);
    }
  };

  // On mount: check if Paynow has redirected back with a payment reference
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const payment = params.get('payment');

    if (payment === 'complete' && ref) {
      // Clean up query params immediately
      window.history.replaceState({}, '', window.location.pathname);

      setVerifying(true);
      fetchData(`/admin/billing/verify?ref=${encodeURIComponent(ref)}`)
        .then((res: any) => {
          setPaymentResult({ paid: res.paid });
          if (res.billing) setData(res.billing);
        })
        .catch(() => setPaymentResult({ paid: false }))
        .finally(() => setVerifying(false));
    } else {
      loadBilling();
    }
  }, []);

  // If we handled the return but haven't loaded billing yet, load it
  useEffect(() => {
    if (paymentResult && !data) loadBilling();
  }, [paymentResult]);

  // Background poll: while subscription is pending_payment and no modal is open,
  // keep checking so "Close and check later" still auto-updates the page.
  useEffect(() => {
    const sub = data?.subscription;
    const ref = sub?.paymentRef;
    // Only poll when genuinely waiting for Paynow (no lastPaynowStatus means unresolved)
    if (!ref || sub?.status !== 'pending_payment' || sub?.lastPaynowStatus || paymentPkg) return;

    const id = setInterval(async () => {
      try {
        const r: any = await fetchData(`/paynow/status?ref=${encodeURIComponent(ref)}`);
        if (r.paid || r.status === 'cancelled' || r.status === 'failed') {
          clearInterval(id);
          loadBilling();
        }
      } catch { /* ignore transient errors */ }
    }, 5000);

    return () => clearInterval(id);
  }, [data, paymentPkg]);

  if (verifying) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Verifying payment…</div>;
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--terracotta)', fontSize: 13 }}>{error}</div>;
  if (!data) return null;

  const { school, subscription, studentCount, packages } = data;
  const sub = subscription;
  const pkg = sub?.package ?? null;
  const statusStyle = STATUS_STYLE[sub?.status ?? 'trial'] ?? STATUS_STYLE.trial;
  const daysLeft = sub?.endDate ? daysUntil(sub.endDate) : null;
  const seatsUsed = studentCount;
  const seatLimit = sub?.studentLimit ?? 0;
  const seatPct = seatLimit > 0 ? (seatsUsed / seatLimit) * 100 : 0;
  const currentPkgId = pkg?._id ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>Billing &amp; Subscription</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
          Manage your Kundai subscription, seat license, and package
        </p>
      </div>

      {/* Payment result banner */}
      {paymentResult && (
        <PaymentResultBanner paid={paymentResult.paid} onDismiss={() => setPaymentResult(null)} />
      )}

      {/* No subscription */}
      {!sub && (
        <div style={{ padding: '32px 28px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 8 }}>No active subscription</div>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-3)' }}>
            Choose a package below to get started.
          </p>
        </div>
      )}

      {/* Active subscription card */}
      {sub && (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, overflow: 'hidden' }}>
          {/* Status bar */}
          {sub.status === 'trial' && (
            <div style={{ padding: '12px 22px', background: 'var(--gold-soft)', borderBottom: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold-deep)', flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" /><path d="M8 5v3M8 11v.5" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold-deep)' }}>
                Free trial · {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'trial period'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--gold-deep)', opacity: 0.8 }}>— upgrade to keep your account active after the trial ends</span>
            </div>
          )}
          {sub.status === 'suspended' && (
            <div style={{ padding: '12px 22px', background: 'var(--terracotta-soft)', borderBottom: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--terracotta)', flexShrink: 0 }}>
                <path d="M8 1L1 14h14L8 1zM8 6v4M8 12v.5" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--terracotta)' }}>Subscription suspended — contact Kundai support to reactivate</span>
            </div>
          )}
          {sub.status === 'pending_payment' && !sub.lastPaynowStatus && (
            <div style={{ padding: '12px 22px', background: 'var(--gold-soft)', borderBottom: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold-deep)', flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" /><path d="M8 5v3M8 11v.5" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold-deep)' }}>Payment pending — complete payment below to activate your subscription</span>
            </div>
          )}
          {sub.status === 'pending_payment' && (sub.lastPaynowStatus === 'cancelled' || sub.lastPaynowStatus === 'failed') && (
            <div style={{ padding: '12px 22px', background: 'var(--terracotta-soft)', borderBottom: '1px solid color-mix(in srgb, var(--terracotta) 25%, transparent)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--terracotta)', flexShrink: 0 }}>
                <path d="M8 1L1 14h14L8 1zM8 6v4M8 12v.5" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--terracotta)' }}>
                Last payment {sub.lastPaynowStatus} — select a package below to try again
              </span>
            </div>
          )}

          <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>
            {/* Plan */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>Current package</div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 6 }}>{pkg?.name ?? 'Custom'}</div>
              <span style={{ padding: '3px 9px', borderRadius: 4, fontSize: 11.5, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-3)' }}>
                {pkg && <>{pkg.billingCycle} billing · ${pkg.pricePerStudent}/student</>}
              </div>
            </div>

            {/* Dates */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>Period</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span><span style={{ color: 'var(--ink-3)' }}>Start</span> · <b style={{ color: 'var(--ink-1)' }}>{formatDate(sub.startDate)}</b></span>
                <span><span style={{ color: 'var(--ink-3)' }}>End</span> · <b style={{ color: daysLeft !== null && daysLeft < 14 ? 'var(--terracotta)' : 'var(--ink-1)' }}>{formatDate(sub.endDate)}</b></span>
                {daysLeft !== null && <span style={{ fontSize: 11.5, color: daysLeft < 14 ? 'var(--terracotta)' : daysLeft < 30 ? 'var(--gold-deep)' : 'var(--forest)', fontWeight: 600 }}>
                  {daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
                </span>}
              </div>
            </div>

            {/* Payment */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>Payment</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: 'var(--ink-1)', fontFeatureSettings: "'tnum' 1" }}>
                ${sub.amountPaid.toFixed(2)}
                <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 400 }}> / ${sub.amountDue.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 12, color: sub.amountPaid >= sub.amountDue ? 'var(--forest)' : 'var(--gold-deep)', fontWeight: 600, marginTop: 4 }}>
                {sub.amountPaid >= sub.amountDue ? '✓ Paid in full' : `$${(sub.amountDue - sub.amountPaid).toFixed(2)} outstanding`}
              </div>
              {sub.paymentRef && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>Ref: {sub.paymentRef}</div>}
            </div>
          </div>

          {/* Seat usage */}
          <div style={{ padding: '18px 24px', borderTop: '1px solid var(--rule-soft)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>Seat license</div>
            <CapacityBar used={seatsUsed} total={seatLimit} />
            {seatPct > 85 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: seatPct > 95 ? 'var(--terracotta-soft)' : 'var(--gold-soft)', borderRadius: 5, fontSize: 12.5, color: seatPct > 95 ? 'var(--terracotta)' : 'var(--gold-deep)', fontWeight: 600, border: `1px solid color-mix(in srgb, ${seatPct > 95 ? 'var(--terracotta)' : 'var(--gold)'} 25%, transparent)` }}>
                {seatPct > 95
                  ? `⚠ You've used ${Math.round(seatPct)}% of your seat limit. Upgrade now to avoid being locked out.`
                  : `You're at ${Math.round(seatPct)}% of your seat limit. Consider upgrading before you reach capacity.`}
              </div>
            )}
          </div>

          {/* School info */}
          {school && (
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--rule-soft)', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {[
                ['School', school.name],
                ['Contact email', school.email],
                school.phone ? ['Phone', school.phone] : null,
                school.address ? ['Address', school.address] : null,
              ].filter(Boolean).map(([label, value]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-1)' }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 700, color: 'var(--ink-1)' }}>Available packages</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
              Select a package and pay via EcoCash, InnBucks, card, or Paynow web checkout
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {packages.map(p => (
              <PackageCard
                key={p._id}
                pkg={p}
                isCurrent={p._id === currentPkgId && sub?.status === 'active'}
                onSelect={() => setPaymentPkg(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty packages state */}
      {packages.length === 0 && (
        <div style={{ padding: '28px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 7, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
          No packages configured yet. Contact your system administrator.
        </div>
      )}

      {/* Payment modal */}
      {paymentPkg && (
        <PaymentModal
          pkg={paymentPkg}
          onClose={() => setPaymentPkg(null)}
          onPaid={() => { setPaymentResult({ paid: true }); loadBilling(); }}
        />
      )}
    </div>
  );
};

export default SchoolBillingPage;
