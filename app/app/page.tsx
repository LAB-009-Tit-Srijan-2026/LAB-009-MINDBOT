"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, CheckCircle, Loader2, Send, PlayCircle, Link as LinkIcon, Sparkles } from 'lucide-react';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Poll pipeline status from backend ──
  const pollStatus = useCallback(async (id: string) => {
    setVideoId(id);
    setStatus('processing');

    // Poll the /status endpoint every 3s until ready or error
    for (let attempt = 0; attempt < 120; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        const res = await fetch(`${API_BASE}/status/${id}`);
        const data: PipelineStatus = await res.json();
        setPipelineInfo(data);

        if (data.status === 'ready') {
          // Fetch summary now that pipeline is done
          try {
            const summaryRes = await fetch(`${API_BASE}/summary/last_5_mins?video_id=${id}&current_time=0`);
            const summaryData = await summaryRes.json();
            const summaryText = summaryData.summary || "";
            if (summaryText && !summaryText.toLowerCase().includes("please provide")) {
              const bullets = summaryText
                .split('\n')
                .map((line: string) => line.replace(/^[•\-\*]\s*/, '').trim())
                .filter(Boolean);
              setSummary(bullets);
            }
          } catch { /* summary is optional */ }

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
      const res = await fetch(`${API_BASE}/ingest`, {
        method: 'POST',
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
        headers: { 'Content-Type': 'application/json' },
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
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: "" }]);
    setQuery("");
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: "demo-session",
          video_id: videoId,
          query: userMessage.content
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
    <main className="app-container">
      {/* ── LEFT PANEL (Ingestion & Summary) ── */}
      <section className="panel-left">
        <h1>Axion</h1>
        <p className="subtitle">LMS Video Companion RAG Dashboard</p>

        {/* Upload Zone */}
        {!file && !activeYtUrl && (
          <div style={{ marginBottom: '2rem' }}>
            <label className={`upload-zone ${status === 'uploading' ? 'dragging' : ''}`} style={{ display: 'block', marginBottom: '1rem' }}>
              <UploadCloud className="upload-icon" style={{ margin: '0 auto 1rem' }} />
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

            <form onSubmit={handleYoutubeSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Or paste a YouTube URL..." 
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  disabled={status !== 'idle'}
                  style={{
                    width: '100%',
                    padding: '0.6rem 1rem 0.6rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-bright)',
                    background: 'var(--bg-base)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <button 
                type="submit" 
                disabled={!ytUrl.trim() || status !== 'idle'}
                style={{
                  padding: '0 1.2rem',
                  borderRadius: '8px',
                  background: 'var(--accent-base)',
                  color: '#fff',
                  border: 'none',
                  cursor: !ytUrl.trim() || status !== 'idle' ? 'not-allowed' : 'pointer',
                  opacity: !ytUrl.trim() || status !== 'idle' ? 0.5 : 1
                }}
              >
                Ingest
              </button>
            </form>
          </div>
        )}

        {/* ── Custom Video Player with Processing Overlay ── */}
        {(activeYtUrl || fileUrl) && (
          <div className="custom-player-wrapper">
            {/* The actual player (YT iframe or HTML5 video/audio) */}
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
                <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={fileUrl} controls />
              ) : fileUrl ? (
                <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={fileUrl} controls />
              ) : null}
            </div>

            {/* ── Processing Overlay ── */}
            {isProcessing && (
              <div className="player-processing-overlay">
                <div className="processing-content">
                  <div className="processing-spinner">
                    <Sparkles size={28} className="sparkle-icon" />
                  </div>
                  <p className="processing-step">{pipelineInfo.step || 'Initializing…'}</p>
                  <div className="processing-bar-track">
                    <div 
                      className="processing-bar-fill"
                      style={{ width: `${pipelineInfo.progress || 5}%` }}
                    />
                  </div>
                  <p className="processing-percent">{pipelineInfo.progress || 5}%</p>
                </div>
              </div>
            )}

            {/* Ready badge */}
            {status === 'ready' && (
              <div className="player-ready-badge">
                <CheckCircle size={14} /> Ready
              </div>
            )}
          </div>
        )}

        {/* Summary Card */}
        {summary.length > 0 && (
          <div className="summary-card">
            <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Smart Summary</h2>
            <ul className="summary-list">
              {summary.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── RIGHT PANEL (Chat Interface) ── */}
      <section className="panel-right">
        <header className="chat-header">
          <div style={{ background: 'var(--accent-base)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 18 }}>✦</span>
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Axion Assistant</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Powered by Gemini Flash-Lite</p>
          </div>
        </header>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Upload a file or paste a YouTube URL to start chatting.</p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-bubble">
                {msg.role === 'assistant' ? (
                  msg.content === "" && isStreaming ? (
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
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
              <Send size={16} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
