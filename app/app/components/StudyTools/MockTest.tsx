"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';

import { API_BASE } from '@/lib/api';

type MockTestSchema = {
  multiple_choice: { question:string; options:string[]; correct_answer:string; explanation:string }[];
  true_false:      { statement:string; is_true:boolean; explanation:string }[];
};

export default function MockTest({ videoId }: { videoId: string }) {
  const [testData, setTestData] = useState<MockTestSchema|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mcq, setMcq] = useState<Record<number,string>>({});
  const [tf, setTf] = useState<Record<number,boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetch_() {
      try {
        const token = localStorage.getItem("axion_jwt");
        const res = await fetch(`${API_BASE}/study-material?video_id=${videoId}&material_type=mock_test`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const d = await res.json().catch(()=>({detail:"Error."}));
          throw new Error(d.detail||"Failed.");
        }
        setTestData(await res.json());
      } catch (err:any) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetch_();
  }, [videoId]);

  if (loading) return (
    <div className="state-center">
      <Loader2 size={22} className="spin" color="var(--accent)"/>
      <p className="state-title">Generating mock test…</p>
    </div>
  );

  if (error || !testData) return (
    <div style={{padding:24}}>
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderLeft:'3px solid var(--accent)',borderRadius:10,padding:'16px 18px'}}>
        <p style={{fontWeight:700,fontSize:'0.8rem',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-2)',marginBottom:6}}>Notice</p>
        <p style={{fontSize:'0.875rem',color:'var(--text-2)',lineHeight:1.6}}>{error||"Failed to load"}</p>
      </div>
    </div>
  );

  let score = 0;
  const max = testData.multiple_choice.length + testData.true_false.length;
  if (submitted) {
    testData.multiple_choice.forEach((q,i) => { if(mcq[i]===q.correct_answer) score++; });
    testData.true_false.forEach((q,i) => { if(tf[i]===q.is_true) score++; });
  }

  const optClass = (isCorrect:boolean, isSelected:boolean) => {
    if (!submitted) return `quiz-opt${isSelected?' selected':''}`;
    if (isCorrect)  return 'quiz-opt correct';
    if (isSelected) return 'quiz-opt wrong';
    return 'quiz-opt';
  };

  return (
    <div style={{padding:24,height:'100%',overflowY:'auto',display:'flex',flexDirection:'column',gap:32}}>
      {submitted && (
        <div style={{textAlign:'center',background:'var(--card)',border:'1px solid var(--border)',borderRadius:18,padding:28}}>
          <ClipboardCheck size={36} color="var(--accent)" style={{marginBottom:12}}/>
          <p style={{fontSize:'2.5rem',fontWeight:900,color:'var(--accent)',letterSpacing:'-0.04em'}}>{Math.round(score/max*100)}%</p>
          <p style={{color:'var(--text-2)',fontSize:'0.9rem'}}>{score} of {max} correct</p>
          <button className="btn btn-primary" style={{marginTop:16,padding:'10px 24px'}}
            onClick={()=>{setMcq({});setTf({});setSubmitted(false);}}>Retake</button>
        </div>
      )}

      {/* MCQ */}
      <div>
        <p style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-3)',marginBottom:16}}>
          Section 1 — Multiple Choice
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          {testData.multiple_choice.map((q,i) => (
            <div key={i} style={{display:'flex',flexDirection:'column',gap:10}}>
              <p style={{fontSize:'0.9rem',fontWeight:700,color:'var(--text-1)',lineHeight:1.55}}>{i+1}. {q.question}</p>
              <div className="quiz-options">
                {q.options.map((opt,j) => (
                  <button key={j} disabled={submitted}
                    className={optClass(opt===q.correct_answer, mcq[i]===opt)}
                    onClick={()=>setMcq(p=>({...p,[i]:opt}))}>
                    {opt}
                    {submitted && opt===q.correct_answer && <CheckCircle2 size={14}/>}
                    {submitted && mcq[i]===opt && opt!==q.correct_answer && <XCircle size={14}/>}
                  </button>
                ))}
              </div>
              {submitted && <div className="quiz-insight"><strong style={{display:'block',marginBottom:4,color:'var(--text-1)',fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>Explanation</strong>{q.explanation}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* T/F */}
      <div>
        <p style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-3)',marginBottom:16}}>
          Section 2 — True or False
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          {testData.true_false.map((q,i) => (
            <div key={i} style={{display:'flex',flexDirection:'column',gap:10}}>
              <p style={{fontSize:'0.9rem',fontWeight:700,color:'var(--text-1)',lineHeight:1.55}}>{i+1}. {q.statement}</p>
              <div style={{display:'flex',gap:8}}>
                {([true,false] as const).map(val => (
                  <button key={String(val)} disabled={submitted} style={{flex:1}}
                    className={optClass(val===q.is_true, tf[i]===val)}
                    onClick={()=>setTf(p=>({...p,[i]:val}))}>
                    {val ? 'True' : 'False'}
                  </button>
                ))}
              </div>
              {submitted && <div className="quiz-insight"><strong style={{display:'block',marginBottom:4,color:'var(--text-1)',fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>Explanation</strong>{q.explanation}</div>}
            </div>
          ))}
        </div>
      </div>

      {!submitted && (
        <button className="btn btn-primary" style={{padding:'13px',fontSize:'0.9rem',justifyContent:'center'}} onClick={()=>setSubmitted(true)}>
          Submit Mock Test
        </button>
      )}
    </div>
  );
}
