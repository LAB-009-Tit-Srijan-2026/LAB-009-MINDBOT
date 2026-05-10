"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Rocket, BarChart, ShieldCheck, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { API_BASE } from '@/lib/api';

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Verification failed");
      }

      // Automatically login after verification
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      
      if (loginRes.ok) {
        localStorage.setItem("axion_jwt", loginData.access_token);
        localStorage.setItem("axion_email", email);
        router.push("/");
      } else {
        router.push("/login");
      }
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
                {step === 1 ? 'Create Account' : 'Verify Email'}
              </h3>
              <p className="auth-form-subtitle">
                {step === 2 ? (
                  <>We sent a 6-digit code to <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{email}</span></>
                ) : null}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="auth-field">
                    <label>First Name</label>
                    <input className="auth-input" type="text" placeholder="Jane" value={firstName} onChange={e=>setFirstName(e.target.value)} required/>
                  </div>
                  <div className="auth-field">
                    <label>Last Name</label>
                    <input className="auth-input" type="text" placeholder="Doe" value={lastName} onChange={e=>setLastName(e.target.value)} required/>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Email</label>
                  <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="auth-input" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e=>setPassword(e.target.value)} 
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

                <button type="submit" className="btn btn-primary" style={{ padding:'13px 20px', fontSize:'0.95rem', justifyContent:'center', marginTop:4 }} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spin"/> : 'Create Account'}
                </button>

                <div className="auth-separator">or sign up via</div>

                <div className="auth-social-row">
                  <button 
                    type="button" 
                    className="auth-social-btn" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => window.location.href = `${API_BASE}/auth/google/login`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <p
                  className="auth-form-subtitle"
                  style={{ textAlign: "center", marginTop: "24px" }}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    style={{
                      color: "var(--accent)",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} style={{ display:'flex', flexDirection:'column', gap:24 }}>
                <div className="auth-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                    <label style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>VERIFICATION CODE</label>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: 0 }}
                    >
                      <ChevronLeft size={14} /> Edit Email
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
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
                          maxWidth: '56px', 
                          height: '64px', 
                          textAlign: 'center', 
                          fontSize: '1.6rem', 
                          fontWeight: '800',
                          padding: 0,
                          borderRadius: '14px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        required
                      />
                    ))}
                  </div>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ 
                    padding:'16px 20px', 
                    fontSize:'1rem', 
                    fontWeight: '700',
                    justifyContent:'center',
                    background: 'var(--accent)',
                    color: '#000',
                    borderRadius: '16px',
                    marginTop: 8
                  }} 
                  disabled={loading || otp.length < 6}
                >
                  {loading ? <Loader2 size={18} className="spin"/> : 'Verify & Sign In'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                  Didn't receive the code? <button type="button" onClick={handleRegister} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Resend</button>
                </p>
              </form>
            )}
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
              Master your materials<br/>
              <span className="text-accent">with AI precision.</span>
            </h2>
            <p className="auth-hero-subtitle">
              Join Athex to save your sessions, track your progress, and build a personalized knowledge base.
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { icon: <Rocket size={18} color="var(--accent)" />, text: 'Unlimited session storage' },
              { icon: <BarChart size={18} color="var(--accent)" />, text: 'Track your quiz performance' },
              { icon: <ShieldCheck size={18} color="var(--accent)" />, text: 'Private & secure data' },
            ].map(f => (
              <div key={f.text} className="auth-feature-card">
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
