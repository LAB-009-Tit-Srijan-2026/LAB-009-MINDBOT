"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, CheckCircle, Loader2, Send, PlayCircle, Link as LinkIcon, Sparkles, BookOpen, Brain, CreditCard, ClipboardCheck, MessageSquare } from 'lucide-react';
import NotesViewer from './components/StudyTools/NotesViewer';
import FlashcardDeck from './components/StudyTools/FlashcardDeck';
import QuizEngine from './components/StudyTools/QuizEngine';
import MockTest from './components/StudyTools/MockTest';
import { useRouter } from 'next/navigation';

const API_BASE = "http://localhost:8000/api/v1";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type PipelineStatus = {
  status: string;
  step: string;
  progress: number;
};

/** Extract YouTube video ID from any URL format */
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function VideoCompanionDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [ytUrl, setYtUrl] = useState<string>("");
  const [activeYtUrl, setActiveYtUrl] = useState<string | null>(null);
  
  const [videoId, setVideoId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready'>('idle');
  const [pipelineInfo, setPipelineInfo] = useState<PipelineStatus>({ status: '', step: '', progress: 0 });
  
  const [summary, setSummary] = useState<string[]>([]);
  const [summaryType, setSummaryType] = useState<'topic' | 'last_5_mins'>('topic');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'quiz' | 'flashcards' | 'mock_test'>('chat');

  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('axion_jwt');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('axion_jwt') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Fetch Summary ──
  const fetchSummary = useCallback(async (type: 'topic' | 'last_5_mins', currentVideoId: string) => {
    setIsSummarizing(true);
    setSummaryType(type);
    
    let currentTime = 0;
    if (type === 'last_5_mins') {
      if (ytIframeRef.current) {
        // Since we are using postMessage to control YT, we can't easily synchronously get time 
        // without a listener setup. For MVP, if mediaRef is available we use it. 
        // Otherwise, we default to 300 to simulate.
        currentTime = mediaRef.current ? mediaRef.current.currentTime : 300;
      } else if (mediaRef.current) {
        currentTime = mediaRef.current.currentTime;
      }
    }

    try {
      const summaryRes = await fetch(`${API_BASE}/summary?video_id=${currentVideoId}&summary_type=${type}&current_time=${currentTime}`, {
        headers: getAuthHeaders()
      });
      const summaryData = await summaryRes.json();
      const summaryText = summaryData.summary || "";
      if (summaryText && !summaryText.toLowerCase().includes("please provide")) {
        const bullets = summaryText
          .split('\n')
          .map((line: string) => line.replace(/^[•\-\*]\s*/, '').trim())
          .filter(Boolean);
        setSummary(bullets);
      }
    } catch (e) {
      console.error("Failed to fetch summary", e);
    } finally {
      setIsSummarizing(false);
    }
  }, []);

  // ── Poll pipeline status from backend ──
  const pollStatus = useCallback(async (id: string) => {
    setVideoId(id);
    setStatus('processing');

    // Poll the /status endpoint every 3s until ready or error
    for (let attempt = 0; attempt < 120; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        const res = await fetch(`${API_BASE}/status/${id}`, {
          headers: getAuthHeaders()
        });
        const data: PipelineStatus = await res.json();
        setPipelineInfo(data);

        if (data.status === 'ready') {
          // Fetch initial topic summary
          await fetchSummary('topic', id);

          setStatus('ready');
          setMessages([{
            role: 'assistant',
            content: "I've analyzed the media. Feel free to ask me any questions about it!"
          }]);
          return;
        }

        if (data.status === 'error') {
          setStatus('ready'); // Allow user to chat even on error
          setMessages([{
            role: 'assistant',
            content: "There was an issue processing the video, but you can still try asking questions."
          }]);
          return;
        }
      } catch {
        // Backend not ready yet
      }
    }

    // Timeout fallback
    setStatus('ready');
  }, []);

  // Handle standard file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setFileUrl(URL.createObjectURL(selected));
    setStatus('uploading');
    setPipelineInfo({ status: 'uploading', step: 'Uploading file…', progress: 5 });

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const authHeaders = getAuthHeaders();
      delete (authHeaders as any)['Content-Type'];

      const res = await fetch(`${API_BASE}/ingest`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      await pollStatus(data.video_id);
    } catch (error) {
      handleIngestError(error);
    }
  };

  // Handle YouTube Link Submit
  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;

    setActiveYtUrl(ytUrl);
    setStatus('uploading');
    setPipelineInfo({ status: 'uploading', step: 'Sending to backend…', progress: 5 });

    try {
      const res = await fetch(`${API_BASE}/ingest/youtube`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ youtube_url: ytUrl }),
      });
      const data = await res.json();
      await pollStatus(data.video_id);
    } catch (error) {
      handleIngestError(error);
    }
  };

  const handleIngestError = (error: any) => {
    console.error("Upload failed", error);
    setStatus('idle');
    setFile(null);
    setFileUrl(null);
    setActiveYtUrl(null);
    setPipelineInfo({ status: '', step: '', progress: 0 });
    alert("Failed to ingest media. Is the backend running?");
  };

  // Handle Chat Streaming (SSE)
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !videoId || isStreaming) return;

    const userMessage: Message = { role: 'user', content: query };
    
    // Capture current history BEFORE we append the new user message to state,
    // so we can send it to the backend as context. We ignore the initial greeting.
    const historyToSend = messages.filter(m => m.content !== "I've analyzed the media. Feel free to ask me any questions about it!");

    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: "" }]);
    setQuery("");
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          session_id: "demo-session",
          video_id: videoId,
          query: userMessage.content,
          history: historyToSend
        })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                done = true;
                break;
              }
              
              setMessages(prev => {
                const newMessages = [...prev];
                const last = newMessages[newMessages.length - 1];
                if (last.role === 'assistant') {
                  last.content += data;
                }
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsStreaming(false);
    }
  };

  // Clickable Timestamps Parser
  const renderMessageContent = (content: string) => {
    const regex = /\[TIMESTAMP:([\d.]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      parts.push(<span key={lastIndex}>{content.slice(lastIndex, match.index)}</span>);
      
      const timeNum = parseFloat(match[1]);
      const formattedTime = new Date(timeNum * 1000).toISOString().substr(14, 5);
      
      parts.push(
        <button 
          key={match.index}
          className="timestamp-badge"
          onClick={() => {
            if (activeYtUrl && ytIframeRef.current) {
              ytIframeRef.current.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'seekTo', args: [timeNum, true] }),
                '*'
              );
            } else if (mediaRef.current) {
              mediaRef.current.currentTime = timeNum;
              mediaRef.current.play();
            }
          }}
        >
          <PlayCircle size={12} /> {formattedTime}
        </button>
      );
      lastIndex = regex.lastIndex;
    }
    
    parts.push(<span key={lastIndex}>{content.slice(lastIndex)}</span>);
    return <p className="prose">{parts}</p>;
  };

  const isProcessing = status === 'uploading' || status === 'processing';
  const ytId = activeYtUrl ? extractYouTubeId(activeYtUrl) : null;

  return (
    <div className="app-wrapper">
      {/* ── CINEMATIC BACKGROUND VIDEO ── */}
      <video autoPlay loop muted playsInline className="background-video">
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      <div className="app-container">
        <header className="bento-panel top-navbar">
          <div className="nav-brand">
            <Sparkles className="nav-brand-icon" size={24} />
            Axion
          </div>
          <div className="nav-status" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>LMS Video Companion</span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <span style={{ color: status === 'ready' ? '#10B981' : 'var(--text-light)' }}>
              {status === 'idle' ? 'Ready' : status === 'ready' ? 'Online' : 'Processing…'}
            </span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button 
              onClick={() => {
                localStorage.removeItem("axion_jwt");
                router.push('/login');
              }} 
              className="pill-tab"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Sign Out
            </button>
          </div>
        </header>

      <main className="main-content">
        {!file && !activeYtUrl ? (
          /* ── EMPTY STATE / HERO ── */
          <div className="bento-panel hero-panel">
            <div className="hero-card">
              <h1>Start Building.</h1>
              <p className="subtitle">Upload a lecture or paste a YouTube link to generate your interactive companion.</p>
              
              <label className={`upload-zone ${status === 'uploading' ? 'dragging' : ''}`} style={{ display: 'block', marginBottom: '2rem' }}>
                <UploadCloud size={32} style={{ margin: '0 auto 1rem', color: 'var(--text-main)' }} />
                <p className="upload-text">Drag & drop your media</p>
                <p className="upload-subtext">Supports .mp4, .mp3, .wav files</p>
                <input 
                  type="file" 
                  className="file-input" 
                  accept="audio/*,video/*"
                  onChange={handleFileChange}
                  disabled={status !== 'idle'}
                />
              </label>

              <form onSubmit={handleYoutubeSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <LinkIcon size={20} style={{ position: 'absolute', left: 20, top: 16, color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="pill-input"
                    placeholder="Paste a YouTube URL..." 
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    disabled={status !== 'idle'}
                  />
                </div>
                  <button 
                    type="submit" 
                    className="pill-btn"
                    disabled={!ytUrl.trim() || status !== 'idle'}
                  >
                    Ingest <span style={{ color: 'var(--text-muted)' }}>→</span>
                  </button>
              </form>
            </div>
          </div>
        ) : (
          /* ── ACTIVE WORKSPACE ── */
          <>
            {/* THEATER VIEW (Left/Center) */}
            <div className="bento-panel theater-panel">
              
              {/* Status Banner (if processing) */}
              {status !== 'idle' && status !== 'ready' && (
                <div style={{ padding: '16px', background: 'var(--panel-alt)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                  <Loader2 className="processing-spinner" style={{ margin: 0 }} size={20} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Processing Media...</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {pipelineInfo.step || 'Initializing pipeline...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Custom Video Player */}
              <div className="custom-player-wrapper">
                <div className={`custom-player ${isProcessing ? 'player-dimmed' : ''}`}>
                  {ytId ? (
                    <iframe
                      ref={ytIframeRef}
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ border: 'none', display: 'block' }}
                    />
                  ) : fileUrl && file?.type.startsWith('video/') ? (
                    <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : fileUrl ? (
                    <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={fileUrl} controls style={{ width: '100%', marginTop: 'auto' }} />
                  ) : null}
                </div>

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="player-processing-overlay">
                    <div className="processing-content">
                      <div className="processing-spinner">
                        <Sparkles size={32} />
                      </div>
                      <p className="processing-step">{pipelineInfo.step || 'Initializing…'}</p>
                      <div className="processing-bar-track">
                        <div 
                          className="processing-bar-fill"
                          style={{ width: `${pipelineInfo.progress || 5}%` }}
                        />
                      </div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{pipelineInfo.progress || 5}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Card */}
              {summary.length > 0 && (
                <div className="summary-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Smart Summary
                    </h2>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className={`pill-tab ${summaryType === 'topic' ? 'active' : ''}`}
                        onClick={() => videoId && fetchSummary('topic', videoId)}
                        disabled={isSummarizing}
                      >
                        Topic Overview
                      </button>
                      <button 
                        className={`pill-tab ${summaryType === 'last_5_mins' ? 'active' : ''}`}
                        onClick={() => videoId && fetchSummary('last_5_mins', videoId)}
                        disabled={isSummarizing}
                      >
                        Last 5 Mins
                      </button>
                    </div>
                  </div>

                  {isSummarizing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>
                      <Loader2 size={16} className="processing-spinner" style={{ margin: 0 }} /> Generating summary...
                    </div>
                  ) : (
                    <ul className="summary-list">
                      {summary.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* CHAT SIDEBAR (Right) */}
            <div className="bento-panel sidebar-panel">
              <nav className="tab-nav">
                <button 
                  className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('chat')}
                  title="Chat"
                >
                  <MessageSquare size={18} />
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('notes')}
                  title="Notes"
                >
                  <BookOpen size={18} />
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('flashcards')}
                  title="Flashcards"
                >
                  <CreditCard size={18} />
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('quiz')}
                  title="Quiz"
                >
                  <Brain size={18} />
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'mock_test' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('mock_test')}
                  title="Mock Test"
                >
                  <ClipboardCheck size={18} />
                </button>
              </nav>

              {activeTab === 'chat' ? (
                <>
                  <header className="chat-header">
                    <div className="chat-header-icon">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h2>Axion Assistant</h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Powered by Gemini Flash-Lite</p>
                    </div>
                  </header>

                  <div className="chat-messages">
                    {messages.map((msg, i) => (
                      <div key={i} className={`message ${msg.role}`}>
                        <div className="message-bubble">
                          {msg.role === 'assistant' ? (
                            msg.content === "" && isStreaming ? (
                              <div style={{ display: 'flex', gap: '4px', padding: '4px' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}></div>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}></div>
                              </div>
                            ) : (
                              renderMessageContent(msg.content)
                            )
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="chat-input-wrapper">
                    <form className="chat-input-box" onSubmit={handleChat}>
                      <input 
                        type="text" 
                        placeholder={status === 'ready' ? "Ask about the video..." : "Waiting for media..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={status !== 'ready' || isStreaming}
                      />
                      <button 
                        type="submit" 
                        className="send-button"
                        disabled={!query.trim() || status !== 'ready' || isStreaming}
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                </>
              ) : activeTab === 'notes' ? (
                <NotesViewer videoId={videoId || ""} />
              ) : activeTab === 'flashcards' ? (
                <FlashcardDeck videoId={videoId || ""} />
              ) : activeTab === 'quiz' ? (
                <QuizEngine videoId={videoId || ""} />
              ) : (
                <MockTest videoId={videoId || ""} />
              )}
            </div>

          </>
        )}
      </main>
      </div>
    </div>
  );
}
