"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  ArrowRight,
  Zap,
  FileText,
  Brain,
  MessageSquare,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { API_BASE } from '@/lib/api';

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");
    if (token) {
      setLoading(true);
      localStorage.setItem("axion_jwt", token);
      if (emailParam) localStorage.setItem("axion_email", emailParam);
      window.location.replace("/");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      localStorage.setItem("axion_jwt", data.access_token);
      localStorage.setItem("axion_email", email);
      router.push("/");
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
              <h3 className="auth-form-title">Welcome back</h3>
            </div>

            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div className="auth-field">
                <label>Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--text-3)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ textAlign: "right", marginTop: "4px" }}>
                  <Link
                    href="/forgot-password"
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-3)",
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: "13px 20px",
                  fontSize: "0.95rem",
                  justifyContent: "center",
                  marginTop: 4,
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <>
                    <ArrowRight size={16} /> Sign In
                  </>
                )}
              </button>

              <div className="auth-separator">or sign in via</div>

              <div className="auth-social-row">
                <button
                  type="button"
                  className="auth-social-btn"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() =>
                    (window.location.href = `${API_BASE}/auth/google/login`)
                  }
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
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  style={{
                    color: "var(--accent)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Sign up
                </Link>
              </p>
            </form>
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
              Turn any lecture into
              <br />
              <span className="text-accent">your study kit.</span>
            </h2>
            <p className="auth-hero-subtitle">
              AI-powered notes, quizzes, and flashcards — generated from any
              YouTube video or audio file in seconds.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                icon: <FileText size={18} color="var(--accent)" />,
                text: "Auto-generated structured notes",
              },
              {
                icon: <Brain size={18} color="var(--accent)" />,
                text: "Adaptive quizzes & flashcards",
              },
              {
                icon: <MessageSquare size={18} color="var(--accent)" />,
                text: "Chat with your lecture content",
              },
            ].map((f) => (
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="state-center"><Loader2 className="spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
