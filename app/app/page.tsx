"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Send,
  PlayCircle,
  Link as LinkIcon,
  Sparkles,
  BookOpen,
  Brain,
  CreditCard,
  ClipboardCheck,
  Plus,
  History,
  Settings,
  X,
  ChevronRight,
  MessageSquare,
  Loader2,
  Zap,
  ChevronLeft,
  LogOut,
  User,
} from "lucide-react";
import NotesViewer from "./components/StudyTools/NotesViewer";
import FlashcardDeck from "./components/StudyTools/FlashcardDeck";
import QuizEngine from "./components/StudyTools/QuizEngine";
import MockTest from "./components/StudyTools/MockTest";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Suspense } from "react";

import { API_BASE, getAuthHeaders } from '@/lib/api';

type Message = { role: "user" | "assistant"; content: string };
type PipelineStatus = { status: string; step: string; progress: number };

function extractYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function DashboardContent() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [activeYtUrl, setActiveYtUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "processing" | "ready"
  >("idle");
  const [pipelineInfo, setPipelineInfo] = useState<PipelineStatus>({
    status: "",
    step: "",
    progress: 0,
  });
  const [summary, setSummary] = useState<string[]>([]);
  const [summaryType, setSummaryType] = useState<"topic" | "last_5_mins">(
    "topic",
  );
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedTool, setSelectedTool] = useState<
    "notes" | "quiz" | "flashcards" | "mock_test" | null
  >(null);
  const [openedTools, setOpenedTools] = useState<Set<string>>(new Set());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string | null>(
    null,
  );
  const [showAllSessionsLanding, setShowAllSessionsLanding] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState<"account" | "preferences" | null>(null);

  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = localStorage.getItem("axion_email");
    setUserEmail(email);
    fetchProjects();
  }, [router]);

  // Handle session persistence via URL
  useEffect(() => {
    const session = searchParams.get("session");
    if (session) {
      if (projects.length > 0 && videoId !== session) {
        const proj = projects.find((p) => p.id === session);
        if (proj) {
          loadProject(proj);
        }
      }
    } else if (videoId) {
      // If no session param but we have a videoId active, user clicked logo or home
      // We don't use resetToIdle() here because it pushes to router, 
      // we just want to clear local state.
      setVideoId(null);
      setStatus("idle");
      setMessages([]);
      setSummary([]);
      setSelectedTool(null);
      setCurrentProjectTitle(null);
      setOpenedTools(new Set());
    }
  }, [searchParams, projects, videoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAuthHeaders = useCallback(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("axion_jwt") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("axion_jwt");
      const res = await fetch(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProjects(await res.json());
    } catch {}
  };

  const loadProject = async (proj: any) => {
    setVideoId(proj.id);
    setActiveYtUrl(proj.yt_url || "file");
    setCurrentProjectTitle(proj.title);
    setSummary([]);
    setMessages([]);
    setStatus("ready");
    setSelectedTool(null);
    fetchSummary("topic", proj.id);
    
    // Update URL for persistence
    router.push(`/?session=${proj.id}`);

    try {
      const token = localStorage.getItem("axion_jwt");
      const res = await fetch(`${API_BASE}/chat/history?video_id=${proj.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch {}
  };

  const saveMessage = async (role: string, content: string, vidId: string) => {
    try {
      const token = localStorage.getItem("axion_jwt");
      await fetch(
        `${API_BASE}/chat/message?video_id=${vidId}&role=${role}&content=${encodeURIComponent(content)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch {}
  };

  const fetchSummary = useCallback(
    async (type: "topic" | "last_5_mins", vid: string) => {
      setIsSummarizing(true);
      setSummaryType(type);
      try {
        let time = 0;
        if (mediaRef.current) {
          time = mediaRef.current.currentTime;
        }
        const res = await fetch(
          `${API_BASE}/summary?video_id=${vid}&summary_type=${type}&current_time=${time}`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json();
        // Backend now returns JSON array in 'content'
        if (Array.isArray(data.content)) {
          setSummary(data.content);
        } else if (typeof data.content === "string") {
          setSummary(
            data.content
              .split("\n")
              .map((l: string) => l.replace(/^[•\-\*]\s*/, "").trim())
              .filter(Boolean),
          );
        }
      } catch {
      } finally {
        setIsSummarizing(false);
      }
    },
    [getAuthHeaders],
  );

  const seekTo = (seconds: number) => {
    if (activeYtUrl && ytIframeRef.current) {
      ytIframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [seconds, true],
        }),
        "*",
      );
    } else if (mediaRef.current) {
      mediaRef.current.currentTime = seconds;
      mediaRef.current.play();
    }
  };

  const pollStatus = useCallback(
    async (id: string, title?: string) => {
      setVideoId(id);
      setStatus("processing");
      if (title) setCurrentProjectTitle(title);
      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const res = await fetch(`${API_BASE}/status/${id}`, {
            headers: getAuthHeaders(),
          });
          const data: PipelineStatus = await res.json();
          setPipelineInfo(data);
          if (data.status === "ready") {
            await fetchSummary("topic", id);
            setStatus("ready");
            setMessages([
              {
                role: "assistant",
                content: "I've analyzed your media. Ask me anything about it!",
              },
            ]);
            fetchProjects();
            
            // Redirect to the new session
            router.push(`/?session=${id}`);
            return;
          }
          if (data.status === "error") {
            setStatus("ready");
            setMessages([
              {
                role: "assistant",
                content:
                  "Processing hit an issue, but you can still ask questions.",
              },
            ]);
            return;
          }
        } catch {}
      }
      setStatus("ready");
    },
    [getAuthHeaders, fetchSummary],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileUrl(URL.createObjectURL(f));
    setStatus("uploading");
    setPipelineInfo({
      status: "uploading",
      step: "Uploading file…",
      progress: 5,
    });
    const fd = new FormData();
    fd.append("file", f);
    try {
      const h = getAuthHeaders();
      delete (h as any)["Content-Type"];
      const res = await fetch(`${API_BASE}/ingest`, {
        method: "POST",
        headers: h,
        body: fd,
      });
      const data = await res.json();
      pollStatus(data.video_id, f.name);
    } catch {
      setStatus("idle");
    }
  };

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;
    setActiveYtUrl(ytUrl);
    setStatus("uploading");
    setPipelineInfo({
      status: "uploading",
      step: "Queuing ingestion…",
      progress: 5,
    });
    try {
      const res = await fetch(`${API_BASE}/ingest/youtube`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ youtube_url: ytUrl }),
      });
      const data = await res.json();
      pollStatus(data.video_id, `YouTube — ${ytUrl.slice(0, 40)}`);
    } catch {
      setStatus("idle");
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !videoId || isStreaming) return;
    const userMsg: Message = { role: "user", content: query };
    const history = messages.filter(
      (m) => !m.content.includes("I've analyzed"),
    );
    setMessages((prev) => [
      ...prev,
      userMsg,
      { role: "assistant", content: "" },
    ]);
    setQuery("");
    setIsStreaming(true);
    saveMessage("user", userMsg.content, videoId);
    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: "demo",
          video_id: videoId,
          query: userMsg.content,
          history,
        }),
      });
      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let done = false;
      let full = "";
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          for (const line of dec.decode(value, { stream: true }).split("\n")) {
            if (line.startsWith("data: ")) {
              const chunk = line.slice(6);
              if (chunk === "[DONE]") {
                done = true;
                saveMessage("assistant", full, videoId);
                break;
              }
              full += chunk;
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: full },
              ]);
            }
          }
        }
      }
    } catch {
    } finally {
      setIsStreaming(false);
    }
  };

  const renderMsg = (content: string) => {
    const processNodes = (nodes: React.ReactNode): React.ReactNode => {
      return React.Children.map(nodes, (node) => {
        if (typeof node === "string") {
          const regex = /\[TIMESTAMP:([\d.]+)\]/g;
          const parts: React.ReactNode[] = [];
          let last = 0;
          let m;
          while ((m = regex.exec(node)) !== null) {
            parts.push(<span key={last}>{node.slice(last, m.index)}</span>);
            const t = Math.round(parseFloat(m[1]));
            const mins = Math.floor(t / 60);
            const secs = t % 60;
            parts.push(
              <button
                key={m.index}
                className="ts-badge-chat"
                onClick={() => seekTo(t)}
              >
                <PlayCircle size={10} />
                {mins}:{secs.toString().padStart(2, "0")}
              </button>,
            );
            last = regex.lastIndex;
          }
          parts.push(<span key={last}>{node.slice(last)}</span>);
          return parts;
        }
        if (React.isValidElement(node) && (node as any).props.children) {
          return React.cloneElement(node as any, {
            children: processNodes((node as any).props.children),
          } as any);
        }
        return node;
      });
    };

    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="msg-text">{processNodes(children)}</p>
          ),
          code: ({ children }) => <code className="chat-code">{children}</code>,
          ul: ({ children }) => (
            <ul className="chat-list">{processNodes(children)}</ul>
          ),
          li: ({ children }) => (
            <li className="chat-list-item">{processNodes(children)}</li>
          ),
          h3: ({ children }) => (
            <h3 className="chat-h3">{processNodes(children)}</h3>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const isProcessing = status === "uploading" || status === "processing";
  const ytId = activeYtUrl ? extractYouTubeId(activeYtUrl) : null;

  const resetToIdle = () => {
    setFile(null);
    setFileUrl(null);
    setActiveYtUrl(null);
    setYtUrl("");
    setVideoId(null);
    setStatus("idle");
    setMessages([]);
    setSummary([]);
    setSelectedTool(null);
    setCurrentProjectTitle(null);
    setOpenedTools(new Set());
    setPipelineInfo({ status: "", step: "", progress: 0 });
    
    // Only push if we are not already at root
    if (window.location.search.includes("session=")) {
      router.push("/");
    }
  };

  const TOOLS = [
    {
      id: "notes",
      label: "Notes",
      desc: "AI-structured notes",
      Icon: BookOpen,
    },
    { id: "quiz", label: "Quiz", desc: "Test your knowledge", Icon: Brain },
    {
      id: "flashcards",
      label: "Flashcards",
      desc: "Active recall cards",
      Icon: CreditCard,
    },
    {
      id: "mock_test",
      label: "Mock Test",
      desc: "Full assessment",
      Icon: ClipboardCheck,
    },
  ] as const;

  return (
    <div className="app-shell">
      {/* ── TOPBAR ── */}
      <header className="topbar">
        <button 
          onClick={resetToIdle} 
          className="topbar-logo"
          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
        >
          <img
            src="/logo.png"
            alt="Athex"
            style={{ height: 24, width: "auto" }}
          />
          Athex
        </button>
        <div className="topbar-divider" />
        <div className="topbar-project">
          {currentProjectTitle ? (
            <>
              <strong>{currentProjectTitle}</strong>
            </>
          ) : (
            <span>No session active</span>
          )}
        </div>

        <div className="topbar-actions">
          <button
            className="btn btn-icon"
            title="New session"
            onClick={resetToIdle}
          >
            <Plus size={16} />
          </button>
          <button
            className={`btn btn-icon${showHistory ? " active" : ""}`}
            title="Session library"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History size={16} />
          </button>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
          
          <div style={{ position: 'relative' }}>
            <div 
              className="avatar" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ cursor: 'pointer' }}
            >
              {userEmail?.[0]?.toUpperCase() || "U"}
            </div>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="avatar-large-gradient">
                    {userEmail?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="profile-info">
                    <span className="profile-email">{userEmail || "User"}</span>
                    <span className="profile-status">Premium Member</span>
                  </div>
                </div>
                
                <div className="profile-usage-box">
                  <div className="pub-header">
                    <span>Sessions Used</span>
                    <span>{projects.length}/10</span>
                  </div>
                  <div className="pub-bar">
                    <div className="pub-fill" style={{ width: `${Math.min((projects.length / 10) * 100, 100)}%` }} />
                  </div>
                  <span className="pub-footer">You have {10 - projects.length} free sessions left</span>
                </div>

                <div className="profile-dropdown-divider" />
                
                <button 
                  className="profile-dropdown-item"
                  onClick={() => {
                    setShowSettingsModal("account");
                    setShowProfileMenu(false);
                  }}
                >
                  <User size={14} /> 
                  <span>Account Settings</span>
                </button>
                <button 
                  className="profile-dropdown-item"
                  onClick={() => {
                    setShowSettingsModal("preferences");
                    setShowProfileMenu(false);
                  }}
                >
                  <Settings size={14} /> 
                  <span>Preferences</span>
                </button>
                
                <div className="profile-dropdown-divider" />
                
                <button 
                  className="profile-dropdown-item logout"
                  onClick={() => {
                    localStorage.removeItem("axion_jwt");
                    localStorage.removeItem("axion_email");
                    window.location.href = "/login";
                  }}
                >
                  <LogOut size={14} /> 
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      {!videoId ? (
        <div className="landing-centered-layout">
          {/* Hero Section (Full Window Height minus Header) */}
          <div className="hero-section">
            <div className="hero-content">
              <div className="hero-badge">
                <Sparkles size={13} color="var(--accent)" />
                <span>AI-Powered Learning</span>
              </div>

              <h1 className="hero-title">
                Learn smarter.
                <br />
                <span className="text-accent">Study faster.</span>
              </h1>

              <p className="hero-subtitle">
                Drop any YouTube link or upload a lecture. Athex instantly
                builds notes, quizzes, and flashcards.
              </p>

              {/* Big Box Ingestion */}
              <div className="ingestion-big-box">
                {/* Upper: Video Upload */}
                <label className="upload-zone-large">
                  <UploadCloud
                    size={32}
                    color="var(--text-3)"
                    style={{ marginBottom: 12 }}
                  />
                  <span className="uz-title-large">Upload media file</span>
                  <span className="uz-sub-large">
                    Drag & drop or click to browse (MP4, MP3, WAV — up to 500
                    MB)
                  </span>
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </label>

                {/* Divider */}
                <div className="ingestion-divider">
                  <span className="ingestion-divider-text">OR PASTE LINK</span>
                </div>

                {/* Lower: YouTube Link */}
                <div className="youtube-zone-large">
                  <form
                    className="youtube-form-large"
                    onSubmit={handleYoutubeSubmit}
                  >
                    <LinkIcon size={16} color="var(--text-3)" />
                    <input
                      type="text"
                      className="youtube-input-large"
                      placeholder="https://youtube.com/watch?v=..."
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-ingest-large"
                      disabled={!ytUrl.trim()}
                    >
                      Ingest <ChevronRight size={16} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* History Section Below */}
          {projects.length > 0 && (
            <div className="history-section">
              <h2 className="history-section-title">Recent Sessions</h2>
              <div className="history-cards-grid">
                {(showAllSessionsLanding ? projects : projects.slice(0, 3)).map(
                  (p) => (
                    <button
                      key={p.id}
                      className="history-card-large"
                      onClick={() => loadProject(p)}
                    >
                      <div className="hc-content">
                        <div className="hc-title">{p.title}</div>
                        <div className="hc-date">
                          {new Date(p.created_at).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </div>
                      <div className="hc-arrow">
                        <ChevronRight size={18} color="var(--text-3)" />
                      </div>
                    </button>
                  ),
                )}
              </div>

              {projects.length > 3 && (
                <button
                  className="btn"
                  style={{ marginTop: 32 }}
                  onClick={() =>
                    setShowAllSessionsLanding(!showAllSessionsLanding)
                  }
                >
                  {showAllSessionsLanding ? "Show Less" : "View All Sessions"}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="workspace">
          {/* ── LEFT: CHAT ── */}
          <div className="panel panel-chat">
            {showHistory ? (
              <>
                <div className="panel-hd">
                  <span className="panel-hd-title">Library</span>
                  <button
                    className="btn btn-icon"
                    onClick={() => setShowHistory(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="history-list">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      className={`history-item${videoId === p.id ? " active" : ""}`}
                      onClick={() => {
                        loadProject(p);
                        setShowHistory(false);
                      }}
                    >
                      <div>
                        <div className="h-title">{p.title}</div>
                        <div className="h-date">
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <ChevronRight size={12} color="var(--text-3)" />
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <div className="state-center">
                      <p className="state-sub">No sessions yet.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="panel-hd">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <MessageSquare size={14} color="var(--text-3)" />
                    <span className="panel-hd-title">Assistant</span>
                  </div>
                  {status === "ready" && (
                    <span className="tag tag-green">Live</span>
                  )}
                </div>
                <div className="chat-messages">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`msg msg-${msg.role === "user" ? "user" : "ai"}`}
                    >
                      <div className="msg-bubble">
                        {msg.role === "assistant" ? (
                          msg.content === "" && isStreaming ? (
                            <span
                              style={{
                                color: "var(--text-3)",
                                animation: "pulse 1.4s ease infinite",
                              }}
                            >
                              Thinking…
                            </span>
                          ) : (
                            renderMsg(msg.content)
                          )
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                  <form className="chat-input-row" onSubmit={handleChat}>
                    <input
                      placeholder={
                        status === "ready" ? "Ask anything…" : "Processing…"
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      disabled={status !== "ready" || isStreaming}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-icon"
                      disabled={
                        !query.trim() || status !== "ready" || isStreaming
                      }
                    >
                      {isStreaming ? (
                        <Loader2 size={15} className="spin" />
                      ) : (
                        <Send size={15} />
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* ── CENTER: PLAYER + SUMMARY ── */}
          <div className="panel panel-center">
            {/* Processing banner */}
            {isProcessing && (
              <div className="proc-banner">
                <Loader2 size={16} className="spin" color="var(--accent)" />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "var(--text-1)",
                      }}
                    >
                      {pipelineInfo.step || "Initializing…"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent)",
                      }}
                    >
                      {pipelineInfo.progress || 5}%
                    </span>
                  </div>
                  <div className="proc-bar-track">
                    <div
                      className="proc-bar-fill"
                      style={{ width: `${pipelineInfo.progress || 5}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Video */}
            <div
              className="player-wrap"
              style={{ display: ytId || fileUrl ? "block" : "none" }}
            >
              {ytId ? (
                <iframe
                  ref={ytIframeRef}
                  src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1`}
                  allowFullScreen
                  title="YouTube"
                />
              ) : fileUrl && file?.type.startsWith("video/") ? (
                <video
                  ref={mediaRef as any}
                  src={fileUrl}
                  controls
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : fileUrl ? (
                <div className="player-audio-wrap">
                  <audio
                    ref={mediaRef as any}
                    src={fileUrl}
                    controls
                    style={{ width: "80%" }}
                  />
                </div>
              ) : null}
            </div>

            {/* Summary */}
            <div className="summary-area">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-2)",
                  }}
                >
                  {isSummarizing ? "Generating summary…" : "Key Insights"}
                </span>
                {summary.length > 0 && !isSummarizing && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["topic", "last_5_mins"] as const).map((t) => (
                      <button
                        key={t}
                        className={`btn${summaryType === t ? " btn-primary" : ""}`}
                        style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                        onClick={() => videoId && fetchSummary(t, videoId)}
                      >
                        {t === "topic" ? "Overview" : "Last 5m"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isSummarizing ? (
                <div className="state-center" style={{ padding: "20px 0" }}>
                  <Loader2 size={20} className="spin" color="var(--accent)" />
                  <p className="state-sub">Analyzing key sections…</p>
                </div>
              ) : summary.length > 0 ? (
                <div className="topic-index-grid">
                  {summary.map((item: any, idx) => {
                    const isObj = typeof item === "object";
                    const topic = isObj ? item.topic : item;
                    const time = isObj ? item.timestamp : null;

                    return (
                      <div
                        key={idx}
                        className="topic-card"
                        onClick={() => time !== null && seekTo(time)}
                      >
                        <div className="topic-card-hd">
                          <span className="topic-num">
                            {(idx + 1).toString().padStart(2, "0")}
                          </span>
                          {time !== null && (
                            <span className="topic-time">
                              {Math.floor(time / 60)}:
                              {(time % 60).toString().padStart(2, "0")}
                            </span>
                          )}
                        </div>
                        <div className="topic-card-body">
                          <p>{topic}</p>
                          {time !== null && (
                            <div className="topic-jump">
                              <PlayCircle size={12} />
                              Jump
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="state-center" style={{ padding: "20px 0" }}>
                  <div style={{ opacity: 0.3, marginBottom: 12 }}>
                    <Sparkles size={24} />
                  </div>
                  <p className="state-sub">
                    {status === "processing"
                      ? "Summary will appear after processing…"
                      : "Select a session to see insights."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: STUDIO ── */}
          <div className="panel panel-studio" style={{ position: "relative" }}>
            <div className="panel-hd">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={14} color="var(--text-3)" />
                <span className="panel-hd-title">Studio</span>
              </div>
              <span className="tag tag-accent">AI</span>
            </div>

            <div className="studio-grid">
              {TOOLS.map(({ id, label, desc, Icon }) => (
                <button
                  key={id}
                  className={`studio-tool${selectedTool === id ? " active" : ""}`}
                  onClick={() => {
                    setSelectedTool(id);
                    setOpenedTools((prev) => new Set(prev).add(id));
                  }}
                >
                  <div className="tool-icon">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="tool-name">{label}</div>
                    <div className="tool-desc">{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Tool overlay — stays mounted once first opened */}
            <div
              className="tool-overlay"
              style={{ display: selectedTool ? "flex" : "none" }}
            >
              <div className="tool-overlay-hd">
                <button
                  className="btn btn-icon"
                  onClick={() => setSelectedTool(null)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  {TOOLS.find((t) => t.id === selectedTool)?.label}
                </span>
              </div>
              <div className="tool-overlay-body">
                {openedTools.has("notes") && (
                  <div
                    style={{
                      display: selectedTool === "notes" ? "block" : "none",
                      height: "100%",
                    }}
                  >
                    <NotesViewer videoId={videoId || ""} />
                  </div>
                )}
                {openedTools.has("flashcards") && (
                  <div
                    style={{
                      display: selectedTool === "flashcards" ? "block" : "none",
                      height: "100%",
                    }}
                  >
                    <FlashcardDeck videoId={videoId || ""} />
                  </div>
                )}
                {openedTools.has("quiz") && (
                  <div
                    style={{
                      display: selectedTool === "quiz" ? "block" : "none",
                      height: "100%",
                    }}
                  >
                    <QuizEngine videoId={videoId || ""} />
                  </div>
                )}
                {openedTools.has("mock_test") && (
                  <div
                    style={{
                      display: selectedTool === "mock_test" ? "block" : "none",
                      height: "100%",
                    }}
                  >
                    <MockTest videoId={videoId || ""} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── SETTINGS MODAL ── */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(null)}>
          <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <Settings size={18} color="var(--accent)" />
                <h2 className="modal-title">Settings</h2>
              </div>
              <button className="btn-close" onClick={() => setShowSettingsModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="settings-tabs">
              <button 
                className={`settings-tab ${showSettingsModal === 'account' ? 'active' : ''}`}
                onClick={() => setShowSettingsModal('account')}
              >
                Account
              </button>
              <button 
                className={`settings-tab ${showSettingsModal === 'preferences' ? 'active' : ''}`}
                onClick={() => setShowSettingsModal('preferences')}
              >
                Preferences
              </button>
            </div>

            <div className="settings-body">
              {showSettingsModal === 'account' ? (
                <div className="settings-section">
                  <div className="setting-item">
                    <label>Email Address</label>
                    <input type="text" readOnly value={userEmail || ""} className="settings-input" />
                  </div>
                  <div className="setting-item">
                    <label>Password</label>
                    <button className="btn-secondary" style={{ width: 'fit-content' }}>Change Password</button>
                  </div>
                  <div className="setting-item">
                    <label>Subscription</label>
                    <div className="subscription-badge">Premium Plan</div>
                  </div>
                </div>
              ) : (
                <div className="settings-section">
                  <div className="setting-item row">
                    <div className="setting-text">
                      <label>Auto-generate Notes</label>
                      <span>Instantly create notes when a video is added.</span>
                    </div>
                    <div className="toggle active" />
                  </div>
                  <div className="setting-item row">
                    <div className="setting-text">
                      <label>Dark Mode</label>
                      <span>The default Aurora aesthetic.</span>
                    </div>
                    <div className="toggle active" />
                  </div>
                  <div className="setting-item">
                    <label>Language</label>
                    <select className="settings-input">
                      <option>English (US)</option>
                      <option>Hindi</option>
                      <option>Spanish</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSettingsModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => setShowSettingsModal(null)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="state-center"><Loader2 className="spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
