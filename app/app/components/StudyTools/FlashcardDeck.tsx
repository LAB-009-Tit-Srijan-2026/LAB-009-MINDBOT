"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import './FlashcardDeck.css';

const API_BASE = "http://localhost:8000/api/v1";

type Flashcard = {
  front: string;
  back: string;
};

export default function FlashcardDeck({ videoId }: { videoId: string }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    async function fetchCards() {
      try {
        const token = localStorage.getItem("axion_jwt");
        const res = await fetch(`${API_BASE}/study-material?video_id=${videoId}&material_type=flashcards`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (Array.isArray(data)) {
          setCards(data);
        } else {
          throw new Error("Invalid format received from AI.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load flashcards.");
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, [videoId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)' }}>
        <Loader2 className="processing-spinner" size={32} />
        <p style={{ marginTop: '16px' }}>Generating AI Flashcards...</p>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'var(--accent-red)', padding: '24px' }}>{error}</div>;
  }

  if (cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1)), 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => Math.max(0, prev - 1)), 150);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px' }}>
      
      <div className="flashcard-progress">
        Card {currentIndex + 1} of {cards.length}
      </div>

      <div className="flashcard-scene" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`flashcard-object ${isFlipped ? 'is-flipped' : ''}`}>
          <div className="flashcard-face flashcard-front">
            <h3>{currentCard.front}</h3>
            <div className="flip-hint">
              <RotateCw size={16} /> Click to flip
            </div>
          </div>
          <div className="flashcard-face flashcard-back">
            <p>{currentCard.back}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
        <button className="pill-btn" onClick={handlePrev} disabled={currentIndex === 0}>
          <ChevronLeft size={20} />
        </button>
        <button className="pill-btn" onClick={handleNext} disabled={currentIndex === cards.length - 1}>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
