"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, ArrowRight, ChevronLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { API_BASE } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Request failed");

      setMessage(data.message);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");

      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Ambient Video Background */}
      <video autoPlay muted loop playsInline className="auth-bg-video">
        <source
          src="https://i.pinimg.com/originals/71/17/3e/71173e3617fbb07032833fc43c5c3e44.gif"
          type="video/mp4"
        />
      </video>

      <div className="auth-card-container">
        {/* Form panel (Left) */}
        <div className="auth-form-side">
          <div className="auth-form-box">
            <div>
              <h3 className="auth-form-title">
                {step === 1 ? 'Reset Password' : 'New Password'}
              </h3>
              <p className="auth-form-subtitle">
                {step === 1 
                  ? "Enter your email to receive a password reset code." 
                  : `We sent a reset code to ${email}`}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="auth-field">
                  <label>Email Address</label>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}
                {message && <div style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{message}</div>}

                <button type="submit" className="btn btn-primary" style={{ padding: '13px 20px', fontSize: '0.95rem', justifyContent: 'center' }} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spin" /> : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="auth-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label>Reset Code</label>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {[...Array(6)].map((_, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        maxLength={1}
                        value={otp[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!/^\d*$/.test(val)) return;
                          const newOtp = otp.split('');
                          newOtp[i] = val.slice(-1);
                          setOtp(newOtp.join(''));
                          if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0) {
                            document.getElementById(`otp-${i - 1}`)?.focus();
                          }
                        }}
                        className="auth-input"
                        style={{ 
                          width: '100%',
                          maxWidth: '48px', 
                          height: '56px', 
                          textAlign: 'center', 
                          fontSize: '1.5rem', 
                          fontWeight: '700',
                          padding: 0,
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                        required
                      />
                    ))}
                  </div>
                </div>

                <div className="auth-field">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="auth-input" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={newPassword} 
                      onChange={e=>setNewPassword(e.target.value)} 
                      required 
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {message && <div style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{message}</div>}

                <button type="submit" className="btn btn-primary" style={{ padding: '13px 20px', fontSize: '0.95rem', justifyContent: 'center', background: 'var(--accent)', color: '#000' }} disabled={loading || otp.length < 6}>
                  {loading ? <Loader2 size={18} className="spin" /> : 'Update Password'}
                </button>
              </form>
            )}

            <p style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link href="/login" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none", fontSize: '0.9rem' }}>
                Back to Login
              </Link>
            </p>
          </div>
        </div>

        {/* Brand panel (Right) */}
        <div className="auth-brand">
          <div>
            <div className="auth-logo-row">
              <img src="/logo.png" alt="Athex" className="auth-logo-img" />
              <span className="auth-logo-text">Athex</span>
            </div>
            <h2 className="auth-hero-title">
              Account<br/>
              <span className="text-accent">Recovery.</span>
            </h2>
            <p className="auth-hero-subtitle">
              Securely reset your password and get back to your personalized learning space.
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { icon: <ShieldCheck size={18} color="var(--accent)" />, text: 'Secure reset process' },
              { icon: <Sparkles size={18} color="var(--accent)" />, text: 'Back in seconds' },
            ].map((f, i) => (
              <div key={i} className="auth-feature-card">
                <span className="auth-feature-icon">{f.icon}</span>
                <span className="auth-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
