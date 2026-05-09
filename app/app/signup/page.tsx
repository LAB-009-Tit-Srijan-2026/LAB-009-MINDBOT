"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API_BASE = "http://localhost:8000/api/v1";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ email, password })
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
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bento-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', textAlign: 'center' }}>
        <Sparkles size={32} style={{ color: 'var(--accent-red)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
          {step === 1 ? 'Create Account' : 'Verify Email'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          {step === 1 
            ? 'Sign up to unlock session memory.' 
            : `We sent a 6-digit code to ${email}.`}
        </p>
        
        {step === 1 ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pill-input" 
              style={{ padding: '12px 24px', fontSize: '0.9rem' }}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pill-input" 
              style={{ padding: '12px 24px', fontSize: '0.9rem' }}
              required
              minLength={6}
            />
            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', textAlign: 'left' }}>{error}</p>}
            
            <button type="submit" className="pill-btn" style={{ justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="processing-spinner" style={{ margin: 0 }} /> : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="123456" 
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="pill-input" 
              style={{ padding: '12px 24px', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px' }}
              maxLength={6}
              required
            />
            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', textAlign: 'left' }}>{error}</p>}
            
            <button type="submit" className="pill-btn" style={{ justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="processing-spinner" style={{ margin: 0 }} /> : 'Verify & Sign In'}
            </button>
          </form>
        )}

        {step === 1 && (
          <p style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
