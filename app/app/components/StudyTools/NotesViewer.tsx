"use client";

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

const API_BASE = "http://localhost:8000/api/v1";

export default function NotesViewer({ videoId }: { videoId: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNotes() {
      try {
        const token = localStorage.getItem("axion_jwt");
        const res = await fetch(`${API_BASE}/study-material?video_id=${videoId}&material_type=notes`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setContent(data.content);
      } catch (err: any) {
        setError(err.message || "Failed to load notes.");
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, [videoId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)' }}>
        <Loader2 className="processing-spinner" size={32} />
        <p style={{ marginTop: '16px' }}>Generating AI Notes...</p>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'var(--accent-red)', padding: '24px' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%', color: 'var(--text-light)', lineHeight: 1.6 }}>
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 style={{ color: '#fff', fontSize: '1.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }} {...props} />,
          h2: ({node, ...props}) => <h2 style={{ color: '#fff', fontSize: '1.4rem', marginTop: '24px', marginBottom: '12px' }} {...props} />,
          h3: ({node, ...props}) => <h3 style={{ color: '#fff', fontSize: '1.1rem', marginTop: '16px', marginBottom: '8px' }} {...props} />,
          ul: ({node, ...props}) => <ul style={{ paddingLeft: '24px', marginBottom: '16px' }} {...props} />,
          li: ({node, ...props}) => <li style={{ marginBottom: '8px' }} {...props} />,
          p: ({node, ...props}) => <p style={{ marginBottom: '16px' }} {...props} />,
          strong: ({node, ...props}) => <strong style={{ color: 'var(--accent-blue)' }} {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote style={{ borderLeft: '4px solid var(--accent-red)', paddingLeft: '16px', margin: '16px 0', color: 'var(--text-muted)', fontStyle: 'italic' }} {...props} />
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
