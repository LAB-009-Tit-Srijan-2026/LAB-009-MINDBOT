"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

import { API_BASE } from '@/lib/api';
type Card = { front: string; back: string };

export default function FlashcardDeck({ videoId }: { videoId: string }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem("axion_jwt");
        const res = await fetch(`${API_BASE}/study-material?video_id=${videoId}&material_type=flashcards`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({ detail: "Error." }));
          throw new Error(d.detail || "Failed.");
        }
        const data = await res.json();
        if (Array.isArray(data)) setCards(data);
        else throw new Error("Invalid format.");
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetch_();
  }, [videoId]);

  const go = (dir: 1|-1) => {
    setFlipped(false);
    setTimeout(() => setIdx(i => Math.max(0, Math.min(cards.length-1, i+dir))), 180);
  };

  if (loading) return (
    <div className="state-center">
      <Loader2 size={22} className="spin" color="var(--accent)"/>
      <p className="state-title">Building flashcards…</p>
    </div>
  );

  if (error) return (
    <div style={{padding:24}}>
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderLeft:'3px solid var(--accent)',borderRadius:10,padding:'16px 18px'}}>
        <p style={{fontWeight:700,fontSize:'0.8rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-2)',marginBottom:6}}>Notice</p>
        <p style={{fontSize:'0.875rem',color:'var(--text-2)',lineHeight:1.6}}>{error}</p>
      </div>
    </div>
  );

  if (!cards.length) return <div className="state-center"><p className="state-sub">No cards generated.</p></div>;

  return (
    <div className="fc-shell">
      <span className="fc-counter">{idx+1} / {cards.length}</span>

      <div className="fc-scene" onClick={()=>setFlipped(f=>!f)}>
        <div className={`fc-obj${flipped?' flipped':''}`}>
          <div className="fc-face fc-front">
            <p className="fc-q">{cards[idx].front}</p>
            <div className="fc-hint"><RotateCcw size={12}/> tap to flip</div>
          </div>
          <div className="fc-face fc-back">
            <p className="fc-a">{cards[idx].back}</p>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:10}}>
        <button className="btn" onClick={()=>go(-1)} disabled={idx===0}><ChevronLeft size={16}/> Prev</button>
        <button className="btn btn-primary" onClick={()=>go(1)} disabled={idx===cards.length-1}>Next <ChevronRight size={16}/></button>
      </div>
    </div>
  );
}
