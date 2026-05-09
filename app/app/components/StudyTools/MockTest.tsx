"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const API_BASE = "http://localhost:8000/api/v1";

type MockTestSchema = {
  multiple_choice: {
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }[];
  true_false: {
    statement: string;
    is_true: boolean;
    explanation: string;
  }[];
};

export default function MockTest({ videoId }: { videoId: string }) {
  const [testData, setTestData] = useState<MockTestSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({});
  const [tfAnswers, setTfAnswers] = useState<Record<number, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    async function fetchTest() {
      try {
        const token = localStorage.getItem("axion_jwt");
        const res = await fetch(`${API_BASE}/study-material?video_id=${videoId}&material_type=mock_test`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setTestData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load mock test.");
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [videoId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', color: 'var(--text-muted)' }}>
        <Loader2 className="processing-spinner" size={32} />
        <p style={{ marginTop: '16px' }}>Generating AI Mock Test...</p>
      </div>
    );
  }

  if (error || !testData) {
    return <div style={{ color: 'var(--accent-red)', padding: '24px' }}>{error || "Failed to load"}</div>;
  }

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  let totalScore = 0;
  const maxScore = testData.multiple_choice.length + testData.true_false.length;

  if (isSubmitted) {
    testData.multiple_choice.forEach((q, i) => {
      if (mcqAnswers[i] === q.correct_answer) totalScore++;
    });
    testData.true_false.forEach((q, i) => {
      if (tfAnswers[i] === q.is_true) totalScore++;
    });
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      
      {isSubmitted && (
        <div className="bento-panel" style={{ textAlign: 'center', padding: '24px', marginBottom: '32px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981' }}>
          <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '8px' }}>Test Complete</h2>
          <p style={{ fontSize: '1.2rem', color: '#10B981' }}>Score: {totalScore} / {maxScore}</p>
        </div>
      )}

      {/* MCQ Section */}
      <h3 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '24px' }}>
        Section 1: Multiple Choice
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '48px' }}>
        {testData.multiple_choice.map((q, i) => (
          <div key={i}>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginBottom: '16px', lineHeight: 1.5 }}>
              {i + 1}. {q.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {q.options.map((opt, j) => {
                let bg = 'rgba(255,255,255,0.05)';
                let border = '1px solid var(--border-color)';
                
                if (isSubmitted) {
                  if (opt === q.correct_answer) {
                    bg = 'rgba(16, 185, 129, 0.1)'; border = '1px solid #10B981';
                  } else if (mcqAnswers[i] === opt) {
                    bg = 'rgba(239, 68, 68, 0.1)'; border = '1px solid var(--accent-red)';
                  }
                } else if (mcqAnswers[i] === opt) {
                  bg = 'rgba(255,255,255,0.1)'; border = '1px solid #fff';
                }

                return (
                  <button 
                    key={j} 
                    disabled={isSubmitted}
                    onClick={() => setMcqAnswers(prev => ({...prev, [i]: opt}))}
                    style={{ padding: '12px 16px', borderRadius: '8px', background: bg, border, color: 'var(--text-light)', textAlign: 'left', cursor: isSubmitted ? 'default' : 'pointer' }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {isSubmitted && (
              <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{color:'#fff'}}>Explanation:</strong> {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* True/False Section */}
      <h3 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '24px' }}>
        Section 2: True or False
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '48px' }}>
        {testData.true_false.map((q, i) => (
          <div key={i}>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginBottom: '16px', lineHeight: 1.5 }}>
              {i + 1}. {q.statement}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[true, false].map((val) => {
                let bg = 'rgba(255,255,255,0.05)';
                let border = '1px solid var(--border-color)';
                
                if (isSubmitted) {
                  if (val === q.is_true) {
                    bg = 'rgba(16, 185, 129, 0.1)'; border = '1px solid #10B981';
                  } else if (tfAnswers[i] === val) {
                    bg = 'rgba(239, 68, 68, 0.1)'; border = '1px solid var(--accent-red)';
                  }
                } else if (tfAnswers[i] === val) {
                  bg = 'rgba(255,255,255,0.1)'; border = '1px solid #fff';
                }

                return (
                  <button 
                    key={val.toString()} 
                    disabled={isSubmitted}
                    onClick={() => setTfAnswers(prev => ({...prev, [i]: val}))}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', background: bg, border, color: 'var(--text-light)', cursor: isSubmitted ? 'default' : 'pointer' }}
                  >
                    {val ? "True" : "False"}
                  </button>
                );
              })}
            </div>
            {isSubmitted && (
              <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <strong style={{color:'#fff'}}>Explanation:</strong> {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {!isSubmitted && (
        <button className="pill-btn" onClick={handleSubmit} style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
          Submit Mock Test
        </button>
      )}
    </div>
  );
}
