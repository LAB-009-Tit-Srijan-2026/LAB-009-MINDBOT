"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '@/lib/api';

type Q = { question: string; options: string[]; correct_answer: string; explanation: string };

export default function QuizEngine({ videoId }: { videoId: string }) {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem("axion_jwt");
        const res = await fetch(`${API_BASE}/study-material?video_id=${videoId}&material_type=quiz`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const raw = await res.text();
        if (!res.ok) {
          let detail = "Failed to load quiz.";
          try { detail = JSON.parse(raw).detail || detail; } catch {}
          throw new Error(detail);
        }
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const data = JSON.parse(cleaned);
        const arr = Array.isArray(data) ? data : (data.questions ?? data.quiz ?? []);
        setQuestions(arr);
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetch_();
  }, [videoId]);

  if (loading) return (
    <div className="state-center" style={{ minHeight: '300px' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 size={32} color="var(--accent)"/>
      </motion.div>
      <p className="state-title" style={{ marginTop: 16 }}>Building your assessment…</p>
      <p className="state-sub">AI is analyzing the transcript for key concepts.</p>
    </div>
  );

  if (error) return (
    <div style={{padding:24}}>
      <div className="error-card-aurora">
        <p className="error-label">Notice</p>
        <p className="error-text">{error}</p>
      </div>
    </div>
  );

  if (questions.length === 0) return <div className="state-center"><p className="state-sub">No questions available.</p></div>;

  if (idx >= questions.length) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="state-center" 
        style={{ minHeight: '400px' }}
      >
        <div className="trophy-container">
          <Trophy size={48} color="var(--accent)"/>
          <div className="trophy-glow" />
        </div>
        <p className="state-title" style={{ fontSize: '1.5rem', marginBottom: 4 }}>Quiz Complete!</p>
        <div className="score-display">
          <span className="score-number">{percent}%</span>
          <span className="score-sub">{score} / {questions.length} correct</span>
        </div>
        <button 
          className="btn-pill-primary" 
          style={{ marginTop: 24 }}
          onClick={() => { setIdx(0); setScore(0); setSubmitted(false); setSelected(null); }}
        >
          <RotateCcw size={16} /> Retake Assessment
        </button>
      </motion.div>
    );
  }

  const q = questions[idx];
  const progress = ((idx) / questions.length) * 100;

  return (
    <div className="quiz-container-modern">
      {/* Progress Header */}
      <div className="quiz-header">
        <div className="quiz-progress-info">
          <span className="quiz-step-label">Question {idx + 1} of {questions.length}</span>
          <span className="quiz-score-live">{Math.round(score / (idx || 1) * 100)}% Accuracy</span>
        </div>
        <div className="quiz-progress-bar">
          <motion.div 
            className="quiz-progress-fill" 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="quiz-content"
        >
          <h3 className="quiz-question-text">{q.question}</h3>

          <div className="quiz-options-grid">
            {q.options.map((opt, i) => {
              let state: 'idle' | 'selected' | 'correct' | 'wrong' = 'idle';
              if (submitted) {
                if (opt === q.correct_answer) state = 'correct';
                else if (opt === selected) state = 'wrong';
              } else if (opt === selected) {
                state = 'selected';
              }

              return (
                <button
                  key={i}
                  className={`quiz-option-card ${state}`}
                  disabled={submitted}
                  onClick={() => setSelected(opt)}
                >
                  <div className="opt-index">{String.fromCharCode(65 + i)}</div>
                  <span className="opt-text">{opt}</span>
                  {state === 'correct' && <CheckCircle2 size={18} className="opt-icon" />}
                  {state === 'wrong' && <XCircle size={18} className="opt-icon" />}
                </button>
              );
            })}
          </div>

          {submitted && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="quiz-explanation-box"
            >
              <div className="exp-header">
                <Brain size={14} />
                <span>Expert Explanation</span>
              </div>
              <p>{q.explanation}</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="quiz-footer">
        {!submitted ? (
          <button 
            className="btn-pill-primary" 
            disabled={!selected}
            onClick={() => {
              setSubmitted(true);
              if (selected === q.correct_answer) setScore(s => s + 1);
            }}
          >
            Submit Answer <ArrowRight size={16} />
          </button>
        ) : (
          <button 
            className="btn-pill-primary"
            onClick={() => {
              setSelected(null);
              setSubmitted(false);
              setIdx(i => i + 1);
            }}
          >
            {idx === questions.length - 1 ? 'See Results' : 'Next Question'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// Re-using styles from globals.css where possible, adding specific ones here via helper classes or new CSS
import { Brain } from 'lucide-react';

