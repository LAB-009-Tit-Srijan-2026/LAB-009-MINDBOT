"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const API_BASE = "http://localhost:8000/api/v1";

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

export default function QuizEngine({ videoId }: { videoId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const token = localStorage.getItem("axion_jwt");
        const res = await fetch(`${API_BASE}/study-material?video_id=${videoId}&material_type=quiz`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (Array.isArray(data)) {
          setQuestions(data);
        } else {
          throw new Error("Invalid format received from AI.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [videoId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)' }}>
        <Loader2 className="processing-spinner" size={32} />
        <p style={{ marginTop: '16px' }}>Generating AI Quiz...</p>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'var(--accent-red)', padding: '24px' }}>{error}</div>;
  }

  if (questions.length === 0) return null;

  // Final Results Screen
  if (currentIndex >= questions.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', textAlign: 'center' }}>
        <CheckCircle2 size={64} style={{ color: 'var(--accent-blue)', marginBottom: '24px' }} />
        <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '8px' }}>Quiz Complete!</h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>
          You scored <strong style={{ color: '#fff' }}>{score}</strong> out of {questions.length}.
        </p>
        <button 
          className="pill-btn" 
          onClick={() => { setCurrentIndex(0); setScore(0); setIsSubmitted(false); setSelectedOption(null); }}
          style={{ marginTop: '32px' }}
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    if (selectedOption === currentQ.correct_answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setCurrentIndex(i => i + 1);
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
        Question {currentIndex + 1} of {questions.length}
      </div>

      <h3 style={{ color: '#fff', fontSize: '1.3rem', lineHeight: 1.5, marginBottom: '32px' }}>
        {currentQ.question}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentQ.options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.05)';
          let border = '1px solid var(--border-color)';
          let icon = null;

          if (isSubmitted) {
            if (opt === currentQ.correct_answer) {
              bg = 'rgba(16, 185, 129, 0.1)';
              border = '1px solid #10B981';
              icon = <CheckCircle2 size={18} color="#10B981" />;
            } else if (opt === selectedOption) {
              bg = 'rgba(239, 68, 68, 0.1)';
              border = '1px solid var(--accent-red)';
              icon = <XCircle size={18} color="var(--accent-red)" />;
            }
          } else if (opt === selectedOption) {
            bg = 'rgba(255,255,255,0.1)';
            border = '1px solid #fff';
          }

          return (
            <button
              key={i}
              disabled={isSubmitted}
              onClick={() => setSelectedOption(opt)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 24px', borderRadius: '12px', background: bg, border: border,
                color: 'var(--text-light)', fontSize: '1rem', textAlign: 'left', cursor: isSubmitted ? 'default' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {opt}
              {icon}
            </button>
          );
        })}
      </div>

      {isSubmitted && (
        <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderLeft: '4px solid var(--accent-blue)' }}>
          <strong style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>Explanation:</strong>
          <span style={{ color: 'var(--text-light)', lineHeight: 1.5 }}>{currentQ.explanation}</span>
        </div>
      )}

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
        {!isSubmitted ? (
          <button className="pill-btn" onClick={handleSubmit} disabled={!selectedOption}>
            Submit Answer
          </button>
        ) : (
          <button className="pill-btn" onClick={handleNext}>
            {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}
