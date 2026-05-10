"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Cpu, 
  Zap, 
  Moon, 
  Globe,
  Database,
  Trash2,
  CheckCircle2,
  Smartphone,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<"account" | "preferences" | "security" | "integrations">("account");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("axion_jwt");
    const email = localStorage.getItem("axion_email");
    if (!token) {
      router.push("/login");
      return;
    }
    setUserEmail(email);
  }, [router]);

  const SidebarItem = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <button 
      className={`settings-nav-item ${activeTab === id ? 'active' : ''}`}
      onClick={() => setActiveTab(id)}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="settings-page-shell">
      {/* ── HEADER ── */}
      <header className="settings-header">
        <div className="settings-header-container">
          <div className="settings-header-left">
            <Link href="/" className="btn-back">
              <ChevronLeft size={20} />
              <span>Back</span>
            </Link>
            <div className="settings-divider-v" />
            <Link href="/" className="settings-logo">
              <img src="/logo.png" alt="Athex" style={{ height: 20 }} />
              <span>Athex</span>
            </Link>
          </div>
          <h1 className="settings-main-title">Control Center</h1>
        </div>
      </header>

      <div className="settings-layout">
        {/* ── SIDEBAR ── */}
        <aside className="settings-sidebar">
          <div className="sidebar-group">
            <span className="sidebar-label">Personal</span>
            <SidebarItem id="account" label="Account" icon={User} />
            <SidebarItem id="security" label="Security" icon={Shield} />
          </div>
          <div className="sidebar-group">
            <span className="sidebar-label">Experience</span>
            <SidebarItem id="preferences" label="Study Preferences" icon={Cpu} />
            <SidebarItem id="integrations" label="Integrations" icon={Zap} />
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="settings-main-content">
          <div className="content-card">
            {activeTab === "account" && (
              <section className="settings-pane">
                <div className="pane-header">
                  <h2>Account Profile</h2>
                  <p>Manage your personal details and subscription.</p>
                </div>

                <div className="settings-grid">
                  <div className="setting-box">
                    <label>Email Address</label>
                    <div className="input-with-badge">
                      <input type="text" readOnly value={userEmail || ""} />
                      <span className="badge-verified">Verified</span>
                    </div>
                  </div>

                  <div className="setting-box">
                    <label>Plan</label>
                    <div className="plan-card">
                      <div className="plan-info">
                        <span className="plan-name">Athex Premium</span>
                        <span className="plan-price">$0.00 / mo (Early Access)</span>
                      </div>
                      <button className="btn-secondary sm">Manage Plan</button>
                    </div>
                  </div>

                  <div className="setting-box">
                    <label>Active Sessions</label>
                    <div className="session-item">
                      <Smartphone size={16} />
                      <div className="session-info">
                        <span>Windows Desktop — Chrome</span>
                        <small>Current Session • India</small>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "security" && (
              <section className="settings-pane">
                <div className="pane-header">
                  <h2>Security</h2>
                  <p>Secure your account with multi-factor authentication.</p>
                </div>

                <div className="settings-grid">
                  <div className="setting-box row">
                    <div className="sb-text">
                      <label>Two-Factor Authentication</label>
                      <span>Add an extra layer of security to your account.</span>
                    </div>
                    <div className="toggle" />
                  </div>

                  <div className="setting-box">
                    <label>Password</label>
                    <button className="btn-secondary">Update Password</button>
                  </div>

                  <div className="danger-zone">
                    <h3>Danger Zone</h3>
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="btn-danger">
                      <Trash2 size={16} /> Delete Account
                    </button>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "preferences" && (
              <section className="settings-pane">
                <div className="pane-header">
                  <h2>Study Preferences</h2>
                  <p>Tailor the AI behavior to your learning style.</p>
                </div>

                <div className="settings-grid">
                  <div className="setting-box">
                    <label>AI Output Depth</label>
                    <div className="radio-group">
                      {["Concise", "Balanced", "In-depth"].map(opt => (
                        <button key={opt} className={`radio-item ${opt === 'In-depth' ? 'active' : ''}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="setting-box row">
                    <div className="sb-text">
                      <label>Auto-Generate Flashcards</label>
                      <span>Instantly create flashcards after each ingestion.</span>
                    </div>
                    <div className="toggle active" />
                  </div>

                  <div className="setting-box">
                    <label>Default Note Format</label>
                    <select className="settings-select">
                      <option>Academic (Scientific)</option>
                      <option>Cornell Method</option>
                      <option>Bullet Journal</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "integrations" && (
              <section className="settings-pane">
                <div className="pane-header">
                  <h2>Integrations</h2>
                  <p>Sync your study materials with your favorite apps.</p>
                </div>

                <div className="integrations-list">
                  <div className="int-card">
                    <div className="int-logo notion">N</div>
                    <div className="int-info">
                      <span className="int-name">Notion</span>
                      <span className="int-desc">Sync notes directly to your workspace.</span>
                    </div>
                    <button className="btn-secondary sm">Connect</button>
                  </div>

                  <div className="int-card">
                    <div className="int-logo obsidian">O</div>
                    <div className="int-info">
                      <span className="int-name">Obsidian</span>
                      <span className="int-desc">Export via local webhook or markdown.</span>
                    </div>
                    <button className="btn-secondary sm">Connect</button>
                  </div>

                  <div className="int-card">
                    <div className="int-logo discord">D</div>
                    <div className="int-info">
                      <span className="int-name">Discord Webhook</span>
                      <span className="int-desc">Get notified when processing is complete.</span>
                    </div>
                    <button className="btn-secondary sm">Setup</button>
                  </div>
                </div>
              </section>
            )}
          </div>
          
          <div className="settings-footer-actions">
            <button className="btn-primary">Save Changes</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="state-center">Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
