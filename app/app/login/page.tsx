"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

const API_BASE = "http://localhost:8000/api/v1";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("axion_jwt", data.access_token);
      router.push("/");
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
          Welcome Back
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Sign in to store your sessions and interactive history.
        </p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          />
          {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', textAlign: 'left' }}>{error}</p>}
          
          <button type="submit" className="pill-btn" style={{ justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
            {loading ? <Loader2 size={18} className="processing-spinner" style={{ margin: 0 }} /> : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
